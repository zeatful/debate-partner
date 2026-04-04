<script lang="ts">
	// Spark particles — fan upward from impact point
	const sparks = Array.from({ length: 22 }, (_, i) => {
		const angle = -130 + (i / 22) * 260; // -130° to +130° (upward fan)
		const rad = (angle * Math.PI) / 180;
		const dist = 30 + (i % 5) * 22;
		return {
			dx: Math.cos(rad) * dist,
			dy: Math.sin(rad) * dist - 20,
			size: 1.5 + (i % 3) * 1.2,
			hue: 20 + (i % 4) * 15, // orange to yellow
			delay: (i % 4) * 0.04,
		};
	});

	// Flame tongues erupting at impact
	const flames = [
		{ ox: -22, w: 20, h: 52, delay: 0,    dur: 1.1 },
		{ ox: -10, w: 16, h: 68, delay: 0.12, dur: 1.3 },
		{ ox:   0, w: 22, h: 80, delay: 0.05, dur: 1.15 },
		{ ox:  10, w: 18, h: 60, delay: 0.2,  dur: 1.2 },
		{ ox:  22, w: 15, h: 45, delay: 0.08, dur: 1.0 },
	];
</script>

<!-- Full-screen overlay -->
<div
	class="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
	style="background: #050404;"
