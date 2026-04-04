<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { debate, type DebateSide } from '$lib/debate.svelte.js';
	import { speech } from '$lib/speech.svelte.js';
	import { llm, AVAILABLE_MODELS } from '$lib/llm.svelte.js';

	let topic = $state('');
	let selectedSide = $state<DebateSide>('for');

	// Panel open states
	let showVoicePicker = $state(false);
	let showModelPicker = $state(false);

	// Voice filters
	let voiceRegionFilter = $state<string>('all');
	let voiceGenderFilter = $state<'all' | 'female' | 'male'>('all');
	let voiceQualityFilter = $state<'all' | 'premium' | 'standard'>('all');

	const canStart = $derived(topic.trim().length >= 5);

	const suggestions = [
		'Remote work is better than office work',
		'Social media has done more harm than good',
		'Artificial intelligence will eliminate more jobs than it creates',
		'Universal basic income should be implemented globally',
		'Privacy is more important than national security'
	];

	// Unique regions from available voices
	const availableRegions = $derived(
		['all', ...new Set(speech.availableVoices.map((v) => v.region))].filter(Boolean)
	);

	// Filtered voice list
	const filteredVoices = $derived(
		speech.availableVoices.filter((v) => {
			if (voiceRegionFilter !== 'all' && v.region !== voiceRegionFilter) return false;
			if (voiceGenderFilter !== 'all' && v.gender !== voiceGenderFilter) return false;
			if (voiceQualityFilter !== 'all' && v.quality !== voiceQualityFilter) return false;
			return true;
		})
	);

	const selectedVoiceLabel = $derived(
		speech.availableVoices.find((v) => v.name === speech.selectedVoiceName)?.label ??
			speech.selectedVoiceName ??
			'Default'
	);

	const selectedModelLabel = $derived(
		AVAILABLE_MODELS.find((m) => m.id === llm.selectedModelId)?.name ?? 'Select model'
	);

	onMount(() => {
		speech.initVoices();
	});

	function useSuggestion(s: string) {
		topic = s;
	}

	function start() {
		if (!canStart) return;
		debate.startDebate(topic.trim(), selectedSide);
		goto('/debate');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && canStart) start();
	}

	function previewVoice(name: string) {
		speech.setVoice(name);
		speech.speak('This is how I will sound during the debate.');
	}
</script>

