import * as webllm from '@mlc-ai/web-llm';
import type { DebateSide } from './debate.svelte.js';

export interface ModelOption {
	id: string;
	name: string;
	size: string;
	description: string;
	recommended?: boolean;
}

export const AVAILABLE_MODELS: ModelOption[] = [
	{
		id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
		name: 'Llama 3.2 · 3B',
		size: '~2 GB',
		description: 'Fast download. Basic reasoning.'
	},
	{
		id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
		name: 'Phi 3.5 Mini · 3.8B',
		size: '~2.5 GB',
		description: 'Strong instruction following for its size.'
	},
	{
		id: 'Mistral-7B-Instruct-v0.3-q4f16_1-MLC',
		name: 'Mistral 7B',
		size: '~4.6 GB',
		description: 'Sharp and fast. Good structured arguments.'
	},
	{
		id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
		name: 'Llama 3.1 · 8B',
		size: '~5 GB',
		description: 'Best balance of speed and reasoning.',
		recommended: true
	},
	{
		id: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC',
		name: 'Hermes 3 · 8B',
		size: '~5 GB',
		description: 'Fine-tuned for dialogue and debate.'
	},
	{
		id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
		name: 'Qwen 2.5 · 7B',
		size: '~5.1 GB',
		description: 'Precise and factual. Strong at structured reasoning.'
	}
];

/** Strip model artifacts that should never reach the user */
function cleanOutput(raw: string): string {
	return raw
		.replace(/ABORT[\s\S]*$/i, '')
		.replace(/\bNote\s*:.*$/gim, '')
		.replace(/^(I'?ve generated|Here is|I have generated|Here's)[^\n]*\n?/gim, '')
		.replace(/\[.*?\]/g, '')
		.replace(/[•·●◆◇▸▹]/g, '')
		.replace(/\n{3,}/g, '\n\n')
		.replace(/ {2,}/g, ' ')
		.trim();
}

/** Trim a turn's text to avoid blowing up the context window */
const MAX_TURN_CHARS = 400;
function trimTurn(text: string): string {
	if (text.length <= MAX_TURN_CHARS) return text;
	const cut = text.slice(0, MAX_TURN_CHARS);
	const lastPeriod = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
	return lastPeriod > 100 ? cut.slice(0, lastPeriod + 1) : cut + '…';
}

