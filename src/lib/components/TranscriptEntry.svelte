<script lang="ts">
	import type { Turn, DebateSide } from '$lib/debate.svelte.js';

	interface Props {
		turn: Turn;
		userSide: DebateSide;
		aiSide: DebateSide;
	}

	let { turn, userSide, aiSide }: Props = $props();

	const isUser = $derived(turn.speaker === 'user');
	const side = $derived(isUser ? userSide : aiSide);
	const sideLabel = $derived(side === 'for' ? 'FOR' : 'AGAINST');
	const speakerLabel = $derived(isUser ? 'YOU' : 'OPPONENT');

	function formatTime(ts: number) {
		return new Date(ts).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		});
	}
</script>

<div
	class="fade-up-entry flex flex-col gap-2 py-5"
	style="
		border-bottom: 1px solid rgba(255,255,255,0.04);
		animation: fade-up 0.3s ease-out both;
	"
>
	<!-- Header row -->
	<div class="flex items-center gap-3">
		<!-- Speaker dot -->
		<div
			class="h-1.5 w-1.5 rounded-full flex-shrink-0"
			style="background: {isUser ? '#e8b84b' : '#7dd3fc'};"
		></div>

		<!-- Speaker label -->
		<span
			class="text-xs tracking-[0.2em] uppercase"
			style="
				font-family: var(--font-mono);
				color: {isUser ? '#e8b84b' : '#7dd3fc'};
			"
		>
			{speakerLabel}
		</span>

		<!-- Side badge -->
		<span
			class="px-2 py-0.5 text-[10px] tracking-widest uppercase"
			style="
				font-family: var(--font-mono);
				color: {isUser ? 'rgba(232,184,75,0.6)' : 'rgba(125,211,252,0.6)'};
				border: 1px solid {isUser ? 'rgba(232,184,75,0.2)' : 'rgba(125,211,252,0.2)'};
			"
		>
			{sideLabel}
		</span>

		<!-- Timestamp -->
		<span
			class="ml-auto text-[10px] tabular-nums"
			style="color: rgba(237,232,222,0.42); font-family: var(--font-mono);"
		>
			{formatTime(turn.timestamp)}
		</span>
	</div>

	<!-- Text -->
	<p
		class="pl-[18px] text-sm leading-relaxed"
		style="
			font-family: var(--font-mono);
			color: {isUser ? 'rgba(237,232,222,0.93)' : 'rgba(237,232,222,0.93)'};
			border-left: 2px solid {isUser ? 'rgba(232,184,75,0.25)' : 'rgba(125,211,252,0.2)'};
		"
	>
		{turn.text}
	</p>
</div>
