<script lang="ts">
	interface Props {
		progress?: number;
		status?: string;
		label?: string;
	}

	let { progress = 0, status = '', label = 'Preparing' }: Props = $props();

	const clampedProgress = $derived(Math.max(0, Math.min(100, progress)));
</script>

<div
	class="fixed inset-0 z-50 flex flex-col items-center justify-center"
	style="background: var(--canvas-bg);"
>
	<!-- Ambient glow -->
	<div
		class="pointer-events-none absolute inset-0"
		style="background: radial-gradient(ellipse 600px 400px at 50% 40%, rgba(var(--user-color),0.04) 0%, transparent 70%);"
	></div>

	<div class="relative z-10 flex w-full max-w-sm flex-col items-center gap-8 px-8">
		<!-- Logo mark -->
		<div class="flex flex-col items-center gap-3">
			<div
				class="flex h-14 w-14 items-center justify-center"
				style="border: 1px solid rgba(var(--user-color),0.35);"
			>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="color: rgba(var(--user-color),1);">
					<path d="M12 2L12 22M2 12L22 12" stroke="currentColor" stroke-width="1" />
					<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1" fill="none" />
				</svg>
			</div>
			<p
				class="text-xs tracking-[0.3em] uppercase"
				style="color: rgba(var(--ink),0.65); font-family: var(--font-mono);"
			>
				{label}
			</p>
		</div>

		<!-- Progress bar -->
		<div class="w-full">
			<div
				class="h-px w-full overflow-hidden"
				style="background: rgba(var(--ink),0.08);"
			>
				<div
					class="h-full transition-all duration-300 ease-out"
					style="
						width: {clampedProgress}%;
						background: linear-gradient(90deg, rgba(var(--user-color),0.4) 0%, rgba(var(--user-color),1) 50%, rgba(var(--user-color),0.4) 100%);
						background-size: 200% 100%;
						animation: {clampedProgress > 0 && clampedProgress < 100 ? 'progress-shine 1.8s linear infinite' : 'none'};
					"
				></div>
			</div>
			<div class="mt-3 flex justify-between">
				<span
					class="text-xs tracking-widest"
					style="color: rgba(var(--ink),0.60); font-family: var(--font-mono);"
				>
					{Math.round(clampedProgress)}%
				</span>
			</div>
		</div>

		<!-- Status text -->
		<p
			class="max-w-xs text-center text-xs leading-relaxed"
			style="color: rgba(var(--ink),0.62); font-family: var(--font-mono); min-height: 2.5rem;"
		>
			{status || 'Initializing...'}
		</p>

		<!-- First load hint -->
		{#if clampedProgress < 10}
			<p
				class="text-center text-xs"
				style="color: rgba(var(--ink),0.48); font-family: var(--font-mono);"
			>
				First load downloads ~2GB. Cached after that.
			</p>
		{/if}
	</div>
</div>
