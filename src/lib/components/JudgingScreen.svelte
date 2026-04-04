<script lang="ts">
	// Flame positions: [left%, width, height, delay, duration]
	const flames = [
		[42, 28, 55, 0,    1.1],
		[47, 18, 70, 0.15, 1.3],
		[38, 22, 45, 0.3,  1.0],
		[51, 32, 80, 0.1,  1.4],
		[44, 14, 60, 0.45, 1.2],
		[56, 20, 50, 0.25, 0.9],
		[35, 16, 40, 0.55, 1.1],
		[60, 24, 65, 0.05, 1.3],
		[49, 10, 35, 0.7,  0.8],
		[40, 30, 90, 0.2,  1.5],
	];

	const embers = Array.from({ length: 16 }, (_, i) => ({
		left: 30 + Math.sin(i * 2.1) * 25,
		delay: (i * 0.13) % 1.8,
		duration: 0.8 + (i % 4) * 0.2,
		size: 2 + (i % 3),
	}));
</script>

<div class="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
	style="background: #030303;">

	<!-- Ambient fire glow on floor -->
	<div class="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
		style="
			width: 500px; height: 200px;
			background: radial-gradient(ellipse at 50% 100%, rgba(255,80,0,0.18) 0%, rgba(255,140,0,0.08) 40%, transparent 70%);
			filter: blur(20px);
			animation: glow-pulse 1.2s ease-in-out infinite alternate;
		">
	</div>

	<!-- Scene container -->
	<div class="relative flex flex-col items-center" style="margin-bottom: 60px;">

		<!-- Gavel arm -->
		<div style="
			position: relative;
			width: 160px;
			height: 180px;
			transform-origin: 78px 20px;
			animation: gavel-swing 1.8s cubic-bezier(0.25,0.46,0.45,0.94) infinite;
		">
			<!-- Gavel head -->
			<div style="
				position: absolute;
				top: 0; left: 10px;
				width: 120px; height: 40px;
				background: linear-gradient(135deg, #c8a96e 0%, #8b6914 50%, #6b4f10 100%);
				border-radius: 4px;
				box-shadow: 0 4px 20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.15);
			">
				<!-- Head bands -->
				<div style="position:absolute;left:15px;top:0;bottom:0;width:3px;background:rgba(0,0,0,0.3);border-radius:2px;"></div>
				<div style="position:absolute;right:15px;top:0;bottom:0;width:3px;background:rgba(0,0,0,0.3);border-radius:2px;"></div>
				<!-- Shine -->
				<div style="position:absolute;top:4px;left:20px;right:20px;height:2px;background:rgba(255,220,100,0.4);border-radius:2px;"></div>
			</div>
			<!-- Handle -->
			<div style="
				position: absolute;
				top: 30px; left: 72px;
				width: 16px; height: 150px;
				background: linear-gradient(90deg, #7a4f20 0%, #c8a96e 40%, #8b6520 100%);
				border-radius: 3px 3px 6px 6px;
				box-shadow: 2px 0 8px rgba(0,0,0,0.5);
				transform-origin: top center;
			"></div>
		</div>

		<!-- Strike plate -->
		<div style="
			width: 160px; height: 8px;
			background: linear-gradient(90deg, transparent, rgba(200,169,110,0.4) 30%, rgba(200,169,110,0.6) 50%, rgba(200,169,110,0.4) 70%, transparent);
			border-radius: 2px;
			margin-top: -4px;
			box-shadow: 0 2px 12px rgba(255,120,0,0.4);
		"></div>

		<!-- Impact flash -->
		<div style="
			position: absolute;
			bottom: -2px;
			width: 180px; height: 12px;
			background: radial-gradient(ellipse, rgba(255,200,50,0.9) 0%, rgba(255,100,0,0.5) 50%, transparent 75%);
			border-radius: 50%;
			animation: impact-flash 1.8s ease-out infinite;
			filter: blur(3px);
		"></div>

		<!-- Flames -->
		{#each flames as [left, w, h, delay, dur]}
			<div style="
				position: absolute;
				bottom: 4px;
				left: {left}%;
				width: {w}px;
				height: {h}px;
				background: radial-gradient(ellipse at 50% 90%, #fff700 0%, #ff6a00 30%, #ff2200 60%, transparent 100%);
				border-radius: 50% 50% 20% 20%;
				transform-origin: bottom center;
				animation: flame-flicker {dur}s ease-in-out {delay}s infinite alternate;
				filter: blur(1.5px);
				opacity: 0.85;
			"></div>
		{/each}

		<!-- Ember sparks -->
		{#each embers as ember}
			<div style="
				position: absolute;
				bottom: 8px;
				left: {ember.left}%;
				width: {ember.size}px;
				height: {ember.size}px;
				background: #ffcc00;
				border-radius: 50%;
				animation: ember-fly {ember.duration}s ease-out {ember.delay}s infinite;
				box-shadow: 0 0 4px #ff6600;
			"></div>
		{/each}
	</div>

	<!-- Text -->
	<div class="text-center" style="animation: fade-in 0.5s ease-out both;">
		<p class="text-xs tracking-[0.5em] uppercase mb-3"
			style="color: rgba(255,140,0,0.5); font-family: var(--font-mono);">
			The Judge Deliberates
		</p>
		<h2 style="
			font-family: var(--font-display);
			font-size: 2.5rem;
			font-weight: 400;
			color: rgba(237,232,222,0.9);
			letter-spacing: 0.05em;
			animation: text-flicker 2.5s ease-in-out infinite alternate;
		">
			Verdict Pending
		</h2>
		<div class="mt-4 flex justify-center gap-1.5">
			{#each [0, 0.3, 0.6] as d}
				<div style="
					width: 4px; height: 4px;
					background: rgba(255,140,0,0.6);
					border-radius: 50%;
					animation: dot-pulse 1.2s ease-in-out {d}s infinite;
				"></div>
			{/each}
		</div>
	</div>
</div>

<style>
	@keyframes gavel-swing {
		0%   { transform: rotate(-55deg); }
		35%  { transform: rotate(-55deg); }
		55%  { transform: rotate(8deg); }
		62%  { transform: rotate(2deg); }
		68%  { transform: rotate(5deg); }
		80%  { transform: rotate(-10deg); }
		100% { transform: rotate(-55deg); }
	}

	@keyframes flame-flicker {
		0%   { transform: scaleX(1)    scaleY(1)    translateY(0); opacity: 0.85; }
		50%  { transform: scaleX(0.85) scaleY(1.1)  translateY(-6px); opacity: 0.9; }
		100% { transform: scaleX(1.1)  scaleY(0.85) translateY(-2px); opacity: 0.7; }
	}

	@keyframes ember-fly {
		0%   { transform: translate(0, 0) scale(1); opacity: 1; }
		60%  { opacity: 0.8; }
		100% { transform: translate(var(--dx, 20px), -80px) scale(0.3); opacity: 0; }
	}

	@keyframes impact-flash {
		0%   { opacity: 0; transform: scaleX(0.3); }
		50%  { opacity: 0; }
		58%  { opacity: 1; transform: scaleX(1.2); }
		65%  { opacity: 0.6; transform: scaleX(1); }
		80%  { opacity: 0; }
		100% { opacity: 0; }
	}

	@keyframes glow-pulse {
		from { opacity: 0.6; transform: translateX(-50%) scaleX(0.9); }
		to   { opacity: 1;   transform: translateX(-50%) scaleX(1.1); }
	}

	@keyframes text-flicker {
		0%, 95% { opacity: 0.9; }
		96%     { opacity: 0.5; }
		97%     { opacity: 0.9; }
		100%    { opacity: 0.85; }
	}

	@keyframes dot-pulse {
		0%, 100% { transform: scale(1);   opacity: 0.4; }
		50%       { transform: scale(1.5); opacity: 1; }
	}
</style>
