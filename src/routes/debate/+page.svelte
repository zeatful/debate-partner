<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { debate } from '$lib/debate.svelte.js';
	import { llm } from '$lib/llm.svelte.js';
	import { speech } from '$lib/speech.svelte.js';
	import { isMobile } from '$lib/utils.js';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import JudgingScreen from '$lib/components/JudgingScreen.svelte';
	import VoiceButton from '$lib/components/VoiceButton.svelte';
	import TranscriptEntry from '$lib/components/TranscriptEntry.svelte';

	let transcriptEl = $state<HTMLElement | null>(null);
	let streamingText = $state('');
	let isStreaming = $state(false);
	let streamingSpeaker = $state<'ai' | 'ai1' | 'ai2'>('ai');
	let uiLocked = $state(false);
	let errorMsg = $state('');

	// AI vs AI: stop-early flag
	let stopRequested = $state(false);

	// iOS requires a user gesture to unlock speechSynthesis. For AI vs AI the
	// loop starts automatically, so we show a "tap to begin" overlay first.
	let needsAudioUnlock = $state(false);

	const isAiVsAi = $derived(debate.mode === 'ai-vs-ai');

	// Derive button status from speech + locked states
	const voiceStatus = $derived(
		isStreaming || uiLocked
			? llm.isGenerating
				? 'processing'
				: speech.status === 'speaking'
					? 'speaking'
					: 'processing'
			: speech.status
	);

	const canInteract = $derived(llm.isReady && !uiLocked && debate.phase === 'arguing');

	const roundLabel = $derived(`${debate.roundNumber} / ${debate.maxRounds}`);

	onMount(() => {
		if (!debate.topic) {
			goto('/setup', { replaceState: true });
			return;
		}

		debate.setPhase('loading');

		llm.load().then(() => {
			debate.setPhase('arguing');
			if (isAiVsAi) {
				if (isMobile()) {
					// Can't start audio without a gesture on iOS — show tap-to-begin
					needsAudioUnlock = true;
				} else {
					runAiVsAiLoop();
				}
			}
		}).catch((err: Error) => {
			errorMsg = err.message ?? 'Failed to load the AI model.';
			debate.setPhase('loading'); // stay on loading screen so the error is visible
		});
	});

	// Auto-scroll transcript on new content
	$effect(() => {
		void debate.turns.length;
		void streamingText;
		tick().then(() => {
			transcriptEl?.scrollTo({ top: transcriptEl.scrollHeight, behavior: 'smooth' });
		});
	});

	// ── Human vs AI ────────────────────────────────────────────────────────────

	async function runVoiceRound() {
		if (!canInteract) return;
		errorMsg = '';
		uiLocked = true;

		try {
			// 1. Listen
			const userText = await speech.listen();
			if (!userText.trim()) {
				uiLocked = false;
				return;
			}

			debate.addUserTurn(userText);

			// 2. Generate rebuttal with streaming
			streamingText = '';
			streamingSpeaker = 'ai';
			isStreaming = true;

			const history = debate.turns.map((t) => ({ speaker: t.speaker as 'user' | 'ai', text: t.text }));

			const aiText = await llm.generateRebuttal(
				debate.topic,
				debate.aiSide,
				debate.userSide,
				history,
				(token: string) => { streamingText += token; }
			);

			isStreaming = false;
			streamingText = '';
			debate.addAiTurn(aiText);

			// 3. Speak the rebuttal
			await speech.speak(aiText, speech.selectedVoiceName);

			// 4. Check if debate is over
			if (debate.isDebateOver) {
				await finishDebate();
				return;
			}
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Something went wrong';
			isStreaming = false;
		}

		uiLocked = false;
	}

	function handleMicClick() {
		// Unlock iOS Safari's speechSynthesis gate synchronously on the tap,
		// before any async work consumes the user gesture token.
		speech.unlockAudio();

		if (speech.status === 'listening') {
			speech.stopListening();
			uiLocked = false;
		} else if (canInteract) {
			runVoiceRound();
		}
	}

	// ── AI vs AI ───────────────────────────────────────────────────────────────

	async function runAiVsAiLoop() {
		uiLocked = true;
		errorMsg = '';

		while (!debate.isDebateOver && !stopRequested) {
			try {
				// ── AI 1 turn (FOR) ───────────────────────────────────────────
				const history1 = debate.turns.map((t) => ({ speaker: t.speaker, text: t.text }));
				streamingText = '';
				streamingSpeaker = 'ai1';
				isStreaming = true;

				const ai1Text = await llm.generateAiVsAiTurn(
					debate.topic,
					debate.ai1Side,
					debate.ai2Side,
					'ai1',
					history1,
					(token) => { streamingText += token; }
				);

				isStreaming = false;
				streamingText = '';

				if (!ai1Text.trim()) {
					errorMsg = 'AI 1 produced no output. Try again.';
					break;
				}

				debate.addAi1Turn(ai1Text);
				await speech.speak(ai1Text, speech.ai1VoiceName);

				if (stopRequested) break;

				// ── AI 2 turn (AGAINST) ───────────────────────────────────────
				const history2 = debate.turns.map((t) => ({ speaker: t.speaker, text: t.text }));
				streamingText = '';
				streamingSpeaker = 'ai2';
				isStreaming = true;

				const ai2Text = await llm.generateAiVsAiTurn(
					debate.topic,
					debate.ai2Side,
					debate.ai1Side,
					'ai2',
					history2,
					(token) => { streamingText += token; }
				);

				isStreaming = false;
				streamingText = '';

				if (!ai2Text.trim()) {
					errorMsg = 'AI 2 produced no output. Try again.';
					break;
				}

				debate.addAi2Turn(ai2Text); // increments roundNumber
				await speech.speak(ai2Text, speech.ai2VoiceName);

			} catch (e) {
				isStreaming = false;
				streamingText = '';
				errorMsg = e instanceof Error ? e.message : 'Something went wrong during the debate.';
				break;
			}
		}

		uiLocked = false;

		// Only proceed to judging if the debate actually ran
		if (debate.turns.length > 0) {
			await finishDebate();
		}
	}

	async function handleStopEarly() {
		stopRequested = true;
		speech.stopSpeaking();
	}

	function handleAudioUnlock() {
		speech.unlockAudio();
		needsAudioUnlock = false;
		runAiVsAiLoop();
	}

	// ── Shared judging ─────────────────────────────────────────────────────────

	async function finishDebate() {
		debate.setPhase('judging');

		if (isAiVsAi) {
			const finalHistory = debate.turns.map((t) => ({ speaker: t.speaker, text: t.text }));
			const { verdict, winner } = await llm.generateAiVsAiVerdict(debate.topic, finalHistory);
			debate.setVerdict(verdict, winner);
		} else {
			const finalHistory = debate.turns.map((t) => ({ speaker: t.speaker as 'user' | 'ai', text: t.text }));
			const { verdict, winner } = await llm.generateVerdict(
				debate.topic,
				debate.userSide,
				debate.aiSide,
				finalHistory
			);
			debate.setVerdict(verdict, winner);
		}

		goto('/results');
	}