<main class="flex min-h-screen flex-col items-center justify-center px-6 py-16">
	<div class="w-full max-w-xl" style="animation: fade-up 0.5s ease-out both;">

		<!-- Wordmark -->
		<div class="mb-16 text-center">
			<p class="mb-3 text-xs tracking-[0.4em] uppercase"
				style="color: rgba(232,184,75,0.5); font-family: var(--font-mono);">
				Voice · AI · Browser
			</p>
			<h1 class="text-7xl font-normal leading-none tracking-wide"
				style="font-family: var(--font-display); color: #ede8de;">Debate</h1>
			<h1 class="text-7xl font-light italic leading-none tracking-wide"
				style="font-family: var(--font-display); color: rgba(237,232,222,0.65);">Partner</h1>
			<div class="mt-5 h-px w-12 mx-auto" style="background: rgba(232,184,75,0.3);"></div>
		</div>

		<!-- Topic input -->
		<div class="mb-8">
			<label for="topic-input" class="mb-3 block text-xs tracking-[0.25em] uppercase"
				style="color: rgba(237,232,222,0.60); font-family: var(--font-mono);">
				Proposition
			</label>
			<input
				id="topic-input"
				type="text"
				bind:value={topic}
				onkeydown={handleKeydown}
				placeholder="State the proposition to debate..."
				maxlength="140"
				class="w-full bg-transparent py-3 text-base outline-none placeholder:opacity-20 transition-colors duration-200"
				style="font-family: var(--font-mono); color: #ede8de; border-bottom: 1px solid rgba(237,232,222,0.15); caret-color: #e8b84b;"
				onfocus={(e) => { (e.target as HTMLInputElement).style.borderBottomColor = 'rgba(232,184,75,0.4)'; }}
				onblur={(e) => { (e.target as HTMLInputElement).style.borderBottomColor = 'rgba(237,232,222,0.15)'; }}
			/>
			<div class="mt-2 flex justify-end">
				<span class="text-xs tabular-nums" style="color: rgba(237,232,222,0.42); font-family: var(--font-mono);">
					{topic.length}/140
				</span>
			</div>
		</div>

		<!-- Suggestions -->
		<div class="mb-10">
			<p class="mb-3 text-xs tracking-[0.2em] uppercase"
				style="color: rgba(237,232,222,0.45); font-family: var(--font-mono);">
				Or try one of these
			</p>
			<div class="flex flex-wrap gap-2">
				{#each suggestions as s}
					<button type="button" onclick={() => useSuggestion(s)}
						class="px-3 py-1.5 text-xs transition-all duration-150"
						style="font-family: var(--font-mono); color: rgba(237,232,222,0.60); border: 1px solid rgba(237,232,222,0.08); background: transparent;"
						onmouseenter={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.color = 'rgba(237,232,222,0.9)'; t.style.borderColor = 'rgba(237,232,222,0.3)'; }}
						onmouseleave={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.color = 'rgba(237,232,222,0.60)'; t.style.borderColor = 'rgba(237,232,222,0.08)'; }}
					>{s}</button>
				{/each}
			</div>
		</div>

		<!-- Side selector -->
		<div class="mb-8">
			<p class="mb-4 text-xs tracking-[0.25em] uppercase"
				style="color: rgba(237,232,222,0.60); font-family: var(--font-mono);">Your Position</p>
			<div class="grid grid-cols-2 gap-3">
				{#each (['for', 'against'] as DebateSide[]) as side}
					<button type="button" onclick={() => (selectedSide = side)}
						class="relative flex flex-col gap-2 p-5 text-left transition-all duration-200"
						style="
							background: {selectedSide === side ? (side === 'for' ? 'rgba(232,184,75,0.06)' : 'rgba(125,211,252,0.05)') : 'transparent'};
							border: 1px solid {selectedSide === side ? (side === 'for' ? 'rgba(232,184,75,0.35)' : 'rgba(125,211,252,0.3)') : 'rgba(237,232,222,0.08)'};
						">
						<span class="text-xs tracking-[0.3em] uppercase"
							style="font-family: var(--font-mono); color: {selectedSide === side ? (side === 'for' ? '#e8b84b' : '#7dd3fc') : 'rgba(237,232,222,0.3)'};">
							{side === 'for' ? 'FOR' : 'AGAINST'}
						</span>
						<span class="text-xs leading-relaxed"
							style="font-family: var(--font-mono); color: rgba(237,232,222,0.60);">
							{side === 'for' ? 'Argue in favour of the proposition' : 'Argue against the proposition'}
						</span>
						{#if selectedSide === side}
							<div class="absolute right-3 top-3 h-1.5 w-1.5 rounded-full"
								style="background: {side === 'for' ? '#e8b84b' : '#7dd3fc'};"></div>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- ── Model picker ─────────────────────────────────────────── -->
		<div class="mb-4" style="border-top: 1px solid rgba(237,232,222,0.06); padding-top: 1.25rem;">
			<button type="button" onclick={() => { showModelPicker = !showModelPicker; showVoicePicker = false; }}
				class="flex w-full items-center justify-between py-1 text-xs"
				style="font-family: var(--font-mono); background: transparent; border: none; cursor: pointer;">
				<span class="tracking-[0.25em] uppercase" style="color: rgba(237,232,222,0.60);">Model</span>
				<span class="flex items-center gap-2" style="color: rgba(237,232,222,0.55);">
					<span>{selectedModelLabel}</span>
					<span style="color: rgba(237,232,222,0.28);">
						{AVAILABLE_MODELS.find(m => m.id === llm.selectedModelId)?.size ?? ''}
					</span>
					<svg width="10" height="6" viewBox="0 0 10 6" fill="none"
						style="transform: {showModelPicker ? 'rotate(180deg)' : 'none'}; transition: transform 0.2s; flex-shrink:0;">
						<path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					</svg>
				</span>
			</button>

			{#if showModelPicker}
				<div class="mt-2" style="border: 1px solid rgba(237,232,222,0.08); animation: fade-up 0.2s ease-out both;">
					{#each AVAILABLE_MODELS as model}
						<button type="button" onclick={() => llm.setModel(model.id)}
							class="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition-colors duration-100"
							style="
								font-family: var(--font-mono);
								background: {llm.selectedModelId === model.id ? 'rgba(232,184,75,0.06)' : 'transparent'};
								border: none;
								border-bottom: 1px solid rgba(237,232,222,0.04);
								cursor: pointer;
							"
							onmouseenter={(e) => { if (llm.selectedModelId === model.id) return; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(237,232,222,0.03)'; }}
							onmouseleave={(e) => { if (llm.selectedModelId === model.id) return; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
						>
							<div class="flex flex-col gap-0.5 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-xs" style="color: {llm.selectedModelId === model.id ? '#e8b84b' : 'rgba(237,232,222,0.85)'};">
										{model.name}
									</span>
									{#if model.recommended}
										<span class="text-[9px] tracking-widest uppercase px-1.5 py-0.5"
											style="color: rgba(232,184,75,0.7); border: 1px solid rgba(232,184,75,0.25);">
											Recommended
										</span>
									{/if}
								</div>
								<span class="text-[11px]" style="color: rgba(237,232,222,0.40);">{model.description}</span>
							</div>
							<span class="text-[11px] flex-shrink-0 tabular-nums" style="color: rgba(237,232,222,0.35);">{model.size}</span>
						</button>
					{/each}
					<p class="px-4 py-2.5 text-[11px]" style="color: rgba(237,232,222,0.25); font-family: var(--font-mono);">
						Downloaded once, cached in your browser. Requires Chrome/Edge with WebGPU.
					</p>
				</div>
			{/if}
		</div>

		<!-- ── Voice picker ─────────────────────────────────────────── -->
		<div class="mb-8" style="border-top: 1px solid rgba(237,232,222,0.06); padding-top: 1.25rem;">
			<button type="button" onclick={() => { showVoicePicker = !showVoicePicker; showModelPicker = false; }}
				class="flex w-full items-center justify-between py-1 text-xs"
				style="font-family: var(--font-mono); background: transparent; border: none; cursor: pointer;">
				<span class="tracking-[0.25em] uppercase" style="color: rgba(237,232,222,0.60);">Voice</span>
				<span class="flex items-center gap-2" style="color: rgba(237,232,222,0.55);">
					<span>{selectedVoiceLabel}</span>
					<svg width="10" height="6" viewBox="0 0 10 6" fill="none"
						style="transform: {showVoicePicker ? 'rotate(180deg)' : 'none'}; transition: transform 0.2s; flex-shrink:0;">
						<path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					</svg>
				</span>
			</button>

			{#if showVoicePicker}
				<div class="mt-3" style="animation: fade-up 0.2s ease-out both;">

					<!-- Filters -->
					<div class="mb-3 flex flex-wrap gap-2">
						<!-- Region -->
						{#each availableRegions as region}
							<button type="button" onclick={() => voiceRegionFilter = region}
								class="px-2.5 py-1 text-[10px] tracking-widest uppercase transition-colors duration-100"
								style="
									font-family: var(--font-mono);
									background: {voiceRegionFilter === region ? 'rgba(125,211,252,0.08)' : 'transparent'};
									color: {voiceRegionFilter === region ? '#7dd3fc' : 'rgba(237,232,222,0.40)'};
									border: 1px solid {voiceRegionFilter === region ? 'rgba(125,211,252,0.3)' : 'rgba(237,232,222,0.08)'};
									cursor: pointer;
								"
							>{region === 'all' ? 'All regions' : region}</button>
						{/each}

						<!-- Divider -->
						<div class="h-5 w-px self-center" style="background: rgba(237,232,222,0.08);"></div>

						<!-- Gender -->
						{#each (['all', 'female', 'male'] as const) as g}
							<button type="button" onclick={() => voiceGenderFilter = g}
								class="px-2.5 py-1 text-[10px] tracking-widest uppercase transition-colors duration-100"
								style="
									font-family: var(--font-mono);
									background: {voiceGenderFilter === g ? 'rgba(125,211,252,0.08)' : 'transparent'};
									color: {voiceGenderFilter === g ? '#7dd3fc' : 'rgba(237,232,222,0.40)'};
									border: 1px solid {voiceGenderFilter === g ? 'rgba(125,211,252,0.3)' : 'rgba(237,232,222,0.08)'};
									cursor: pointer;
								"
							>{g === 'all' ? 'All' : g}</button>
						{/each}

						<!-- Divider -->
						<div class="h-5 w-px self-center" style="background: rgba(237,232,222,0.08);"></div>

						<!-- Quality -->
						{#each (['all', 'premium', 'standard'] as const) as q}
							<button type="button" onclick={() => voiceQualityFilter = q}
								class="px-2.5 py-1 text-[10px] tracking-widest uppercase transition-colors duration-100"
								style="
									font-family: var(--font-mono);
									background: {voiceQualityFilter === q ? 'rgba(125,211,252,0.08)' : 'transparent'};
									color: {voiceQualityFilter === q ? '#7dd3fc' : 'rgba(237,232,222,0.40)'};
									border: 1px solid {voiceQualityFilter === q ? 'rgba(125,211,252,0.3)' : 'rgba(237,232,222,0.08)'};
									cursor: pointer;
								"
							>{q === 'all' ? 'Any quality' : q}</button>
						{/each}
					</div>

					<!-- Voice list -->
					<div class="max-h-52 overflow-y-auto"
						style="border: 1px solid rgba(237,232,222,0.08); scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.07) transparent;">
						{#if speech.availableVoices.length === 0}
							<p class="px-4 py-3 text-xs" style="color: rgba(237,232,222,0.35); font-family: var(--font-mono);">
								Loading voices...
							</p>
						{:else if filteredVoices.length === 0}
							<p class="px-4 py-3 text-xs" style="color: rgba(237,232,222,0.35); font-family: var(--font-mono);">
								No voices match these filters.
							</p>
						{:else}
							{#each filteredVoices as voice}
								<button type="button" onclick={() => previewVoice(voice.name)}
									class="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors duration-100"
									style="
										font-family: var(--font-mono);
										background: {speech.selectedVoiceName === voice.name ? 'rgba(232,184,75,0.06)' : 'transparent'};
										color: {speech.selectedVoiceName === voice.name ? '#e8b84b' : 'rgba(237,232,222,0.75)'};
										border: none;
										border-bottom: 1px solid rgba(237,232,222,0.04);
										cursor: pointer;
									"
									onmouseenter={(e) => { if (speech.selectedVoiceName === voice.name) return; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(237,232,222,0.03)'; }}
									onmouseleave={(e) => { if (speech.selectedVoiceName === voice.name) return; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
								>
									<div class="flex items-center gap-3 min-w-0">
										<span class="text-xs truncate">{voice.label}</span>
										<!-- Gender icon -->
										{#if voice.gender !== 'unknown'}
											<span style="color: rgba(237,232,222,0.28); font-size: 10px;">
												{voice.gender === 'female' ? '♀' : '♂'}
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-2 flex-shrink-0">
										{#if voice.quality === 'premium'}
											<span class="text-[9px] tracking-widest uppercase"
												style="color: rgba(232,184,75,0.5);">Neural</span>
										{/if}
										<span style="color: rgba(237,232,222,0.25); font-size: 10px;">
											{voice.region} · ▶ preview
										</span>
									</div>
								</button>
							{/each}
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Start button -->
		<button type="button" onclick={start} disabled={!canStart}
			class="w-full py-4 text-sm tracking-[0.3em] uppercase transition-all duration-200"
			style="
				font-family: var(--font-mono);
				background: {canStart ? 'rgba(232,184,75,0.08)' : 'transparent'};
				color: {canStart ? '#e8b84b' : 'rgba(237,232,222,0.38)'};
				border: 1px solid {canStart ? 'rgba(232,184,75,0.35)' : 'rgba(237,232,222,0.06)'};
				cursor: {canStart ? 'pointer' : 'not-allowed'};
			"
			onmouseenter={(e) => { if (!canStart) return; const t = e.currentTarget as HTMLButtonElement; t.style.background = 'rgba(232,184,75,0.13)'; t.style.borderColor = 'rgba(232,184,75,0.55)'; }}
			onmouseleave={(e) => { if (!canStart) return; const t = e.currentTarget as HTMLButtonElement; t.style.background = 'rgba(232,184,75,0.08)'; t.style.borderColor = 'rgba(232,184,75,0.35)'; }}
		>
			Enter the Arena
		</button>

		<p class="mt-8 text-center text-xs leading-relaxed"
			style="color: rgba(237,232,222,0.42); font-family: var(--font-mono);">
			All processing happens in your browser. Nothing is sent to any server.
		</p>
	</div>
</main>
