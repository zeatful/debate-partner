<script lang="ts">
	import { Mic, Loader } from 'lucide-svelte';

	type Status = 'idle' | 'listening' | 'processing' | 'speaking';

	interface Props {
		status?: Status;
		disabled?: boolean;
		onclick?: () => void;
	}

	let { status = 'idle', disabled = false, onclick }: Props = $props();

	const label = $derived(
		status === 'listening'
			? 'Listening...'
			: status === 'processing'
				? 'Thinking...'
				: status === 'speaking'
					? 'Speaking...'
					: 'Speak'
	);
</script>

<button
	class="voice-btn group relative flex flex-col items-center gap-4"
	{disabled}
	onclick={onclick}
	aria-label={label}
	type="button"
>
	<!-- Pulse rings (listening state) -->
	{#if status === 'listening'}
		<span
			class="pointer-events-none absolute rounded-full border"
			style="
				width: 80px; height: 80px;
				border-color: rgba(var(--user-color),0.55);
				animation: pulse-ring 1.6s ease-out infinite;
			"
		></span>
		<span
			class="pointer-events-none absolute rounded-full border"
			style="
				width: 80px; height: 80px;
				border-color: rgba(var(--user-color),0.35);
				animation: pulse-ring 1.6s ease-out 0.5s infinite;
			"
		></span>
		<span
			class="pointer-events-none absolute rounded-full border"
			style="
				width: 80px; height: 80px;
				border-color: rgba(var(--user-color),0.18);
				animation: pulse-ring 1.6s ease-out 1s infinite;
			"
		></span>
	{/if}

	<!-- Spinning arc (processing state) -->
	{#if status === 'processing'}
		<span
			class="pointer-events-none absolute"
			style="
				width: 88px; height: 88px;
				border-radius: 50%;
				border: 1px solid transparent;
				border-top-color: rgba(var(--user-color),0.75);
				border-right-color: rgba(var(--user-color),0.35);
				animation: spin-arc 0.9s linear infinite;
			"
		></span>
	{/if}

	<!-- AI speaking indicator (speaking state) -->
	{#if status === 'speaking'}
		<span
			class="pointer-events-none absolute"
			style="
				width: 88px; height: 88px;
				border-radius: 50%;
				border: 1px solid rgba(var(--ai-color),0.30);
			"
		></span>
	{/if}

	<!-- Main button circle -->
	<div
		class="relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300"
		style="
			background: {status === 'listening'
			? 'rgba(var(--user-color),0.12)'
			: status === 'speaking'
				? 'rgba(var(--ai-color),0.08)'
				: 'rgba(var(--ink),0.05)'};
			border: 1px solid {status === 'listening'
			? 'rgba(var(--user-color),0.55)'
			: status === 'speaking'
				? 'rgba(var(--ai-color),0.45)'
				: status === 'processing'
					? 'rgba(var(--user-color),0.35)'
					: 'rgba(var(--ink),0.15)'};
			box-shadow: {status === 'listening'
			? '0 0 30px rgba(var(--user-color),0.10), inset 0 0 20px rgba(var(--user-color),0.05)'
			: status === 'speaking'
				? '0 0 30px rgba(var(--ai-color),0.08)'
				: 'none'};
			opacity: {disabled ? 0.3 : 1};
			cursor: {disabled ? 'not-allowed' : 'pointer'};
		"
	>
		{#if status === 'processing'}
			<Loader size={22} style="color: rgba(var(--user-color),0.75); animation: spin-arc 1.5s linear infinite;" />
		{:else if status === 'speaking'}
			<!-- Audio visualizer bars -->
			<div class="flex items-end gap-[3px]" style="height: 20px;">
				{#each [0, 0.15, 0.3, 0.45, 0.6] as delay}
					<div
						class="w-[3px] rounded-full"
						style="
							background: rgba(var(--ai-color),0.75);
							height: 100%;
							transform-origin: bottom;
							animation: bar-wave 0.8s ease-in-out {delay}s infinite;
						"
					></div>
				{/each}
			</div>
		{:else if status === 'listening'}
			<Mic size={24} style="color: rgba(var(--user-color),1);" />
		{:else}
			<Mic size={24} style="color: rgba(var(--ink),0.75); transition: color 0.2s;" />
		{/if}
	</div>

	<!-- Label -->
	<span
		class="text-xs tracking-[0.2em] uppercase transition-colors duration-200"
		style="
			font-family: var(--font-mono);
			color: {status === 'listening'
			? 'rgba(var(--user-color),0.85)'
			: status === 'speaking'
				? 'rgba(var(--ai-color),0.75)'
				: status === 'processing'
					? 'rgba(var(--ink),0.55)'
					: 'rgba(var(--ink),0.45)'};
		"
	>
		{label}
	</span>
</button>
