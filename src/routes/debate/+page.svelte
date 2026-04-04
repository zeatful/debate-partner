<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { debate } from '$lib/debate.svelte.js';
	import { llm } from '$lib/llm.svelte.js';
	import { speech } from '$lib/speech.svelte.js';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import VoiceButton from '$lib/components/VoiceButton.svelte';
	import TranscriptEntry from '$lib/components/TranscriptEntry.svelte';

	let transcriptEl = $state<HTMLElement | null>(null);
	let streamingText = $state('');
	let isStreaming = $state(false);
	let uiLocked = $state(false);
	let errorMsg = $state('');

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
		});

		// Load Kokoro in parallel (non-blocking)
		speech.initKokoro().catch(() => {
			// Kokoro failed - Web Speech API fallback will be used
		});
	});

	// Auto-scroll transcript on new content
	$effect(() => {
		// Track turns and streaming text for reactivity
		void debate.turns.length;
		void streamingText;
		tick().then(() => {
			transcriptEl?.scrollTo({ top: transcriptEl.scrollHeight, behavior: 'smooth' });
		});
	});

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
			isStreaming = true;

			const history = debate.turns.map((t) => ({ speaker: t.speaker, text: t.text }));

			const aiText = await llm.generateRebuttal(
				debate.topic,
				debate.aiSide,
				debate.userSide,
				history,
				(token: string) => {
					streamingText += token;
				}
			);

			isStreaming = false;
			streamingText = '';
			debate.addAiTurn(aiText);

			// 3. Speak the rebuttal
			await speech.speak(aiText);

			// 4. Check if debate is over
			if (debate.isDebateOver) {
				debate.setPhase('judging');
				const finalHistory = debate.turns.map((t) => ({ speaker: t.speaker, text: t.text }));
				const { verdict, winner } = await llm.generateVerdict(
					debate.topic,
					debate.userSide,
					debate.aiSide,
					finalHistory
				);
				debate.setVerdict(verdict, winner);
				goto('/results');
				return;
			}
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Something went wrong';
			isStreaming = false;
		}

		uiLocked = false;
	}

	function handleMicClick() {
		if (speech.status === 'listening') {
			speech.stopListening();
			uiLocked = false;
		} else if (canInteract) {
			runVoiceRound();
		}
	}
</script>

