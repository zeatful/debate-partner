<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { debate } from '$lib/debate.svelte.js';
	import { speech } from '$lib/speech.svelte.js';
	import TranscriptEntry from '$lib/components/TranscriptEntry.svelte';

	let showTranscript = $state(false);
	let revealed = $state(false);
	let photoDataUrl = $state<string | null>(null);
	let cameraError = $state(false);
	let verdictSpoken = $state(false);

	onMount(() => {
		if (!debate.verdict) {
			goto('/setup', { replaceState: true });
			return;
		}
		speech.stopSpeaking();

		// Stagger the reveal animation
		setTimeout(() => {
			revealed = true;

			// Auto-read the verdict after reveal animates in
			setTimeout(async () => {
				if (!verdictSpoken) {
					verdictSpoken = true;
					const announcement =
						debate.winner === 'user'
							? `Congratulations! You win. ${debate.verdict}`
							: debate.winner === 'ai'
								? `The AI wins this debate. ${debate.verdict}`
								: debate.winner === 'ai1'
									? `AI 1 wins the debate. ${debate.verdict}`
									: debate.winner === 'ai2'
										? `AI 2 wins the debate. ${debate.verdict}`
										: `It's a draw. ${debate.verdict}`;
					await speech.speak(announcement);
				}
			}, 1000);
		}, 200);

		// Capture webcam photo only if human wins
		if (debate.winner === 'user') {
			capturePhoto();
		}
	});

	onDestroy(() => {
		speech.stopSpeaking();
	});

	async function capturePhoto() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true });
			const video = document.createElement('video');
			video.srcObject = stream;
			video.setAttribute('playsinline', 'true');
			await video.play();
			// Wait a moment for camera to warm up
			await new Promise((r) => setTimeout(r, 800));
			const canvas = document.createElement('canvas');
			canvas.width = 320;
			canvas.height = 320;
			const ctx = canvas.getContext('2d')!;
			// Center-crop from video
			const size = Math.min(video.videoWidth, video.videoHeight);
			const sx = (video.videoWidth - size) / 2;
			const sy = (video.videoHeight - size) / 2;
			ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);
			photoDataUrl = canvas.toDataURL('image/jpeg', 0.92);
			stream.getTracks().forEach((t) => t.stop());
		} catch {
			cameraError = true;
		}
	}

	const winnerColor = $derived(
		debate.winner === 'user' || debate.winner === 'ai1'
			? 'rgba(var(--user-color),1)'
			: debate.winner === 'ai' || debate.winner === 'ai2'
				? 'rgba(var(--ai-color),1)'
				: 'rgba(var(--ink),0.5)'
	);

	const winnerLabel = $derived(
		debate.winner === 'user' ? 'You Win' :
		debate.winner === 'ai'   ? 'AI Wins' :
		debate.winner === 'ai1'  ? 'AI 1 Wins' :
		debate.winner === 'ai2'  ? 'AI 2 Wins' :
		'Draw'
	);

	const winnerSublabel = $derived(
		debate.winner === 'user'
			? 'Your arguments carried the day.'
			: debate.winner === 'ai'
				? 'The opponent proved the stronger case.'
				: debate.winner === 'ai1'
					? 'The FOR side made the stronger case.'
					: debate.winner === 'ai2'
						? 'The AGAINST side made the stronger case.'
						: 'Honours are even.'
	);

	function playAgain() {
		debate.reset();
		goto('/setup');
	}
</script>

<main
	class="flex min-h-screen flex-col items-center justify-center px-6 py-16"
	style="background: var(--canvas-bg);"
