// Speech store: STT via Web Speech API, TTS via Kokoro-js
// Kokoro is loaded lazily on first use to avoid blocking the LLM load

type SpeechStatus = 'idle' | 'listening' | 'processing' | 'speaking';

export interface VoiceOption {
	name: string;
	lang: string;
	region: string;   // 'US' | 'UK' | 'AU' | 'CA' | ...
	gender: 'female' | 'male' | 'unknown';
	quality: 'premium' | 'standard'; // premium = neural/online/enhanced
	localService: boolean;
	label: string;
}

// Silence duration (ms) after last speech before auto-submitting
const SILENCE_TIMEOUT = 2000;

/** Score a voice so we can pick the best default cross-platform */
function scoreVoice(v: SpeechSynthesisVoice): number {
	const n = v.name.toLowerCase();
	// Tier 1 – known high-quality neural/online voices
	if (n === 'google us english') return 100;
	if (n === 'google uk english female') return 95;
	if (n.includes('google') && n.includes('english')) return 90;
	if (n.includes('google') && v.lang.startsWith('en')) return 85;
	// macOS/iOS neural
	if (n === 'samantha') return 80;
	if (n === 'karen') return 78;
	if (n === 'daniel') return 76;
	if (n === 'moira') return 74;
	// Windows neural
	if (n.includes('microsoft') && n.includes('aria')) return 80;
	if (n.includes('microsoft') && n.includes('jenny')) return 78;
	if (n.includes('microsoft') && n.includes('guy')) return 76;
	if (n.includes('microsoft') && v.lang.startsWith('en')) return 65;
	// Any local English voice
	if (v.lang === 'en-US' && v.localService) return 50;
	if (v.lang.startsWith('en-') && v.localService) return 40;
	if (v.lang.startsWith('en')) return 30;
	return 0;
}

const REGION_MAP: Record<string, string> = {
	'en-US': 'US', 'en-GB': 'UK', 'en-AU': 'AU', 'en-CA': 'CA',
	'en-IN': 'IN', 'en-IE': 'IE', 'en-ZA': 'ZA', 'en-NZ': 'NZ',
	'en-NG': 'NG', 'en-PH': 'PH', 'en-SG': 'SG'
};

function extractRegion(lang: string): string {
	return REGION_MAP[lang] ?? lang.replace('en-', '').toUpperCase();
}

function detectGender(v: SpeechSynthesisVoice): 'female' | 'male' | 'unknown' {
	const n = v.name.toLowerCase();
	const female = ['samantha', 'karen', 'victoria', 'moira', 'fiona', 'allison', 'ava', 'susan',
		'zira', 'jenny', 'aria', 'female', 'woman', 'alice', 'kate', 'serena', 'tessa',
		'veena', 'nicky', 'junior', 'amelie', 'joana', 'sandy', 'milena'];
	const male = ['daniel', 'david', 'alex', 'fred', 'tom', 'guy', 'male', 'man', 'james',
		'arthur', 'rishi', 'aaron', 'reed', 'luca', 'evan', 'nathan'];
	if (female.some((w) => n.includes(w))) return 'female';
	if (male.some((w) => n.includes(w))) return 'male';
	// Google voices encode gender in name
	if (n.includes('english female') || n.includes('english woman')) return 'female';
	if (n.includes('english male') || n.includes('english man')) return 'male';
	return 'unknown';
}

function detectQuality(v: SpeechSynthesisVoice): 'premium' | 'standard' {
	const n = v.name.toLowerCase();
	// Online voices are always neural
	if (!v.localService) return 'premium';
	// Known enhanced/neural local voices
	if (n.includes('enhanced') || n.includes('premium') || n.includes('neural')) return 'premium';
	const premiumNames = ['samantha', 'daniel', 'karen', 'moira', 'fiona', 'serena',
		'aria', 'jenny', 'guy', 'nicky', 'siri'];
	if (premiumNames.some((name) => n.includes(name))) return 'premium';
	return 'standard';
}

function makeLabel(v: SpeechSynthesisVoice): string {
	const name = v.name.replace(/\s*\(.*?\)\s*$/, '').trim();
	return name;
}

