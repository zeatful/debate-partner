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
	class="flex flex-col gap-2 py-5"
	style="
		border-bottom: 1px solid var(--border-color);
		animation: fade-up 0.3s ease-out both;
	"
>
	<!-- Header row -->
	<div class="flex items-center gap-3">
		<!-- Speaker dot -->
		<div
			class="h-1.5 w-1.5 rounded-full flex-shrink-0"
			style="background: {isUser ? 'rgba(var(--user-color),1)' : 'rgba(var(--ai-color),1)'};"
		></div>

		<!-- Speaker label -->
		<span
			class="text-xs tracking-[0.2em] uppercase"
			style="
				font-family: var(--font-mono);
				color: {isUser ? 'rgba(var(--user-color),1)' : 'rgba(var(--ai-color),1)'};
			"
		>
			{speakerLabel}
		</span>

		<!-- Side badge -->
		<span
			class="px-2 py-0.5 text-[10px] tracking-widest uppercase"
			style="
				font-family: var(--font-mono);
				color: {isUser ? 'rgba(var(--user-color),0.75)' : 'rgba(var(--ai-color),0.75)'};
				border: 1px solid {isUser ? 'rgba(var(--user-color),0.30)' : 'rgba(var(--ai-color),0.30)'};
			"
		>
			{sideLabel}
		</span>

		<!-- Timestamp -->
		<span
			class="ml-auto text-[10px] tabular-nums"
			style="color: rgba(var(--ink),0.50); font-family: var(--font-mono);"
		>
			{formatTime(turn.timestamp)}
		</span>
	</div>

	<!-- Text -->
	<p
		class="pl-[18px] text-sm leading-relaxed"
		style="
			font-family: var(--font-mono);
			color: rgba(var(--ink),0.92);
			border-left: 2px solid {isUser ? 'rgba(var(--user-color),0.25)' : 'rgba(var(--ai-color),0.22)'};
		"
	>
		{turn.text}
	</p>
</div>