>
	<!-- Ambient floor glow that pulses with the strike -->
	<div
		class="pointer-events-none absolute"
		style="
			bottom: 30%;
			left: 50%;
			transform: translateX(-50%);
			width: 480px;
			height: 120px;
			background: radial-gradient(ellipse at 50% 80%, rgba(255,100,10,0.18) 0%, rgba(255,60,0,0.08) 50%, transparent 75%);
			filter: blur(18px);
			animation: glow-breathe 2s ease-in-out infinite;
		"
	></div>

	<!-- ── Scene ─────────────────────────────────────────────────────── -->
	<div class="relative" style="width: 360px; height: 300px; margin-bottom: 48px;">

		<!-- Sound block / strike pad -->
		<div
			style="
				position: absolute;
				bottom: 52px;
				left: 50%;
				transform: translateX(-50%);
				width: 170px;
				height: 22px;
				background: linear-gradient(180deg, #3d2a0e 0%, #2a1c08 60%, #1a1005 100%);
				border-radius: 3px;
				box-shadow:
					0 4px 16px rgba(0,0,0,0.8),
					0 0 30px rgba(255,90,10,0.12),
					inset 0 1px 0 rgba(200,140,40,0.18);
				animation: block-impact 2s ease-in-out infinite;
			"
		>
			<!-- Block highlight band -->
			<div style="
				position: absolute; top: 4px; left: 12px; right: 12px; height: 1px;
				background: rgba(200,140,40,0.3); border-radius: 1px;
			"></div>
			<!-- Block metallic edges -->
			<div style="position:absolute;top:0;left:0;bottom:0;width:10px;background:linear-gradient(90deg,rgba(180,120,30,0.3),transparent);border-radius:3px 0 0 3px;"></div>
			<div style="position:absolute;top:0;right:0;bottom:0;width:10px;background:linear-gradient(270deg,rgba(180,120,30,0.3),transparent);border-radius:0 3px 3px 0;"></div>
		</div>

		<!-- Impact effects — positioned at the strike point -->
		<div
			style="
				position: absolute;
				bottom: 74px;
				left: 50%;
				transform: translateX(-50%);
			"
		>
			<!-- Flame tongues erupting from impact -->
			{#each flames as f}
				<div style="
					position: absolute;
					bottom: 0;
					left: {f.ox - f.w / 2}px;
					width: {f.w}px;
					height: {f.h}px;
					background: radial-gradient(ellipse at 50% 90%,
						rgba(255,255,100,0.95) 0%,
						rgba(255,140,10,0.85) 20%,
						rgba(255,60,0,0.75) 50%,
						rgba(200,20,0,0.4) 75%,
						transparent 100%
					);
					border-radius: 50% 50% 30% 30%;
					transform-origin: bottom center;
					animation: flame-erupt {f.dur}s ease-in-out {f.delay}s infinite;
					filter: blur(1px);
				"></div>
			{/each}

			<!-- Spark particles flying outward -->
			{#each sparks as sp}
				<div style="
					position: absolute;
					bottom: 0;
					left: 0;
					width: {sp.size}px;
					height: {sp.size}px;
					border-radius: 50%;
					background: hsl({sp.hue}, 100%, 65%);
					box-shadow: 0 0 {sp.size * 2}px hsl({sp.hue}, 100%, 70%);
					animation: spark-fly 2s ease-out {sp.delay}s infinite;
					--dx: {sp.dx}px;
					--dy: {sp.dy}px;
				"></div>
			{/each}

			<!-- Central impact flash -->
			<div style="
				position: absolute;
				bottom: -4px;
				left: -40px;
				width: 80px;
				height: 20px;
				background: radial-gradient(ellipse, rgba(255,220,100,0.95) 0%, rgba(255,100,0,0.5) 50%, transparent 75%);
				border-radius: 50%;
				filter: blur(4px);
				animation: impact-burst 2s ease-out infinite;
			"></div>
		</div>

		<!-- ── Gavel assembly ────────────────────────────────────────── -->
		<!--
			Pivot at top-right of this div (transform-origin: right center).
			The div extends LEFT from the pivot — left end = gavel head.
			pivot abs position: (360 - 35) = 325px from left, (30 + 25) = 55px from top
		-->
		<div
			style="
				position: absolute;
				right: 35px;
				top: 30px;
				width: 210px;
				height: 50px;
				transform-origin: right center;
				animation: gavel-swing 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
			"
		>
			<!-- Gavel head (at left/far end) -->
			<div style="
				position: absolute;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
				width: 78px;
				height: 44px;
				background: linear-gradient(160deg,
					#d4a84b 0%,
					#c8962e 25%,
					#8b6010 55%,
					#6b480a 75%,
					#5a3d08 100%
				);
				border-radius: 5px;
				box-shadow:
					0 6px 24px rgba(0,0,0,0.85),
					inset 0 1px 0 rgba(255,220,120,0.35),
					inset 0 -2px 4px rgba(0,0,0,0.4);
			">
				<!-- Head metallic bands -->
				<div style="position:absolute;left:12px;top:0;bottom:0;width:4px;background:linear-gradient(180deg,rgba(80,50,0,0.5),rgba(30,20,0,0.8));border-radius:2px;"></div>
				<div style="position:absolute;right:12px;top:0;bottom:0;width:4px;background:linear-gradient(180deg,rgba(80,50,0,0.5),rgba(30,20,0,0.8));border-radius:2px;"></div>
				<!-- Shine highlight -->
				<div style="position:absolute;top:6px;left:18px;right:18px;height:2px;background:rgba(255,220,130,0.5);border-radius:2px;"></div>
				<!-- Bottom shadow line -->
				<div style="position:absolute;bottom:5px;left:18px;right:18px;height:1px;background:rgba(0,0,0,0.4);border-radius:1px;"></div>
			</div>

			<!-- Handle — tapered wood rod -->
			<div style="
				position: absolute;
				left: 70px;
				top: 50%;
				transform: translateY(-50%);
				width: 140px;
				height: 16px;
				background: linear-gradient(180deg,
					rgba(160,90,20,0.9) 0%,
					#c8873a 15%,
					#a06228 40%,
					#7a4d1e 70%,
					#5c3a14 100%
				);
				border-radius: 2px 8px 8px 2px;
				box-shadow: 0 3px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(200,140,60,0.3);
			">
				<!-- Wood grain lines -->
				<div style="position:absolute;top:4px;left:10px;right:20px;height:1px;background:rgba(90,50,10,0.4);border-radius:1px;"></div>
				<div style="position:absolute;top:8px;left:15px;right:25px;height:1px;background:rgba(90,50,10,0.25);border-radius:1px;"></div>
				<!-- Grip end taper -->
				<div style="
					position:absolute;right:-2px;top:2px;bottom:2px;width:18px;
					background:linear-gradient(90deg,transparent,rgba(80,40,5,0.6));
					border-radius:0 8px 8px 0;
				"></div>
			</div>
		</div>

	</div><!-- /scene -->

	<!-- ── Text ──────────────────────────────────────────────────────── -->
	<div class="text-center" style="animation: fade-in 0.6s ease-out both;">
		<p
			class="mb-4 text-xs tracking-[0.55em] uppercase"
			style="color: rgba(255,140,30,0.55); font-family: var(--font-mono);"
		>
			The Judge Deliberates
		</p>
		<h2 style="
			font-family: var(--font-display);
			font-size: 2.8rem;
			font-weight: 400;
			color: rgba(237,232,222,0.92);
			letter-spacing: 0.04em;
			animation: text-flicker 3s ease-in-out infinite alternate;
		">
			Verdict Pending
		</h2>
		<div class="mt-5 flex justify-center gap-2">
			{#each [0, 0.35, 0.7] as d}
				<div style="
					width: 4px; height: 4px;
					background: rgba(255,130,20,0.65);
					border-radius: 50%;
					animation: dot-pulse 1.4s ease-in-out {d}s infinite;
				"></div>
			{/each}
		</div>
	</div>
</div>

<style>
	/* ── Gavel swings from raised (-40°) down to strike (+50°) ── */
	@keyframes gavel-swing {
		0%   { transform: rotate(-40deg); }
		38%  { transform: rotate(-40deg); }          /* hold raised */
		54%  { transform: rotate(50deg); }            /* SLAM down */
		58%  { transform: rotate(44deg); }            /* bounce 1 */
		62%  { transform: rotate(49deg); }            /* settle */
		66%  { transform: rotate(46deg); }            /* settle 2 */
		78%  { transform: rotate(48deg); }            /* rest at bottom */
		100% { transform: rotate(-40deg); }           /* raise back up */
	}

	/* Sound block shudders on impact */
	@keyframes block-impact {
		0%, 52%  { transform: translateX(-50%) translateY(0); }
		55%      { transform: translateX(-50%) translateY(2px); }
		58%      { transform: translateX(calc(-50% + 2px)) translateY(0); }
		61%      { transform: translateX(calc(-50% - 1px)) translateY(1px); }
		65%, 100%{ transform: translateX(-50%) translateY(0); }
	}

	/* Flame erupts from zero at impact timing */
	@keyframes flame-erupt {
		0%, 52%  { transform: scaleY(0) scaleX(0.3); opacity: 0; }
		55%      { transform: scaleY(1.1) scaleX(1); opacity: 0.95; }
		65%      { transform: scaleY(0.9) scaleX(0.85); opacity: 0.85; }
		80%      { transform: scaleY(1) scaleX(0.7); opacity: 0.7; }
		88%      { transform: scaleY(1.05) scaleX(0.9); opacity: 0.75; }
		95%      { transform: scaleY(0.8) scaleX(0.6); opacity: 0.4; }
		100%     { transform: scaleY(0) scaleX(0.2); opacity: 0; }
	}

	/* Sparks fly outward from impact point */
	@keyframes spark-fly {
		0%, 52%  { transform: translate(0, 0) scale(1.2); opacity: 0; }
		55%      { transform: translate(0, 0) scale(1.5); opacity: 1; }
		75%      { transform: translate(var(--dx), var(--dy)) scale(0.4); opacity: 0.5; }
		80%, 100%{ transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
	}

	/* Central flash at impact */
	@keyframes impact-burst {
		0%, 51%  { opacity: 0; transform: scaleX(0.2) scaleY(0.5); }
		54%      { opacity: 1; transform: scaleX(1.3) scaleY(1); }
		60%      { opacity: 0.6; transform: scaleX(1) scaleY(0.8); }
		68%, 100%{ opacity: 0; transform: scaleX(0.5) scaleY(0.3); }
	}

	@keyframes glow-breathe {
		0%, 100% { opacity: 0.5; transform: translateX(-50%) scaleX(0.85); }
		54%, 62% { opacity: 1; transform: translateX(-50%) scaleX(1.2); }
		80%      { opacity: 0.7; transform: translateX(-50%) scaleX(1); }
	}

	@keyframes text-flicker {
		0%, 90% { opacity: 0.92; }
		92%     { opacity: 0.55; }
		94%     { opacity: 0.92; }
		97%     { opacity: 0.75; }
		100%    { opacity: 0.88; }
	}

	@keyframes dot-pulse {
		0%, 100% { transform: scale(1); opacity: 0.45; }
		50%      { transform: scale(1.6); opacity: 1; }
	}
</style>
