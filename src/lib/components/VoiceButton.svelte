<script lang="ts">
	import { Mic, MicOff, Loader } from 'lucide-svelte';

	type Status = 'idle' | 'listening' | 'processing' | 'speaking';

	interface Props {
		status?: Status;
		disabled?: boolean;
		onclick?: () => void;
	}

	let { status = 'idle', disabled = false, onclick }: Props = $props();

	const isActive = $derived(status !== 'idle');
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
				border-color: rgba(232,184,75,0.5);
				animation: pulse-ring 1.6s ease-out infinite;
			"
		></span>
		<span
			class="pointer-events-none absolute rounded-full border"
			style="
				width: 80px; height: 80px;
				border-color: rgba(232,184,75,0.3);
				animation: pulse-ring 1.6s ease-out 0.5s infinite;
			"
		></span>
		<span
			class="pointer-events-none absolute rounded-full border"
			style="
				width: 80px; height: 80px;
				border-color: rgba(232,184,75,0.15);
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
				border-top-color: rgba(232,184,75,0.7);
				border-right-color: rgba(232,184,75,0.3);
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
				border: 1px solid rgba(125,211,252,0.25);
			"
		></span>
	{/if}

	<!-- Main button circle -->
	<div
		class="relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300"
		style="
			background: {status === 'listening'
			? 'rgba(232,184,75,0.12)'
			: status === 'speaking'
				? 'rgba(125,211,252,0.08)'
				: 'rgba(237,232,222,0.04)'};
			border: 1px solid {status === 'listening'
			? 'rgba(232,184,75,0.5)'
			: status === 'speaking'
				? 'rgba(125,211,252,0.4)'
				: status === 'processing'
					? 'rgba(232,184,75,0.3)'
					: 'rgba(237,232,222,0.12)'};
			box-shadow: {status === 'listening'
			? '0 0 30px rgba(232,184,75,0.08), inset 0 0 20px rgba(232,184,75,0.04)'
			: status === 'speaking'
				? '0 0 30px rgba(125,211,252,0.06)'
				: 'none'};
			opacity: {disabled ? 0.3 : 1};
			cursor: {disabled ? 'not-allowed' : 'pointer'};
		"
	>
		{#if status === 'processing'}
			<Loader size={22} style="color: rgba(232,184,75,0.7); animation: spin-arc 1.5s linear infinite;" />
		{:else if status === 'speaking'}
			<!-- Audio visualizer bars -->
			<div class="flex items-end gap-[3px]" style="height: 20px;">
				{#each [0, 0.15, 0.3, 0.45, 0.6] as delay}
					<div
						class="w-[3px] rounded-full"
						style="
							background: rgba(125,211,252,0.7);
							height: 100%;
							transform-origin: bottom;
							animation: bar-wave 0.8s ease-in-out {delay}s infinite;
						"
					></div>
				{/each}
			</div>
		{:else if status === 'listening'}
			<Mic size={24} style="color: #e8b84b;" />
		{:else}
			<Mic
				size={24}
				style="color: rgba(237,232,222,0.72); transition: color 0.2s;"
				class="group-hover:!text-ink"
			/>
		{/if}
	</div>

	<!-- Label -->
	<span
		class="text-xs tracking-[0.2em] uppercase transition-colors duration-200"
		style="
			font-family: var(--font-mono);
			color: {status === 'listening'
			? 'rgba(232,184,75,0.8)'
			: status === 'speaking'
				? 'rgba(125,211,252,0.7)'
				: status === 'processing'
					? 'rgba(237,232,222,0.4)'
					: 'rgba(237,232,222,0.3)'};
		"
	>
		{label}
	</span>
</button>