function createLLMStore() {
	let engine = $state<webllm.MLCEngine | null>(null);
	let loadProgress = $state(0);
	let loadStatus = $state('');
	let isLoading = $state(false);
	let isReady = $state(false);
	let isGenerating = $state(false);
	let selectedModelId = $state(AVAILABLE_MODELS.find((m) => m.recommended)?.id ?? AVAILABLE_MODELS[0].id);

	return {
		get loadProgress() { return loadProgress; },
		get loadStatus() { return loadStatus; },
		get isLoading() { return isLoading; },
		get isReady() { return isReady; },
		get isGenerating() { return isGenerating; },
		get selectedModelId() { return selectedModelId; },
		get selectedModel() { return AVAILABLE_MODELS.find((m) => m.id === selectedModelId) ?? AVAILABLE_MODELS[0]; },

		setModel(id: string) {
			if (isLoading || isReady) return; // can't change mid-session
			selectedModelId = id;
		},

		async load() {
			if (isReady || isLoading) return;
			isLoading = true;
			engine = new webllm.MLCEngine();
			engine.setInitProgressCallback((report) => {
				loadProgress = report.progress * 100;
				loadStatus = report.text;
			});
			await engine.reload(selectedModelId);
			isLoading = false;
			isReady = true;
		},

		async generateRebuttal(
			topic: string,
			aiSide: DebateSide,
			userSide: DebateSide,
			history: Array<{ speaker: 'user' | 'ai'; text: string }>,
			onToken: (token: string) => void
		): Promise<string> {
			if (!engine || !isReady) throw new Error('Engine not ready');
			isGenerating = true;

			const sideLabel = (s: DebateSide) => (s === 'for' ? 'FOR' : 'AGAINST');

			const messages: webllm.ChatCompletionMessageParam[] = [
				{
					role: 'system',
					content: `You are in a live debate. Topic: "${topic}".
YOU argue: ${sideLabel(aiSide)}
YOUR OPPONENT argues: ${sideLabel(userSide)}

Your job: directly challenge what your opponent just said. Find the weakness in their argument and attack it. Then reinforce your own position (${sideLabel(aiSide)}).

STRICT OUTPUT RULES:
- 2-3 sentences of plain prose. Nothing else.
- Never agree with your opponent or validate their point.
- No "Note:", no "I've generated", no meta-commentary, no greetings.
- No bullet points, dashes, or asterisks.
- Never say you are an AI. Stay in character as a debater.`
				},
				...history.map((t) => ({
					role: (t.speaker === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
					content: trimTurn(t.text)
				}))
			];

			const stream = await engine.chat.completions.create({
				messages,
				stream: true,
				temperature: 0.8,
				max_tokens: 250
			});

			let full = '';
			for await (const chunk of stream) {
				const delta = chunk.choices[0]?.delta?.content ?? '';
				if (delta) {
					full += delta;
					onToken(delta);
				}
			}

			isGenerating = false;
			return cleanOutput(full);
		},

		/**
		 * Generate a turn for one AI in an AI-vs-AI debate.
		 * Maps history so each AI sees its own past turns as 'assistant'
		 * and the opponent's turns as 'user'.
		 */
		async generateAiVsAiTurn(
			topic: string,
			thisSide: DebateSide,
			opponentSide: DebateSide,
			thisSpeaker: 'ai1' | 'ai2',
			history: Array<{ speaker: 'user' | 'ai' | 'ai1' | 'ai2'; text: string }>,
			onToken: (token: string) => void
		): Promise<string> {
			if (!engine || !isReady) throw new Error('Engine not ready');
			isGenerating = true;
			try {

			const sideLabel = (s: DebateSide) => (s === 'for' ? 'FOR' : 'AGAINST');
			const isOpening = history.length === 0;

			// Map history so each AI sees its own turns as 'assistant' and opponent's as 'user'.
			// Chat APIs require the first message after system to be 'user', so if this AI
			// spoke first (history starts with its own turn), prepend a synthetic user prompt.
			const mappedHistory = history.map((t) => ({
				role: (t.speaker === thisSpeaker ? 'assistant' : 'user') as 'user' | 'assistant',
				content: trimTurn(t.text)
			}));
			if (mappedHistory.length > 0 && mappedHistory[0].role === 'assistant') {
				mappedHistory.unshift({ role: 'user', content: 'Begin the debate.' });
			}

			const messages: webllm.ChatCompletionMessageParam[] = [
				{
					role: 'system',
					content: `You are in a live debate. Topic: "${topic}".
YOU argue: ${sideLabel(thisSide)}
YOUR OPPONENT argues: ${sideLabel(opponentSide)}

${isOpening
	? 'Make a strong opening argument for your position. State your core claim and your strongest supporting reason.'
	: `Directly challenge what your opponent just said. Find the weakness in their argument and attack it. Then reinforce your own position (${sideLabel(thisSide)}).`}

STRICT OUTPUT RULES:
- 2-3 sentences of plain prose. Nothing else.
- Never agree with your opponent or validate their point.
- No "Note:", no "I've generated", no meta-commentary, no greetings.
- No bullet points, dashes, or asterisks.
- Never say you are an AI. Stay in character as a debater.`
				},
				...mappedHistory
			];

			const stream = await engine.chat.completions.create({
				messages,
				stream: true,
				temperature: 0.85,
				max_tokens: 250
			});

			let full = '';
			for await (const chunk of stream) {
				const delta = chunk.choices[0]?.delta?.content ?? '';
				if (delta) {
					full += delta;
					onToken(delta);
				}
			}

			return cleanOutput(full);
			} finally {
				isGenerating = false;
			}
		},

		async generateVerdict(
			topic: string,
			userSide: DebateSide,
			aiSide: DebateSide,
			history: Array<{ speaker: 'user' | 'ai'; text: string }>
		): Promise<{ verdict: string; winner: 'user' | 'ai' | 'draw' }> {
			if (!engine || !isReady) throw new Error('Engine not ready');
			isGenerating = true;

			const sideLabel = (s: DebateSide) => (s === 'for' ? 'FOR' : 'AGAINST');
			const transcript = history
				.map(
					(t) =>
						`${t.speaker === 'user' ? `Human (${sideLabel(userSide)})` : `AI (${sideLabel(aiSide)})`}: ${trimTurn(t.text)}`
				)
				.join('\n\n');

			const messages: webllm.ChatCompletionMessageParam[] = [
				{
					role: 'system',
					content: `You are an impartial debate judge. Respond ONLY in this JSON format: {"winner": "user" | "ai" | "draw", "verdict": "2-3 sentence explanation"}`
				},
				{
					role: 'user',
					content: `Topic: "${topic}"\n\nTranscript:\n${transcript}\n\nWho won?`
				}
			];

			const response = await engine.chat.completions.create({
				messages,
				temperature: 0.3,
				max_tokens: 150
			});

			isGenerating = false;

			try {
				const text = response.choices[0].message.content ?? '';
				const json = JSON.parse(text.match(/\{.*\}/s)?.[0] ?? '{}');
				return {
					verdict: json.verdict ?? 'The debate was closely contested.',
					winner: json.winner ?? 'draw'
				};
			} catch {
				return { verdict: 'A hard-fought debate with no clear winner.', winner: 'draw' };
			}
		},

		async generateAiVsAiVerdict(
			topic: string,
			history: Array<{ speaker: 'user' | 'ai' | 'ai1' | 'ai2'; text: string }>
		): Promise<{ verdict: string; winner: 'ai1' | 'ai2' | 'draw' }> {
			if (!engine || !isReady) throw new Error('Engine not ready');
			isGenerating = true;

			const transcript = history
				.map((t) => {
					const label = t.speaker === 'ai1' ? 'AI 1 (FOR)' : 'AI 2 (AGAINST)';
					return `${label}: ${trimTurn(t.text)}`;
				})
				.join('\n\n');

			const messages: webllm.ChatCompletionMessageParam[] = [
				{
					role: 'system',
					content: `You are an impartial debate judge. Respond ONLY in this JSON format: {"winner": "ai1" | "ai2" | "draw", "verdict": "2-3 sentence explanation"}`
				},
				{
					role: 'user',
					content: `Topic: "${topic}"\n\nAI 1 argues FOR. AI 2 argues AGAINST.\n\nTranscript:\n${transcript}\n\nWho made the stronger case?`
				}
			];

			const response = await engine.chat.completions.create({
				messages,
				temperature: 0.3,
				max_tokens: 150
			});

			isGenerating = false;

			try {
				const text = response.choices[0].message.content ?? '';
				const json = JSON.parse(text.match(/\{.*\}/s)?.[0] ?? '{}');
				return {
					verdict: json.verdict ?? 'A closely matched debate.',
					winner: json.winner ?? 'draw'
				};
			} catch {
				return { verdict: 'An evenly matched exchange with no clear winner.', winner: 'draw' };
			}
		}
	};
}

export const llm = createLLMStore();
