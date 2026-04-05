// Speech store: STT and TTS via Web Speech API

type SpeechStatus = 'idle' | 'listening' | 'processing' | 'speaking';

export interface VoiceOption {
	name: string;
	lang: string;
	region: string;
	gender: 'female' | 'male' | 'unknown';
	quality: 'premium' | 'standard';
	localService: boolean;
	label: string;
}

const SILENCE_TIMEOUT = 2000;

function scoreVoice(v: SpeechSynthesisVoice): number {
	const n = v.name.toLowerCase();
	if (n === 'google us english') return 100;
	if (n === 'google uk english female') return 95;
	if (n.includes('google') && n.includes('english')) return 90;
	if (n.includes('google') && v.lang.startsWith('en')) return 85;
	if (n === 'samantha') return 80;
	if (n === 'karen') return 78;
	if (n === 'daniel') return 76;
	if (n === 'moira') return 74;
	if (n.includes('microsoft') && n.includes('aria')) return 80;
	if (n.includes('microsoft') && n.includes('jenny')) return 78;
	if (n.includes('microsoft') && n.includes('guy')) return 76;
	if (n.includes('microsoft') && v.lang.startsWith('en')) return 65;
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
	if (n.includes('english female') || n.includes('english woman')) return 'female';
	if (n.includes('english male') || n.includes('english man')) return 'male';
	return 'unknown';
}

function detectQuality(v: SpeechSynthesisVoice): 'premium' | 'standard' {
	const n = v.name.toLowerCase();
	if (!v.localService) return 'premium';
	if (n.includes('enhanced') || n.includes('premium') || n.includes('neural')) return 'premium';
	const premiumNames = ['samantha', 'daniel', 'karen', 'moira', 'fiona', 'serena',
		'aria', 'jenny', 'guy', 'nicky', 'siri'];
	if (premiumNames.some((name) => n.includes(name))) return 'premium';
	return 'standard';
}

function makeLabel(v: SpeechSynthesisVoice): string {
	return v.name.replace(/\s*\(.*?\)\s*$/, '').trim();
}

function createSpeechStore() {
	let status = $state<SpeechStatus>('idle');
	let interimTranscript = $state('');

	let availableVoices = $state<VoiceOption[]>([]);
	// Narrator / AI opponent in human-vs-ai / fallback voice
	let selectedVoiceName = $state<string>('');
	// AI vs AI: separate voice names per debater
	let ai1VoiceName = $state<string>('');
	let ai2VoiceName = $state<string>('');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let recognition: any = null;
	let ttsAbortController: AbortController | null = null;

	function getSortedEnglishVoices(): SpeechSynthesisVoice[] {
		return speechSynthesis.getVoices()
			.filter((v) => v.lang.startsWith('en'))
			.sort((a, b) => scoreVoice(b) - scoreVoice(a));
	}

	function populateVoices() {
		const english = getSortedEnglishVoices();

		availableVoices = english.map((v) => ({
			name: v.name,
			lang: v.lang,
			region: extractRegion(v.lang),
			gender: detectGender(v),
			quality: detectQuality(v),
			localService: v.localService,
			label: makeLabel(v)
		}));

		if (!selectedVoiceName && availableVoices.length > 0) {
			selectedVoiceName = availableVoices[0].name;
		}
		// Auto-assign AI vs AI voices to 1st and 2nd best distinct voices
		if (!ai1VoiceName && availableVoices.length > 0) {
			ai1VoiceName = availableVoices[0].name;
		}
		if (!ai2VoiceName && availableVoices.length > 1) {
			ai2VoiceName = availableVoices[1].name;
		}
	}

	function resolveVoice(name?: string): SpeechSynthesisVoice | null {
		const all = speechSynthesis.getVoices();
		const target = name ?? selectedVoiceName;
		if (target) {
			const found = all.find((v) => v.name === target);
			if (found) return found;
		}
		return getSortedEnglishVoices()[0] ?? null;
	}

	return {
		get status() { return status; },
		get interimTranscript() { return interimTranscript; },
		get availableVoices() { return availableVoices; },
		get selectedVoiceName() { return selectedVoiceName; },
		get ai1VoiceName() { return ai1VoiceName; },
		get ai2VoiceName() { return ai2VoiceName; },

		initVoices() {
			populateVoices();
			// Chrome loads voices async — keep retrying until we have them
			if (availableVoices.length === 0) {
				speechSynthesis.onvoiceschanged = () => populateVoices();
				// Also poll as a fallback in case onvoiceschanged doesn't fire
				const poll = setInterval(() => {
					if (availableVoices.length > 0) {
						clearInterval(poll);
					} else {
						populateVoices();
					}
				}, 100);
				setTimeout(() => clearInterval(poll), 5000);
			}
		},

		setVoice(name: string) { selectedVoiceName = name; },
		setAi1Voice(name: string) { ai1VoiceName = name; },
		setAi2Voice(name: string) { ai2VoiceName = name; },

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

		// TTS via Web Speech API. voiceName overrides the selected voice (used for AI vs AI).
		async speak(text: string, voiceName?: string): Promise<void> {
			this.stopSpeaking();
			ttsAbortController = new AbortController();
			const signal = ttsAbortController.signal;
			status = 'speaking';

			await new Promise<void>((resolve) => {
				const utterance = new SpeechSynthesisUtterance(text);
				utterance.rate = 0.92;
				utterance.pitch = 1.0;

				const voice = resolveVoice(voiceName);
				if (voice) {
					utterance.voice = voice;
				} else {
					speechSynthesis.onvoiceschanged = () => {
						const v = resolveVoice(voiceName);
						if (v) utterance.voice = v;
						speechSynthesis.onvoiceschanged = null;
					};
				}

				utterance.onend = () => resolve();
				utterance.onerror = () => resolve();
				if (!signal.aborted) speechSynthesis.speak(utterance);
				else resolve();
			});

			if (!signal.aborted) status = 'idle';
		},

		stopSpeaking() {
			ttsAbortController?.abort();
			ttsAbortController = null;
			speechSynthesis.cancel();
			status = 'idle';
		},

		// iOS Safari requires speechSynthesis to be "unlocked" via a direct user
		// gesture. Call this synchronously inside any click/tap handler before
		// any async work, so that later speak() calls are permitted.
		unlockAudio() {
			const u = new SpeechSynthesisUtterance('');
			speechSynthesis.speak(u);
			speechSynthesis.cancel();
		}
	};
}

export const speech = createSpeechStore();