>
	{#if revealed && debate.verdict}
		<div class="w-full max-w-xl">
			<!-- Trophy + Avatar -->
			<div
				class="mb-10 flex flex-col items-center"
				style="animation: fade-up 0.5s ease-out both;"
			>
				<!-- Trophy SVG -->
				<div style="animation: trophy-bounce 2.5s ease-in-out 0.8s infinite; margin-bottom: 1.5rem; color: {winnerColor};">
					<svg width="64" height="64" viewBox="0 0 64 64" fill="none">
						<!-- Cup body -->
						<path
							d="M20 8h24v20c0 8.837-4.477 16-12 16s-12-7.163-12-16V8z"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						/>
						<!-- Handles -->
						<path
							d="M20 14H12a6 6 0 0 0 0 12h8M44 14h8a6 6 0 0 1 0 12h-8"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
						<!-- Stem -->
						<path
							d="M32 44v8M24 52h16"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
						<!-- Star -->
						<path
							d="M32 16l1.545 4.755H38.09l-3.818 2.774 1.46 4.471L32 25.22l-3.727 2.78 1.457-4.47L25.91 20.754H30.455z"
							fill="currentColor"
							opacity="0.85"
						/>
					</svg>
				</div>

				<!-- Avatar: webcam photo (user win) or robot (AI win / ai1 / ai2) or generic (draw) -->
				{#if debate.winner === 'user'}
					<div
						class="overflow-hidden"
						style="
							width: 120px;
							height: 120px;
							border-radius: 50%;
							border: 2px solid rgba(var(--user-color),0.5);
							box-shadow: 0 0 40px rgba(var(--user-color),0.15);
							animation: avatar-reveal 0.6s ease-out 0.3s both;
						"
					>
						{#if photoDataUrl}
							<img src={photoDataUrl} alt="Winner" style="width:100%;height:100%;object-fit:cover;" />
						{:else}
							<!-- Placeholder silhouette when camera not available -->
							<div
								style="
									width:100%;height:100%;
									background: rgba(var(--user-color),0.06);
									display:flex;align-items:center;justify-content:center;
								"
							>
								<svg width="56" height="56" viewBox="0 0 56 56" fill="none">
									<circle cx="28" cy="20" r="10" fill="rgba(var(--user-color),0.4)" />
									<path d="M8 50c0-11.046 8.954-20 20-20s20 8.954 20 20" fill="rgba(var(--user-color),0.3)" />
								</svg>
							</div>
						{/if}
					</div>
				{:else if debate.winner === 'ai' || debate.winner === 'ai1' || debate.winner === 'ai2'}
					<!-- Robot SVG -->
					<div
						style="
							width: 120px;
							height: 120px;
							border-radius: 50%;
							border: 2px solid rgba(var(--ai-color),0.4);
							box-shadow: 0 0 40px rgba(var(--ai-color),0.12);
							background: rgba(var(--ai-color),0.04);
							display: flex;
							align-items: center;
							justify-content: center;
							animation: avatar-reveal 0.6s ease-out 0.3s both;
						"
					>
						<svg width="72" height="72" viewBox="0 0 72 72" fill="none">
							<!-- Antenna -->
							<line x1="36" y1="8" x2="36" y2="18" stroke="rgba(var(--ai-color),0.7)" stroke-width="2" stroke-linecap="round"/>
							<circle cx="36" cy="7" r="3" fill="rgba(var(--ai-color),0.7)"/>
							<!-- Head -->
							<rect x="18" y="18" width="36" height="26" rx="5" fill="rgba(var(--ai-color),0.1)" stroke="rgba(var(--ai-color),0.6)" stroke-width="1.5"/>
							<!-- Eyes -->
							<rect x="24" y="25" width="8" height="6" rx="2" fill="rgba(var(--ai-color),0.8)"/>
							<rect x="40" y="25" width="8" height="6" rx="2" fill="rgba(var(--ai-color),0.8)"/>
							<!-- Mouth -->
							<rect x="25" y="35" width="22" height="3" rx="1.5" fill="rgba(var(--ai-color),0.5)"/>
							<!-- Neck -->
							<rect x="31" y="44" width="10" height="5" fill="rgba(var(--ai-color),0.3)"/>
							<!-- Body -->
							<rect x="20" y="49" width="32" height="18" rx="4" fill="rgba(var(--ai-color),0.08)" stroke="rgba(var(--ai-color),0.4)" stroke-width="1.5"/>
							<!-- Chest detail -->
							<circle cx="36" cy="57" r="4" fill="none" stroke="rgba(var(--ai-color),0.5)" stroke-width="1.5"/>
							<circle cx="36" cy="57" r="1.5" fill="rgba(var(--ai-color),0.6)"/>
						</svg>
					</div>
				{:else}
					<!-- Draw — scales of justice icon -->
					<div
						style="
							width: 120px;
							height: 120px;
							border-radius: 50%;
							border: 2px solid rgba(var(--ink),0.2);
							display: flex;
							align-items: center;
							justify-content: center;
							animation: avatar-reveal 0.6s ease-out 0.3s both;
						"
					>
						<svg width="56" height="56" viewBox="0 0 56 56" fill="none">
							<line x1="28" y1="6" x2="28" y2="46" stroke="rgba(var(--ink),0.4)" stroke-width="2"/>
							<line x1="14" y1="8" x2="42" y2="8" stroke="rgba(var(--ink),0.4)" stroke-width="2"/>
							<path d="M14 8l-8 16h16z" fill="rgba(var(--ink),0.2)" stroke="rgba(var(--ink),0.4)" stroke-width="1.5" stroke-linejoin="round"/>
							<path d="M42 8l-8 16h16z" fill="rgba(var(--ink),0.2)" stroke="rgba(var(--ink),0.4)" stroke-width="1.5" stroke-linejoin="round"/>
							<line x1="20" y1="46" x2="36" y2="46" stroke="rgba(var(--ink),0.4)" stroke-width="2"/>
						</svg>
					</div>
				{/if}
			</div>

			<!-- Verdict header -->
			<div
				class="mb-10 text-center"
				style="animation: fade-up 0.5s ease-out 0.2s both;"
			>
				<p
					class="mb-4 text-xs tracking-[0.4em] uppercase"
					style="color: rgba(var(--ink),0.55); font-family: var(--font-mono);"
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
						animation: verdict-reveal 0.8s ease-out 0.4s both;
					"
				>
					{winnerLabel}
				</h1>

				<p
					class="text-sm italic"
					style="
						font-family: var(--font-display);
						color: rgba(var(--ink),0.72);
						font-size: 1.1rem;
						animation: fade-in 0.6s ease-out 0.7s both;
					"
				>
					{winnerSublabel}
				</p>

				<!-- Decorative line in winner color -->
				<div
					class="mx-auto mt-6 h-px w-16"
					style="background: {winnerColor}; opacity: 0.3; animation: scale-in 0.5s ease-out 0.5s both;"
				></div>
			</div>

			<!-- Verdict text (judge's reasoning) -->
			<div
				class="mb-10 px-6 py-5"
				style="
					border: 1px solid var(--border-color);
					background: rgba(var(--ink),0.02);
					animation: fade-up 0.5s ease-out 0.5s both;
				"
			>
				<p
					class="text-[10px] tracking-[0.3em] uppercase mb-3"
					style="color: rgba(var(--ink),0.55); font-family: var(--font-mono);"
				>
					Judge's reasoning
				</p>
				<p
					class="text-sm italic leading-relaxed"
					style="font-family: var(--font-display); color: rgba(var(--ink),0.90); font-size: 1rem;"
				>
					"{debate.verdict}"
				</p>
			</div>

			<!-- Stats -->
			<div
				class="mb-8 grid grid-cols-3 gap-px"
				style="background: var(--border-color); animation: fade-up 0.5s ease-out 0.6s both;"
			>
				{#each [
					{ label: 'Topic', value: `${debate.topic.slice(0, 30)}${debate.topic.length > 30 ? '…' : ''}` },
					debate.mode === 'ai-vs-ai'
						? { label: 'Mode', value: 'AI vs AI' }
						: { label: 'Your Side', value: debate.userSide === 'for' ? 'FOR' : 'AGAINST' },
					{ label: 'Rounds', value: `${debate.roundNumber}` }
				] as stat}
					<div class="px-4 py-4" style="background: var(--canvas-bg);">
						<p
							class="text-[10px] tracking-[0.25em] uppercase mb-1"
							style="color: rgba(var(--ink),0.50); font-family: var(--font-mono);"
						>
							{stat.label}
						</p>
						<p
							class="text-xs"
							style="color: rgba(var(--ink),0.85); font-family: var(--font-mono);"
						>
							{stat.value}
						</p>
					</div>
				{/each}
			</div>

			<!-- Actions -->
			<div
				class="mb-8 flex flex-col gap-3"
				style="animation: fade-up 0.5s ease-out 0.7s both;"
			>
				<button
					type="button"
					onclick={playAgain}
					class="w-full py-4 text-sm tracking-[0.3em] uppercase transition-all duration-150"
					style="
						font-family: var(--font-mono);
						background: rgba(var(--user-color),0.07);
						color: rgba(var(--user-color),1);
						border: 1px solid rgba(var(--user-color),0.3);
					"
					onmouseenter={(e) => {
						const t = e.currentTarget as HTMLButtonElement;
						t.style.background = 'rgba(var(--user-color),0.13)';
					}}
					onmouseleave={(e) => {
						const t = e.currentTarget as HTMLButtonElement;
						t.style.background = 'rgba(var(--user-color),0.07)';
					}}
				>
					Debate Again
				</button>
			</div>

			<!-- Transcript toggle -->
			<div style="animation: fade-up 0.5s ease-out 0.8s both;">
				<button
					type="button"
					onclick={() => (showTranscript = !showTranscript)}
					class="w-full py-3 text-xs tracking-[0.25em] uppercase transition-colors duration-150"
					style="
						font-family: var(--font-mono);
						color: rgba(var(--ink),0.55);
						border: 1px solid rgba(var(--ink),0.08);
						background: transparent;
					"
					onmouseenter={(e) => {
						(e.currentTarget as HTMLButtonElement).style.color = 'rgba(var(--ink),0.85)';
					}}
					onmouseleave={(e) => {
						(e.currentTarget as HTMLButtonElement).style.color = 'rgba(var(--ink),0.55)';
					}}
				>
					{showTranscript ? 'Hide' : 'Review'} Full Transcript ({debate.turns.length} turns)
				</button>

				{#if showTranscript}
					<div
						class="mt-4"
						style="border: 1px solid rgba(var(--ink),0.06); padding: 0 1.5rem; animation: fade-up 0.3s ease-out both;"
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
