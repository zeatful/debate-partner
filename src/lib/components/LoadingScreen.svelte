<script lang="ts">
	interface Props {
		progress?: number;
		status?: string;
		label?: string;
		error?: string;
		oncancel?: () => void;
	}

	let { progress = 0, status = '', label = 'Preparing', error = '', oncancel }: Props = $props();

	const clampedProgress = $derived(Math.max(0, Math.min(100, progress)));
	const isIndeterminate = $derived(clampedProgress === 0);
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

	<div class="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 px-8">

		<!-- ── Robot assembly animation ───────────────────────────────── -->
		<div class="flex flex-col items-center gap-3">
			<!--
				Build cycle (5 s total):
				Feet    0 %–14 %  appear, stay visible until 86%, fade 86–94%
				Legs   14 %–26 %  appear
				Torso  26 %–40 %  appear
				Arms   40 %–56 %  appear
				Head   56 %–72 %  descend into place
				Online 72 %–86 %  eyes + reactor glow, antenna pulses
				Fade   86 %–96 %  everything vanishes
				Gap    96%–100%   blank pause before restart
			-->
			<svg
				viewBox="-16 -26 132 202"
				width="108"
				height="162"
				style="overflow: visible;"
				aria-hidden="true"
			>
				<!-- ── FEET ─────────────────────────────────────── -->
				<g class="part-feet">
					<!-- left foot -->
					<rect x="6"  y="158" width="36" height="18" rx="4"
						fill="rgba(var(--user-color),0.07)" stroke="rgba(var(--user-color),0.55)" stroke-width="1.5"/>
					<!-- right foot -->
					<rect x="58" y="158" width="36" height="18" rx="4"
						fill="rgba(var(--user-color),0.07)" stroke="rgba(var(--user-color),0.55)" stroke-width="1.5"/>
					<!-- toe details -->
					<line x1="16" y1="162" x2="16" y2="172" stroke="rgba(var(--user-color),0.25)" stroke-width="1"/>
					<line x1="68" y1="162" x2="68" y2="172" stroke="rgba(var(--user-color),0.25)" stroke-width="1"/>
				</g>

				<!-- ── LEGS ─────────────────────────────────────── -->
				<g class="part-legs">
					<!-- left leg -->
					<rect x="13" y="116" width="26" height="46" rx="4"
						fill="rgba(var(--user-color),0.07)" stroke="rgba(var(--user-color),0.55)" stroke-width="1.5"/>
					<!-- right leg -->
					<rect x="61" y="116" width="26" height="46" rx="4"
						fill="rgba(var(--user-color),0.07)" stroke="rgba(var(--user-color),0.55)" stroke-width="1.5"/>
					<!-- knee joint line -->
					<line x1="13" y1="138" x2="39" y2="138" stroke="rgba(var(--user-color),0.2)" stroke-width="1"/>
					<line x1="61" y1="138" x2="87" y2="138" stroke="rgba(var(--user-color),0.2)" stroke-width="1"/>
				</g>

				<!-- ── TORSO ─────────────────────────────────────── -->
				<g class="part-torso">
					<!-- main body -->
					<rect x="6" y="52" width="88" height="68" rx="7"
						fill="rgba(var(--user-color),0.06)" stroke="rgba(var(--user-color),0.55)" stroke-width="1.5"/>
					<!-- shoulder ridge -->
					<rect x="6" y="52" width="88" height="12" rx="7"
						fill="rgba(var(--user-color),0.10)" stroke="none"/>
					<rect x="6" y="58" width="88" height="6"
						fill="rgba(var(--user-color),0.10)" stroke="none"/>
					<!-- chest reactor ring (dark when offline) -->
					<circle cx="50" cy="86" r="13"
						fill="rgba(var(--user-color),0.04)" stroke="rgba(var(--user-color),0.35)" stroke-width="1.5"/>
					<circle class="reactor-inner" cx="50" cy="86" r="6"
						fill="rgba(var(--user-color),0.15)" stroke="rgba(var(--user-color),0.3)" stroke-width="1"/>
					<!-- side panel buttons -->
					<rect x="12" y="73" width="12" height="6" rx="2"
						fill="rgba(var(--user-color),0.12)" stroke="rgba(var(--user-color),0.3)" stroke-width="1"/>
					<rect x="76" y="73" width="12" height="6" rx="2"
						fill="rgba(var(--user-color),0.12)" stroke="rgba(var(--user-color),0.3)" stroke-width="1"/>
					<!-- vent lines -->
					<line x1="12" y1="100" x2="88" y2="100" stroke="rgba(var(--user-color),0.15)" stroke-width="1"/>
					<line x1="12" y1="106" x2="88" y2="106" stroke="rgba(var(--user-color),0.10)" stroke-width="1"/>
					<line x1="12" y1="112" x2="88" y2="112" stroke="rgba(var(--user-color),0.08)" stroke-width="1"/>
				</g>

				<!-- ── ARMS ─────────────────────────────────────── -->
				<g class="part-arms">
					<!-- left arm -->
					<rect x="-14" y="56" width="22" height="46" rx="5"
						fill="rgba(var(--user-color),0.07)" stroke="rgba(var(--user-color),0.55)" stroke-width="1.5"/>
					<!-- left hand -->
					<rect x="-16" y="98" width="26" height="18" rx="4"
						fill="rgba(var(--user-color),0.07)" stroke="rgba(var(--user-color),0.45)" stroke-width="1.5"/>
					<!-- right arm -->
					<rect x="92" y="56" width="22" height="46" rx="5"
						fill="rgba(var(--user-color),0.07)" stroke="rgba(var(--user-color),0.55)" stroke-width="1.5"/>
					<!-- right hand -->
					<rect x="90" y="98" width="26" height="18" rx="4"
						fill="rgba(var(--user-color),0.07)" stroke="rgba(var(--user-color),0.45)" stroke-width="1.5"/>
					<!-- elbow joint -->
					<line x1="-14" y1="78" x2="8" y2="78" stroke="rgba(var(--user-color),0.2)" stroke-width="1"/>
					<line x1="92" y1="78" x2="114" y2="78" stroke="rgba(var(--user-color),0.2)" stroke-width="1"/>
				</g>

				<!-- ── NECK ─────────────────────────────────────── -->
				<g class="part-neck">
					<rect x="39" y="40" width="22" height="16" rx="3"
						fill="rgba(var(--user-color),0.08)" stroke="rgba(var(--user-color),0.45)" stroke-width="1.5"/>
				</g>

				<!-- ── HEAD ─────────────────────────────────────── -->
				<g class="part-head">
					<!-- antenna -->
					<line x1="50" y1="-8" x2="50" y2="2"
						stroke="rgba(var(--user-color),0.55)" stroke-width="1.5" stroke-linecap="round"/>
					<circle class="antenna-ball" cx="50" cy="-14" r="5"
						fill="rgba(var(--user-color),0.15)" stroke="rgba(var(--user-color),0.6)" stroke-width="1.5"/>

					<!-- head shell -->
					<rect x="12" y="2" width="76" height="42" rx="9"
						fill="rgba(var(--user-color),0.07)" stroke="rgba(var(--user-color),0.55)" stroke-width="1.5"/>

					<!-- eye sockets (dark) -->
					<rect x="20" y="12" width="24" height="16" rx="4"
						fill="rgba(var(--user-color),0.05)" stroke="rgba(var(--user-color),0.3)" stroke-width="1"/>
					<rect x="56" y="12" width="24" height="16" rx="4"
						fill="rgba(var(--user-color),0.05)" stroke="rgba(var(--user-color),0.3)" stroke-width="1"/>

					<!-- eyes (glow when online) -->
					<rect class="eye-left" x="20" y="12" width="24" height="16" rx="4" fill="none"/>
					<rect class="eye-right" x="56" y="12" width="24" height="16" rx="4" fill="none"/>

					<!-- mouth -->
					<rect x="28" y="34" width="44" height="5" rx="2"
						fill="rgba(var(--user-color),0.15)" stroke="rgba(var(--user-color),0.3)" stroke-width="1"/>

					<!-- ear bolts -->
					<circle cx="12" cy="22" r="3"
						fill="rgba(var(--user-color),0.1)" stroke="rgba(var(--user-color),0.4)" stroke-width="1"/>
					<circle cx="88" cy="22" r="3"
						fill="rgba(var(--user-color),0.1)" stroke="rgba(var(--user-color),0.4)" stroke-width="1"/>
				</g>
			</svg>

			<!-- Label below robot -->
			<p
				class="text-xs tracking-[0.3em] uppercase"
				style="color: rgba(var(--ink),0.65); font-family: var(--font-mono);"
			>
				{label}
			</p>
		</div>

		<!-- ── Progress bar ───────────────────────────────────────────── -->
		<div class="w-full">
			<div class="h-px w-full overflow-hidden" style="background: rgba(var(--ink),0.08);">
				{#if isIndeterminate}
					<!-- Pulsing sweep when no progress yet -->
					<div class="indeterminate-bar h-full" style="background: rgba(var(--user-color),0.7);"></div>
				{:else}
					<div
						class="h-full transition-all duration-300 ease-out"
						style="
							width: {clampedProgress}%;
							background: linear-gradient(90deg, rgba(var(--user-color),0.4) 0%, rgba(var(--user-color),1) 50%, rgba(var(--user-color),0.4) 100%);
							background-size: 200% 100%;
							animation: {clampedProgress < 100 ? 'progress-shine 1.8s linear infinite' : 'none'};
						"
					></div>
				{/if}
			</div>
			<div class="mt-3 flex items-center justify-between">
				<span class="text-xs tabular-nums" style="color: rgba(var(--ink),0.60); font-family: var(--font-mono);">
					{isIndeterminate ? 'Starting up…' : `${Math.round(clampedProgress)}%`}
				</span>
				{#if oncancel}
					<button type="button" onclick={oncancel}
						class="text-xs transition-colors duration-150"
						style="font-family: var(--font-mono); color: rgba(var(--ink),0.35); background: none; border: none; cursor: pointer;"
						onmouseenter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(var(--ink),0.65)'; }}
						onmouseleave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(var(--ink),0.35)'; }}
					>← back to setup</button>
				{/if}
			</div>
		</div>

		<!-- Status text -->
		<p
			class="max-w-xs text-center text-xs leading-relaxed"
			style="color: rgba(var(--ink),0.62); font-family: var(--font-mono); min-height: 2rem;"
		>
			{#if error}
				&nbsp;
			{:else}
				{isIndeterminate ? 'Initializing WebGPU runtime…' : (status || 'Loading…')}
			{/if}
		</p>

		{#if error}
			<div class="w-full rounded-none px-4 py-3 text-center text-xs leading-relaxed"
				style="border: 1px solid rgba(239,68,68,0.35); background: rgba(239,68,68,0.06); font-family: var(--font-mono); color: rgba(239,68,68,0.9);">
				{error}
			</div>
		{:else if clampedProgress < 10}
			<p class="text-center text-xs" style="color: rgba(var(--ink),0.38); font-family: var(--font-mono);">
				First load downloads ~2 GB · cached after that
			</p>
		{/if}
	</div>
</div>

<style>
	/*
	 * Build cycle: 5 s total
	 * Each part uses transform-box:fill-box so transform-origin is relative
	 * to the element itself (not the SVG viewport).
	 *
	 * Timeline (% of 5 s):
	 *   Feet   : reveal  0–14%,  hold 14–86%,  fade 86–96%
	 *   Legs   : reveal 14–26%,  hold 26–86%,  fade 86–96%
	 *   Torso  : reveal 26–40%,  hold 40–86%,  fade 86–96%
	 *   Arms   : reveal 40–56%,  hold 56–86%,  fade 86–96%
	 *   Neck   : reveal 38–50%,  hold 50–86%,  fade 86–96%
	 *   Head   : reveal 56–72%,  hold 72–86%,  fade 86–96%
	 *   Eyes   : reveal 72–80%,  hold 80–86%,  fade 86–94%
	 *   Reactor: same as eyes
	 *   Antenna: pulses once online (72%+)
	 */

	/* ── Indeterminate progress bar ─────────────────────────────── */
	.indeterminate-bar {
		width: 40%;
		animation: indeterminate-sweep 1.6s ease-in-out infinite;
	}
	@keyframes indeterminate-sweep {
		0%   { transform: translateX(-150%); }
		100% { transform: translateX(350%); }
	}

	/* ── Shared reset ────────────────────────────────────────────── */
	.part-feet,
	.part-legs,
	.part-torso,
	.part-arms,
	.part-neck,
	.part-head {
		transform-box: fill-box;
	}

	/* ── Feet — scale up from bottom ─────────────────────────────── */
	.part-feet {
		transform-origin: 50% 100%;
		animation: build-feet 5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
	}
	@keyframes build-feet {
		0%       { transform: scaleY(0); opacity: 0; }
		14%      { transform: scaleY(1); opacity: 1; }
		86%      { transform: scaleY(1); opacity: 1; }
		96%      { transform: scaleY(1); opacity: 0; }
		100%     { transform: scaleY(0); opacity: 0; }
	}

	/* ── Legs — scale up from bottom ─────────────────────────────── */
	.part-legs {
		transform-origin: 50% 100%;
		animation: build-legs 5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
	}
	@keyframes build-legs {
		0%, 14%  { transform: scaleY(0); opacity: 0; }
		26%      { transform: scaleY(1); opacity: 1; }
		86%      { transform: scaleY(1); opacity: 1; }
		96%      { transform: scaleY(1); opacity: 0; }
		100%     { transform: scaleY(0); opacity: 0; }
	}

	/* ── Torso — scale up from bottom ────────────────────────────── */
	.part-torso {
		transform-origin: 50% 100%;
		animation: build-torso 5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
	}
	@keyframes build-torso {
		0%, 26%  { transform: scaleY(0); opacity: 0; }
		40%      { transform: scaleY(1); opacity: 1; }
		86%      { transform: scaleY(1); opacity: 1; }
		96%      { transform: scaleY(1); opacity: 0; }
		100%     { transform: scaleY(0); opacity: 0; }
	}

	/* ── Arms — extend from torso sides ──────────────────────────── */
	.part-arms {
		animation: build-arms 5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
	}
	/* Arms scale horizontally outward from center */
	@keyframes build-arms {
		0%, 40%  { transform: scaleX(0); opacity: 0; }
		56%      { transform: scaleX(1); opacity: 1; }
		86%      { transform: scaleX(1); opacity: 1; }
		96%      { transform: scaleX(1); opacity: 0; }
		100%     { transform: scaleX(0); opacity: 0; }
	}
	/* Override transform-box so arms scale from torso center */
	.part-arms {
		transform-box: fill-box;
		transform-origin: 50% 50%;
	}

	/* ── Neck — pop in with torso (slight delay) ──────────────────── */
	.part-neck {
		transform-origin: 50% 100%;
		animation: build-neck 5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
	}
	@keyframes build-neck {
		0%, 38%  { transform: scaleY(0); opacity: 0; }
		50%      { transform: scaleY(1); opacity: 1; }
		86%      { transform: scaleY(1); opacity: 1; }
		96%      { transform: scaleY(1); opacity: 0; }
		100%     { transform: scaleY(0); opacity: 0; }
	}

	/* ── Head — descends from above ───────────────────────────────── */
	.part-head {
		transform-origin: 50% 0%;
		animation: build-head 5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
	}
	@keyframes build-head {
		0%, 56%  { transform: translateY(-24px) scale(0.85); opacity: 0; }
		72%      { transform: translateY(0) scale(1); opacity: 1; }
		86%      { transform: translateY(0) scale(1); opacity: 1; }
		96%      { transform: translateY(0) scale(1); opacity: 0; }
		100%     { transform: translateY(-12px) scale(0.9); opacity: 0; }
	}

	/* ── Eyes — light up once head is placed ─────────────────────── */
	.eye-left,
	.eye-right {
		animation: eye-online 5s ease-in-out infinite;
	}
	.eye-right {
		animation-delay: 0.06s; /* slight stagger for personality */
	}
	@keyframes eye-online {
		0%, 72%  { fill: transparent; filter: none; }
		78%      { fill: rgba(125, 211, 252, 0.6); filter: drop-shadow(0 0 4px rgba(125,211,252,0.8)); }
		82%      { fill: rgba(125, 211, 252, 0.9); filter: drop-shadow(0 0 8px rgba(125,211,252,1)); }
		84%      { fill: rgba(125, 211, 252, 0.6); filter: drop-shadow(0 0 4px rgba(125,211,252,0.6)); }
		86%      { fill: rgba(125, 211, 252, 0.9); filter: drop-shadow(0 0 8px rgba(125,211,252,1)); }
		88%, 92% { fill: rgba(125, 211, 252, 0.85); }
		96%      { fill: transparent; filter: none; }
		100%     { fill: transparent; }
	}

	/* ── Chest reactor — lights up online ────────────────────────── */
	.reactor-inner {
		animation: reactor-online 5s ease-in-out infinite;
	}
	@keyframes reactor-online {
		0%, 72%  { fill: rgba(var(--user-color), 0.15); filter: none; }
		80%      { fill: rgba(125, 211, 252, 0.7); filter: drop-shadow(0 0 6px rgba(125,211,252,0.9)); }
		84%      { fill: rgba(125, 211, 252, 0.5); }
		88%      { fill: rgba(125, 211, 252, 0.8); filter: drop-shadow(0 0 8px rgba(125,211,252,1)); }
		94%      { fill: rgba(125, 211, 252, 0.4); filter: none; }
		96%      { fill: rgba(var(--user-color), 0.15); }
		100%     { fill: rgba(var(--user-color), 0.15); }
	}

	/* ── Antenna — pulses when robot is online ────────────────────── */
	.antenna-ball {
		animation: antenna-pulse 5s ease-in-out infinite;
	}
	@keyframes antenna-pulse {
		0%, 70%  { fill: rgba(var(--user-color), 0.15); filter: none; }
		76%      { fill: rgba(var(--user-color), 0.8);  filter: drop-shadow(0 0 5px rgba(var(--user-color),1)); }
		80%      { fill: rgba(var(--user-color), 0.4); }
		84%      { fill: rgba(var(--user-color), 0.9);  filter: drop-shadow(0 0 6px rgba(var(--user-color),1)); }
		90%      { fill: rgba(var(--user-color), 0.5); }
		94%      { fill: rgba(var(--user-color), 0.15); filter: none; }
		100%     { fill: rgba(var(--user-color), 0.15); }
	}
</style>