</script>

<!-- Loading overlay -->
{#if debate.phase === 'loading'}
	<LoadingScreen progress={llm.loadProgress} status={llm.loadStatus} label="Loading AI Model" modelSize={llm.selectedModel.size} error={errorMsg} oncancel={() => goto('/setup')} />
{:else if debate.phase === 'judging' && !debate.verdict}
	<JudgingScreen />
{/if}

<!-- iOS audio unlock overlay for AI vs AI -->
{#if needsAudioUnlock}
	<div class="fixed inset-0 z-40 flex flex-col items-center justify-center"
		style="background: var(--canvas-bg);">
		<div class="flex flex-col items-center gap-6 px-8 text-center">
			<p class="text-xs tracking-[0.3em] uppercase" style="color: rgba(var(--user-color),0.65); font-family: var(--font-mono);">
				Ready
			</p>
			<h2 class="text-4xl font-light italic" style="font-family: var(--font-display); color: rgba(var(--ink),0.90);">
				Tap to begin
			</h2>
			<p class="max-w-xs text-xs leading-relaxed" style="color: rgba(var(--ink),0.50); font-family: var(--font-mono);">
				iOS requires a tap to enable audio before the debate starts.
			</p>
			<button type="button" onclick={handleAudioUnlock}
				class="mt-2 px-8 py-3 text-xs tracking-[0.3em] uppercase transition-all duration-200"
				style="font-family: var(--font-mono); background: rgba(var(--user-color),0.08); color: rgba(var(--user-color),1); border: 1px solid rgba(var(--user-color),0.38);">
				Begin Debate
			</button>
		</div>
	</div>
{/if}

<div class="flex h-screen flex-col" style="background: var(--canvas-bg);">
	<!-- Header -->
	<header class="flex-shrink-0 px-6 py-4" style="border-bottom: 1px solid var(--border-color);">
		<div class="mx-auto flex max-w-2xl items-center justify-between gap-4">
			<!-- Topic -->
			<div class="min-w-0 flex-1">
				<p class="mb-0.5 text-[10px] tracking-[0.3em] uppercase"
					style="color: rgba(var(--ink),0.60); font-family: var(--font-mono);">
					Proposition
				</p>
				<p class="truncate text-sm"
					style="color: rgba(var(--ink),0.92); font-family: var(--font-display); font-style: italic; font-size: 1rem;">
					"{debate.topic}"
				</p>
			</div>

			<!-- Sides + rounds -->
			<div class="flex flex-shrink-0 items-center gap-4">
				<div class="text-right">
					{#if isAiVsAi}
						<p class="text-[10px] tracking-[0.25em] uppercase"
							style="color: rgba(var(--user-color),0.75); font-family: var(--font-mono);">
							AI 1 · FOR
						</p>
						<p class="text-[10px] tracking-[0.25em] uppercase"
							style="color: rgba(var(--ai-color),0.75); font-family: var(--font-mono);">
							AI 2 · AGAINST
						</p>
					{:else}
						<p class="text-[10px] tracking-[0.25em] uppercase"
							style="color: rgba(var(--user-color),0.75); font-family: var(--font-mono);">
							You · {debate.userSide === 'for' ? 'FOR' : 'AGAINST'}
						</p>
						<p class="text-[10px] tracking-[0.25em] uppercase"
							style="color: rgba(var(--ai-color),0.75); font-family: var(--font-mono);">
							AI · {debate.aiSide === 'for' ? 'FOR' : 'AGAINST'}
						</p>
					{/if}
				</div>
				<div class="px-3 py-2 text-center" style="border: 1px solid var(--border-color);">
					<p class="text-xs tabular-nums"
						style="color: rgba(var(--ink),0.80); font-family: var(--font-mono);">
						{roundLabel}
					</p>
					<p class="text-[9px] tracking-widest uppercase"
						style="color: rgba(var(--ink),0.55); font-family: var(--font-mono);">
						rounds
					</p>
				</div>
			</div>
		</div>
	</header>

	<!-- Transcript -->
	<div
		bind:this={transcriptEl}
		class="flex-1 overflow-y-auto px-6 py-2"
		style="scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.07) transparent;"
	>
		<div class="mx-auto max-w-2xl">
			{#if debate.turns.length === 0 && !isStreaming}
				<div class="flex flex-col items-center justify-center py-24 text-center"
					style="animation: fade-in 0.6s ease-out 0.3s both;">
					<div class="mb-6 h-px w-8" style="background: rgba(var(--user-color),0.25);"></div>
					{#if isAiVsAi}
						<p class="text-2xl font-light italic"
							style="font-family: var(--font-display); color: rgba(var(--ink),0.70);">
							Generating opening argument
						</p>
						<p class="mt-3 text-xs tracking-widest uppercase"
							style="color: rgba(var(--ink),0.55); font-family: var(--font-mono);">
							AI 1 is preparing its case…
						</p>
					{:else}
						<p class="text-2xl font-light italic"
							style="font-family: var(--font-display); color: rgba(var(--ink),0.70);">
							Make your opening argument
						</p>
						<p class="mt-3 text-xs tracking-widest uppercase"
							style="color: rgba(var(--ink),0.55); font-family: var(--font-mono);">
							Press the microphone to begin
						</p>
					{/if}
				</div>
			{/if}

			{#each debate.turns as turn (turn.timestamp)}
				<TranscriptEntry {turn} userSide={debate.userSide} aiSide={debate.aiSide} />
			{/each}

			<!-- Streaming response bubble -->
			{#if isStreaming && streamingText}
				{@const isAi1Streaming = streamingSpeaker === 'ai1'}
				<div class="py-5" style="border-bottom: 1px solid var(--border-color);">
					<div class="flex items-center gap-3 mb-2">
						<div class="h-1.5 w-1.5 rounded-full flex-shrink-0"
							style="background: {isAi1Streaming ? 'rgba(var(--user-color),1)' : 'rgba(var(--ai-color),1)'};"></div>
						<span class="text-xs tracking-[0.2em] uppercase"
							style="font-family: var(--font-mono); color: {isAi1Streaming ? 'rgba(var(--user-color),1)' : 'rgba(var(--ai-color),1)'};">
							{streamingSpeaker === 'ai1' ? 'AI 1' : streamingSpeaker === 'ai2' ? 'AI 2' : 'Opponent'}
						</span>
						<span class="px-2 py-0.5 text-[10px] tracking-widest uppercase"
							style="
								font-family: var(--font-mono);
								color: {isAi1Streaming ? 'rgba(var(--user-color),0.75)' : 'rgba(var(--ai-color),0.75)'};
								border: 1px solid {isAi1Streaming ? 'rgba(var(--user-color),0.3)' : 'rgba(var(--ai-color),0.3)'};
							">
							{streamingSpeaker === 'ai1' ? 'FOR' : streamingSpeaker === 'ai2' ? 'AGAINST' : debate.aiSide === 'for' ? 'FOR' : 'AGAINST'}
						</span>
					</div>
					<p class="pl-[18px] text-sm leading-relaxed"
						style="
							font-family: var(--font-mono);
							color: rgba(var(--ink),0.92);
							border-left: 2px solid {isAi1Streaming ? 'rgba(var(--user-color),0.25)' : 'rgba(var(--ai-color),0.25)'};
						">
						{streamingText}<span
							style="animation: blink-cursor 1s step-end infinite; color: {isAi1Streaming ? 'rgba(var(--user-color),0.7)' : 'rgba(var(--ai-color),0.7)'};"
							>|</span
						>
					</p>
				</div>
			{/if}

			<!-- Interim transcript from STT (human-vs-ai only) -->
			{#if speech.interimTranscript && !isAiVsAi}
				<div class="py-5">
					<div class="flex items-center gap-3 mb-2">
						<div class="h-1.5 w-1.5 rounded-full flex-shrink-0"
							style="background: rgba(var(--user-color),0.5);"></div>
						<span class="text-xs tracking-[0.2em] uppercase"
							style="font-family: var(--font-mono); color: rgba(var(--user-color),0.70);">
							You · hearing...
						</span>
					</div>
					<p class="pl-[18px] text-sm leading-relaxed italic"
						style="
							font-family: var(--font-mono);
							color: rgba(var(--ink),0.72);
							border-left: 2px solid rgba(var(--user-color),0.2);
						">
						{speech.interimTranscript}
					</p>
				</div>
			{/if}

			<div class="h-32"></div>
		</div>
	</div>

	<!-- Bottom dock -->
	<div class="flex-shrink-0 px-6 pb-8 pt-4"
		style="border-top: 1px solid var(--border-color); background: var(--canvas-bg);">
		<div class="mx-auto flex max-w-2xl flex-col items-center gap-2">
			{#if errorMsg}
				<p class="mb-2 text-xs" style="color: rgba(239,68,68,0.85); font-family: var(--font-mono);">
					{errorMsg}
				</p>
			{/if}

			{#if isAiVsAi}
				<!-- AI vs AI controls -->
				{#if debate.phase === 'arguing' && !stopRequested}
					<button
						type="button"
						onclick={handleStopEarly}
						class="px-6 py-2.5 text-xs tracking-[0.2em] uppercase transition-all duration-150"
						style="
							font-family: var(--font-mono);
							color: rgba(var(--ink),0.55);
							border: 1px solid rgba(var(--ink),0.14);
							background: transparent;
						"
						onmouseenter={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.color = 'rgba(var(--ink),0.85)'; t.style.borderColor = 'rgba(var(--ink),0.35)'; }}
						onmouseleave={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.color = 'rgba(var(--ink),0.55)'; t.style.borderColor = 'rgba(var(--ink),0.14)'; }}
					>
						Stop &amp; Judge
					</button>
					<p class="text-[10px] tracking-widest uppercase"
						style="color: rgba(var(--ink),0.35); font-family: var(--font-mono);">
						{isStreaming ? (streamingSpeaker === 'ai1' ? 'AI 1 is arguing...' : 'AI 2 is arguing...') : speech.status === 'speaking' ? 'Speaking...' : 'Thinking...'}
					</p>
				{:else if stopRequested}
					<p class="text-xs tracking-widest uppercase"
						style="color: rgba(var(--ink),0.45); font-family: var(--font-mono);">
						Finishing current turn...
					</p>
				{/if}
			{:else}
				<!-- Human vs AI controls -->
				<VoiceButton
					status={voiceStatus}
					disabled={!canInteract && speech.status !== 'listening'}
					onclick={handleMicClick}
				/>

				{#if !llm.isReady && debate.phase !== 'loading'}
					<p class="text-xs tracking-widest uppercase"
						style="color: rgba(var(--ink),0.55); font-family: var(--font-mono);">
						Waiting for model...
					</p>
				{/if}
			{/if}
		</div>
	</div>
</div>