function createSpeechStore() {
	let status = $state<SpeechStatus>('idle');
	let interimTranscript = $state('');
	let kokoro = $state<unknown>(null);
	let kokoroLoading = $state(false);

	// Available English voices — populated by initVoices()
	let availableVoices = $state<VoiceOption[]>([]);
	let selectedVoiceName = $state<string>('');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let recognition: any = null;
	let audioCtx: AudioContext | null = null;
	let ttsAbortController: AbortController | null = null;

	function getAudioContext() {
		if (!audioCtx) audioCtx = new AudioContext();
		return audioCtx;
	}

	function populateVoices() {
		const all = speechSynthesis.getVoices();
		const english = all
			.filter((v) => v.lang.startsWith('en'))
			.sort((a, b) => scoreVoice(b) - scoreVoice(a));

		availableVoices = english.map((v) => ({
			name: v.name,
			lang: v.lang,
			region: extractRegion(v.lang),
			gender: detectGender(v),
			quality: detectQuality(v),
			localService: v.localService,
			label: makeLabel(v)
		}));

		// Auto-select best if nothing chosen yet
		if (!selectedVoiceName && availableVoices.length > 0) {
			selectedVoiceName = availableVoices[0].name;
		}
	}

	function getSelectedVoice(): SpeechSynthesisVoice | null {
		const all = speechSynthesis.getVoices();
		if (selectedVoiceName) {
			const found = all.find((v) => v.name === selectedVoiceName);
			if (found) return found;
		}
		// Fallback: pick highest-scoring
		return all.filter((v) => v.lang.startsWith('en')).sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null;
	}

	async function loadKokoro() {
		if (kokoro || kokoroLoading) return;
		kokoroLoading = true;
		try {
			const { KokoroTTS } = await import('kokoro-js');
			kokoro = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0', { dtype: 'q8' });
		} catch (e) {
			console.warn('Kokoro failed to load, using Web Speech API fallback:', e);
		} finally {
			kokoroLoading = false;
		}
	}

	async function playAudioData(floatData: Float32Array<ArrayBuffer>, sampleRate: number) {
		const ctx = getAudioContext();
		const buffer = ctx.createBuffer(1, floatData.length, sampleRate);
		buffer.copyToChannel(floatData, 0);
		return new Promise<void>((resolve) => {
			const source = ctx.createBufferSource();
			source.buffer = buffer;
			source.connect(ctx.destination);
			source.onended = () => resolve();
			source.start();
		});
	}

	return {
		get status() { return status; },
		get interimTranscript() { return interimTranscript; },
		get isKokoroReady() { return !!kokoro; },
		get isKokoroLoading() { return kokoroLoading; },
		get availableVoices() { return availableVoices; },
		get selectedVoiceName() { return selectedVoiceName; },

		/** Call once from setup page onMount to populate voice list */
		initVoices() {
			populateVoices();
			// Chrome loads voices async — re-populate when ready
			if (availableVoices.length === 0) {
				speechSynthesis.onvoiceschanged = () => {
					populateVoices();
					speechSynthesis.onvoiceschanged = null;
				};
			}
		},

		setVoice(name: string) {
			selectedVoiceName = name;
		},

		async initKokoro() {
			await loadKokoro();
		},

		// STT: continuous recognition with 2s silence auto-submit
		listen(): Promise<string> {
			return new Promise((resolve, reject) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
				if (!SpeechRecognition) {
					reject(new Error('SpeechRecognition not supported in this browser'));
					return;
				}

				recognition = new SpeechRecognition();
				recognition.continuous = true;
				recognition.interimResults = true;
				recognition.lang = 'en-US';

				status = 'listening';
				interimTranscript = '';

				let finalTranscript = '';
				let silenceTimer: ReturnType<typeof setTimeout> | null = null;
				let resolved = false;

				function finish(text: string) {
					if (resolved) return;
					resolved = true;
					if (silenceTimer) clearTimeout(silenceTimer);
					try { recognition.stop(); } catch { /* already stopped */ }
					interimTranscript = '';
					status = 'processing';
					resolve(text.trim());
				}

				function resetSilenceTimer() {
					if (silenceTimer) clearTimeout(silenceTimer);
					silenceTimer = setTimeout(() => {
						finish(finalTranscript || interimTranscript);
					}, SILENCE_TIMEOUT);
				}

				recognition.onresult = (event: Event & { resultIndex: number; results: SpeechRecognitionResultList }) => {
					let interim = '';
					for (let i = event.resultIndex; i < event.results.length; i++) {
						const t = event.results[i][0].transcript;
						if (event.results[i].isFinal) {
							finalTranscript += t + ' ';
						} else {
							interim = t;
						}
					}
					interimTranscript = interim;
					resetSilenceTimer();
				};

				recognition.onerror = (e: Event & { error: string }) => {
					if ((e as { error: string }).error === 'no-speech') return;
					status = 'idle';
					reject(new Error((e as { error: string }).error));
				};

				recognition.onend = () => {
					finish(finalTranscript || interimTranscript);
				};

				recognition.start();
			});
		},

		stopListening() {
			try { recognition?.stop(); } catch { /* ignore */ }
			status = 'idle';
			interimTranscript = '';
		},

		// TTS: Kokoro if ready, otherwise selected Web Speech API voice
		async speak(text: string): Promise<void> {
			this.stopSpeaking();
			ttsAbortController = new AbortController();
			const signal = ttsAbortController.signal;
			status = 'speaking';

			if (kokoro) {
				const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
				try {
					for (const sentence of sentences) {
						if (signal.aborted) break;
						const trimmed = sentence.trim();
						if (!trimmed) continue;
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const output = await (kokoro as any).generate(trimmed, { voice: 'af_heart' });
						if (signal.aborted) break;
						await playAudioData(output.audio.data as Float32Array<ArrayBuffer>, output.audio.sampling_rate);
					}
				} catch { /* abort or error */ }
			} else {
				await new Promise<void>((resolve) => {
					const utterance = new SpeechSynthesisUtterance(text);
					utterance.rate = 0.92;
					utterance.pitch = 1.0;

					const voice = getSelectedVoice();
					if (voice) {
						utterance.voice = voice;
					} else {
						// Voices not yet loaded — wait once
						speechSynthesis.onvoiceschanged = () => {
							const v = getSelectedVoice();
							if (v) utterance.voice = v;
							speechSynthesis.onvoiceschanged = null;
						};
					}

					utterance.onend = () => resolve();
					utterance.onerror = () => resolve();
					if (!signal.aborted) speechSynthesis.speak(utterance);
					else resolve();
				});
			}

			if (!signal.aborted) status = 'idle';
		},

		stopSpeaking() {
			ttsAbortController?.abort();
			ttsAbortController = null;
			speechSynthesis.cancel();
			status = 'idle';
		}
	};
}

export const speech = createSpeechStore();
