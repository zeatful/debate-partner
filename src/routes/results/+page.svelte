<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { debate } from '$lib/debate.svelte.js';
	import { speech } from '$lib/speech.svelte.js';
	import TranscriptEntry from '$lib/components/TranscriptEntry.svelte';

	let showTranscript = $state(false);
	let revealed = $state(false);

	onMount(() => {
		if (!debate.verdict) {
			goto('/setup', { replaceState: true });
			return;
		}
		speech.stopSpeaking();
		// Stagger in the reveal
		setTimeout(() => (revealed = true), 100);
	});

	const winnerColor = $derived(
		debate.winner === 'user' ? '#e8b84b' : debate.winner === 'ai' ? '#7dd3fc' : 'rgba(237,232,222,0.5)'
	);

	const winnerLabel = $derived(
		debate.winner === 'user'
			? 'You Win'
			: debate.winner === 'ai'
				? 'AI Wins'
				: 'Draw'
	);

	const winnerSublabel = $derived(
		debate.winner === 'user'
			? 'Your arguments carried the day.'
			: debate.winner === 'ai'
				? 'The opponent proved the stronger case.'
				: 'Honours are even.'
	);

	function playAgain() {
		debate.reset();
		goto('/setup');
	}

	function sameTopicOpposite側() {
		const currentSide = debate.userSide;
		const newSide = currentSide === 'for' ? 'against' as const : 'for' as const;
		const topic = debate.topic;
		debate.reset();
		// Pre-fill
		goto('/setup');
		// Re-start with swapped sides after navigation (basic approach)
		setTimeout(() => debate.startDebate(topic, newSide), 50);
	}
</script>

<main class="flex min-h-screen flex-col items-center justify-center px-6 py-16">
	{#if revealed && debate.verdict}
		<div class="w-full max-w-xl">
			<!-- Verdict header -->
			<div
				class="mb-12 text-center"
				style="animation: fade-up 0.5s ease-out both;"
			>
				<p
					class="mb-4 text-xs tracking-[0.4em] uppercase"
					style="color: rgba(237,232,222,0.45); font-family: var(--font-mono);"
				>
					Verdict
				</p>

				<!-- Winner name -->
				<h1
					class="mb-2 font-normal"
					style="
						font-family: var(--font-display);
						font-size: clamp(3.5rem, 10vw, 6rem);
						line-height: 1;
						color: {winnerColor};
						animation: verdict-reveal 0.8s ease-out 0.2s both;
					"
				>
					{winnerLabel}
				</h1>

				<p
					class="text-sm italic"
					style="
						font-family: var(--font-display);
						color: rgba(237,232,222,0.65);
						font-size: 1.1rem;
						animation: fade-in 0.6s ease-out 0.6s both;
					"
				>
					{winnerSublabel}
				</p>

				<!-- Decorative line in winner color -->
				<div
					class="mx-auto mt-6 h-px w-16"
					style="background: {winnerColor}; opacity: 0.3; animation: scale-in 0.5s ease-out 0.4s both;"
				></div>
			</div>

			<!-- Verdict text -->
			<div
				class="mb-10 px-6 py-5"
				style="
					border: 1px solid rgba(255,255,255,0.06);
					background: rgba(255,255,255,0.02);
					animation: fade-up 0.5s ease-out 0.4s both;
				"
			>
				<p
					class="text-[10px] tracking-[0.3em] uppercase mb-3"
					style="color: rgba(237,232,222,0.50); font-family: var(--font-mono);"
				>
					Judge's reasoning
				</p>
				<p
					class="text-sm italic leading-relaxed"
					style="font-family: var(--font-display); color: rgba(237,232,222,0.90); font-size: 1rem;"
				>
					"{debate.verdict}"
				</p>
			</div>

			<!-- Stats -->
			<div
				class="mb-8 grid grid-cols-3 gap-px"
				style="background: rgba(255,255,255,0.04); animation: fade-up 0.5s ease-out 0.5s both;"
			>
				{#each [
					{ label: 'Topic', value: `${debate.topic.slice(0, 30)}${debate.topic.length > 30 ? '…' : ''}` },
					{ label: 'Your Side', value: debate.userSide === 'for' ? 'FOR' : 'AGAINST' },
					{ label: 'Rounds', value: `${debate.roundNumber}` }
				] as stat}
					<div class="px-4 py-4" style="background: #060606;">
						<p
							class="text-[10px] tracking-[0.25em] uppercase mb-1"
							style="color: rgba(237,232,222,0.45); font-family: var(--font-mono);"
						>
							{stat.label}
						</p>
						<p
							class="text-xs"
							style="color: rgba(237,232,222,0.78); font-family: var(--font-mono);"
						>
							{stat.value}
						</p>
					</div>
				{/each}
			</div>

			<!-- Actions -->
			<div
				class="mb-8 flex flex-col gap-3"
				style="animation: fade-up 0.5s ease-out 0.6s both;"
			>
				<button
					type="button"
					onclick={playAgain}
					class="w-full py-4 text-sm tracking-[0.3em] uppercase transition-all duration-150"
					style="
						font-family: var(--font-mono);
						background: rgba(232,184,75,0.07);
						color: #e8b84b;
						border: 1px solid rgba(232,184,75,0.3);
					"
					onmouseenter={(e) => {
						const t = e.currentTarget as HTMLButtonElement;
						t.style.background = 'rgba(232,184,75,0.12)';
					}}
					onmouseleave={(e) => {
						const t = e.currentTarget as HTMLButtonElement;
						t.style.background = 'rgba(232,184,75,0.07)';
					}}
				>
					Debate Again
				</button>
			</div>

			<!-- Transcript toggle -->
			<div style="animation: fade-up 0.5s ease-out 0.7s both;">
				<button
					type="button"
					onclick={() => (showTranscript = !showTranscript)}
					class="w-full py-3 text-xs tracking-[0.25em] uppercase transition-colors duration-150"
					style="
						font-family: var(--font-mono);
						color: rgba(237,232,222,0.50);
						border: 1px solid rgba(237,232,222,0.06);
						background: transparent;
					"
					onmouseenter={(e) => {
						(e.currentTarget as HTMLButtonElement).style.color = 'rgba(237,232,222,0.85)';
					}}
					onmouseleave={(e) => {
						(e.currentTarget as HTMLButtonElement).style.color = 'rgba(237,232,222,0.50)';
					}}
				>
					{showTranscript ? 'Hide' : 'Review'} Full Transcript ({debate.turns.length} turns)
				</button>

				{#if showTranscript}
					<div
						class="mt-4"
						style="border: 1px solid rgba(255,255,255,0.05); padding: 0 1.5rem; animation: fade-up 0.3s ease-out both;"
					>
						{#each debate.turns as turn (turn.timestamp)}
							<TranscriptEntry {turn} userSide={debate.userSide} aiSide={debate.aiSide} />
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</main>