<!-- Loading overlay -->
{#if debate.phase === 'loading' || (debate.phase === 'judging' && !debate.verdict)}
	<LoadingScreen
		progress={debate.phase === 'judging' ? 90 : llm.loadProgress}
		status={debate.phase === 'judging' ? 'Deliberating...' : llm.loadStatus}
		label={debate.phase === 'judging' ? 'Judging' : 'Loading Model'}
	/>
{/if}

<div class="flex h-screen flex-col" style="background: #060606;">
	<!-- Header -->
	<header
		class="flex-shrink-0 px-6 py-4"
		style="border-bottom: 1px solid rgba(255,255,255,0.05);"
	>
		<div class="mx-auto flex max-w-2xl items-center justify-between gap-4">
			<!-- Topic -->
			<div class="min-w-0 flex-1">
				<p
					class="mb-0.5 text-[10px] tracking-[0.3em] uppercase"
					style="color: rgba(237,232,222,0.50); font-family: var(--font-mono);"
				>
					Proposition
				</p>
				<p
					class="truncate text-sm"
					style="color: rgba(237,232,222,0.90); font-family: var(--font-display); font-style: italic; font-size: 1rem;"
				>
					"{debate.topic}"
				</p>
			</div>

			<!-- Sides + rounds -->
			<div class="flex flex-shrink-0 items-center gap-4">
				<div class="text-right">
					<p
						class="text-[10px] tracking-[0.25em] uppercase"
						style="color: rgba(232,184,75,0.5); font-family: var(--font-mono);"
					>
						You · {debate.userSide === 'for' ? 'FOR' : 'AGAINST'}
					</p>
					<p
						class="text-[10px] tracking-[0.25em] uppercase"
						style="color: rgba(125,211,252,0.5); font-family: var(--font-mono);"
					>
						AI · {debate.aiSide === 'for' ? 'FOR' : 'AGAINST'}
					</p>
				</div>
				<div
					class="px-3 py-2 text-center"
					style="border: 1px solid rgba(255,255,255,0.07);"
				>
					<p
						class="text-xs tabular-nums"
						style="color: rgba(237,232,222,0.65); font-family: var(--font-mono);"
					>
						{roundLabel}
					</p>
					<p
						class="text-[9px] tracking-widest uppercase"
						style="color: rgba(237,232,222,0.45); font-family: var(--font-mono);"
					>
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
				<div
					class="flex flex-col items-center justify-center py-24 text-center"
					style="animation: fade-in 0.6s ease-out 0.3s both;"
				>
					<div class="mb-6 h-px w-8" style="background: rgba(232,184,75,0.25);"></div>
					<p
						class="text-2xl font-light italic"
						style="font-family: var(--font-display); color: rgba(237,232,222,0.55);"
					>
						Make your opening argument
					</p>
					<p
						class="mt-3 text-xs tracking-widest uppercase"
						style="color: rgba(237,232,222,0.42); font-family: var(--font-mono);"
					>
						Press the microphone to begin
					</p>
				</div>
			{/if}

			{#each debate.turns as turn (turn.timestamp)}
				<TranscriptEntry {turn} userSide={debate.userSide} aiSide={debate.aiSide} />
			{/each}

			<!-- Streaming AI response -->
			{#if isStreaming && streamingText}
				<div class="py-5" style="border-bottom: 1px solid rgba(255,255,255,0.04);">
					<div class="flex items-center gap-3 mb-2">
						<div class="h-1.5 w-1.5 rounded-full flex-shrink-0" style="background: #7dd3fc;"></div>
						<span
							class="text-xs tracking-[0.2em] uppercase"
							style="font-family: var(--font-mono); color: #7dd3fc;"
						>
							Opponent
						</span>
						<span
							class="px-2 py-0.5 text-[10px] tracking-widest uppercase"
							style="
								font-family: var(--font-mono);
								color: rgba(125,211,252,0.6);
								border: 1px solid rgba(125,211,252,0.2);
							"
						>
							{debate.aiSide === 'for' ? 'FOR' : 'AGAINST'}
						</span>
					</div>
					<p
						class="pl-[18px] text-sm leading-relaxed"
						style="
							font-family: var(--font-mono);
							color: rgba(237,232,222,0.93);
							border-left: 2px solid rgba(125,211,252,0.2);
						"
					>
						{streamingText}<span
							style="animation: blink-cursor 1s step-end infinite; color: rgba(125,211,252,0.6);"
							>|</span
						>
					</p>
				</div>
			{/if}

			<!-- Interim transcript from STT -->
			{#if speech.interimTranscript}
				<div class="py-5">
					<div class="flex items-center gap-3 mb-2">
						<div class="h-1.5 w-1.5 rounded-full flex-shrink-0" style="background: rgba(232,184,75,0.4);"></div>
						<span
							class="text-xs tracking-[0.2em] uppercase"
							style="font-family: var(--font-mono); color: rgba(232,184,75,0.5);"
						>
							You · hearing...
						</span>
					</div>
					<p
						class="pl-[18px] text-sm leading-relaxed italic"
						style="
							font-family: var(--font-mono);
							color: rgba(237,232,222,0.60);
							border-left: 2px solid rgba(232,184,75,0.15);
						"
					>
						{speech.interimTranscript}
					</p>
				</div>
			{/if}

			<div class="h-32"></div>
		</div>
	</div>

	<!-- Bottom dock -->
	<div
		class="flex-shrink-0 px-6 pb-8 pt-4"
		style="border-top: 1px solid rgba(255,255,255,0.05); background: rgba(6,6,6,0.95);"
	>
		<div class="mx-auto flex max-w-2xl flex-col items-center gap-2">
			{#if errorMsg}
				<p
					class="mb-2 text-xs"
					style="color: rgba(239,68,68,0.7); font-family: var(--font-mono);"
				>
					{errorMsg}
				</p>
			{/if}

			<VoiceButton
				status={voiceStatus}
				disabled={!canInteract && speech.status !== 'listening'}
				onclick={handleMicClick}
			/>

			{#if !llm.isReady && debate.phase !== 'loading'}
				<p
					class="text-xs tracking-widest uppercase"
					style="color: rgba(237,232,222,0.45); font-family: var(--font-mono);"
				>
					Waiting for model...
				</p>
			{/if}
		</div>
	</div>
</div>
