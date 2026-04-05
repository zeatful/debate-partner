<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { debate, type DebateSide, type DebateMode } from '$lib/debate.svelte.js';
	import { speech } from '$lib/speech.svelte.js';
	import { llm, AVAILABLE_MODELS } from '$lib/llm.svelte.js';

	let topic = $state('');
	let selectedSide = $state<DebateSide>('for');
	let selectedMode = $state<DebateMode>('human-vs-ai');

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

		// Play voice intro once per session
		if (!sessionStorage.getItem('intro-played')) {
			sessionStorage.setItem('intro-played', '1');
			setTimeout(() => {
				speech.speak(
					"Welcome to Debate Partner. Choose a topic, pick your side, and press the microphone button to make your argument. Good luck."
				);
			}, 800);
		}
	});

	function useSuggestion(s: string) {
		topic = s;
	}

	function start() {
		if (!canStart) return;
		if (selectedMode === 'ai-vs-ai') {
			debate.startAiVsAiDebate(topic.trim());
		} else {
			debate.startDebate(topic.trim(), selectedSide);
		}
		goto('/debate');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && canStart) start();
	}

	function previewVoice(name: string) {
		speech.setVoice(name);
		speech.speak('This is how I will sound during the debate.');
	}

	let isListeningForTopic = $state(false);

	async function dictateTopic() {
		if (isListeningForTopic) {
			speech.stopListening();
			isListeningForTopic = false;
			return;
		}
		isListeningForTopic = true;
		try {
			const result = await speech.listen();
			if (result.trim()) topic = result.trim();
		} catch {
			// ignore
		} finally {
			isListeningForTopic = false;
		}
	}
</script>

<main class="flex min-h-screen flex-col items-center justify-center px-6 py-16" style="background: var(--canvas-bg);">
	<div class="w-full max-w-xl" style="animation: fade-up 0.5s ease-out both;">

		<!-- Wordmark -->
		<div class="mb-16 text-center">
			<p class="mb-3 text-xs tracking-[0.4em] uppercase"
				style="color: rgba(var(--user-color),0.65); font-family: var(--font-mono);">
				Voice · AI · Browser
			</p>
			<h1 class="text-7xl font-normal leading-none tracking-wide"
				style="font-family: var(--font-display); color: rgba(var(--ink),0.95);">Debate</h1>
			<h1 class="text-7xl font-light italic leading-none tracking-wide"
				style="font-family: var(--font-display); color: rgba(var(--ink),0.70);">Partner</h1>
			<div class="mt-5 h-px w-12 mx-auto" style="background: rgba(var(--user-color),0.35);"></div>
		</div>

		<!-- Topic input -->
		<div class="mb-8">
			<label for="topic-input" class="mb-3 block text-xs tracking-[0.25em] uppercase"
				style="color: rgba(var(--ink),0.70); font-family: var(--font-mono);">
				Proposition
			</label>

			<!-- Input row with inline mic button -->
			<div class="flex items-end gap-3"
				style="border-bottom: 1px solid {isListeningForTopic ? 'rgba(var(--user-color),0.5)' : 'rgba(var(--ink),0.18)'}; transition: border-color 0.2s;"
				id="topic-input-row"
			>
				<input
					id="topic-input"
					type="text"
					bind:value={topic}
					onkeydown={handleKeydown}
					placeholder={isListeningForTopic ? 'Listening...' : 'State the proposition to debate...'}
					maxlength="140"
					class="flex-1 bg-transparent py-3 text-base outline-none transition-colors duration-200"
					style="
						font-family: var(--font-mono);
						color: rgba(var(--ink),0.95);
						border: none;
						caret-color: rgba(var(--user-color),1);
					"
					onfocus={() => {
						const row = document.getElementById('topic-input-row');
						if (row) row.style.borderBottomColor = 'rgba(var(--user-color),0.5)';
					}}
					onblur={() => {
						if (!isListeningForTopic) {
							const row = document.getElementById('topic-input-row');
							if (row) row.style.borderBottomColor = 'rgba(var(--ink),0.18)';
						}
					}}
				/>

				<!-- Mic button -->
				<button
					type="button"
					onclick={dictateTopic}
					aria-label={isListeningForTopic ? 'Stop listening' : 'Dictate proposition'}
					class="relative mb-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200"
					style="
						background: {isListeningForTopic ? 'rgba(var(--user-color),0.15)' : 'transparent'};
						border: 1px solid {isListeningForTopic ? 'rgba(var(--user-color),0.55)' : 'rgba(var(--ink),0.18)'};
						color: {isListeningForTopic ? 'rgba(var(--user-color),1)' : 'rgba(var(--ink),0.45)'};
					"
					onmouseenter={(e) => {
						if (isListeningForTopic) return;
						const t = e.currentTarget as HTMLButtonElement;
						t.style.borderColor = 'rgba(var(--user-color),0.4)';
						t.style.color = 'rgba(var(--user-color),0.85)';
					}}
					onmouseleave={(e) => {
						if (isListeningForTopic) return;
						const t = e.currentTarget as HTMLButtonElement;
						t.style.borderColor = 'rgba(var(--ink),0.18)';
						t.style.color = 'rgba(var(--ink),0.45)';
					}}
				>
					<!-- Pulse ring when listening -->
					{#if isListeningForTopic}
						<span class="pointer-events-none absolute inset-0 rounded-full"
							style="border: 1px solid rgba(var(--user-color),0.5); animation: topic-mic-pulse 1.4s ease-out infinite;"></span>
					{/if}

					<!-- Mic SVG -->
					{#if isListeningForTopic}
						<!-- Stop / square icon -->
						<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
							<rect x="2" y="2" width="8" height="8" rx="1"/>
						</svg>
					{:else}
						<!-- Mic icon -->
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<rect x="9" y="2" width="6" height="12" rx="3"/>
							<path d="M5 10a7 7 0 0 0 14 0M12 19v3M9 22h6"/>
						</svg>
					{/if}
				</button>
			</div>

			<div class="mt-2 flex items-center justify-between">
				<span class="text-xs" style="color: rgba(var(--user-color),0.65); font-family: var(--font-mono); min-height: 1em;">
					{#if isListeningForTopic}
						{speech.interimTranscript || 'Say your proposition...'}
					{/if}
				</span>
				<span class="text-xs tabular-nums" style="color: rgba(var(--ink),0.50); font-family: var(--font-mono);">
					{topic.length}/140
				</span>
			</div>
		</div>

		<!-- Suggestions -->
		<div class="mb-10">
			<p class="mb-3 text-xs tracking-[0.2em] uppercase"
				style="color: rgba(var(--ink),0.55); font-family: var(--font-mono);">
				Or try one of these
			</p>
			<div class="flex flex-wrap gap-2">
				{#each suggestions as s}
					<button type="button" onclick={() => useSuggestion(s)}
						class="px-3 py-1.5 text-xs transition-all duration-150"
						style="font-family: var(--font-mono); color: rgba(var(--ink),0.70); border: 1px solid rgba(var(--ink),0.12); background: transparent;"
						onmouseenter={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.color = 'rgba(var(--ink),0.95)'; t.style.borderColor = 'rgba(var(--ink),0.35)'; }}
						onmouseleave={(e) => { const t = e.currentTarget as HTMLButtonElement; t.style.color = 'rgba(var(--ink),0.70)'; t.style.borderColor = 'rgba(var(--ink),0.12)'; }}
					>{s}</button>
				{/each}
			</div>
		</div>

		<!-- Mode selector -->
		<div class="mb-8">
			<p class="mb-4 text-xs tracking-[0.25em] uppercase"
				style="color: rgba(var(--ink),0.70); font-family: var(--font-mono);">Mode</p>
			<div class="grid grid-cols-2 gap-3">
				<button type="button" onclick={() => (selectedMode = 'human-vs-ai')}
					class="relative flex flex-col gap-2 p-5 text-left transition-all duration-200"
					style="
						background: {selectedMode === 'human-vs-ai' ? 'rgba(var(--user-color),0.07)' : 'transparent'};
						border: 1px solid {selectedMode === 'human-vs-ai' ? 'rgba(var(--user-color),0.40)' : 'rgba(var(--ink),0.10)'};
					">
					<span class="text-xs tracking-[0.3em] uppercase"
						style="font-family: var(--font-mono); color: {selectedMode === 'human-vs-ai' ? 'rgba(var(--user-color),1)' : 'rgba(var(--ink),0.40)'};">
						You vs AI
					</span>
					<span class="text-xs leading-relaxed"
						style="font-family: var(--font-mono); color: rgba(var(--ink),0.70);">
						Argue your position against an AI opponent
					</span>
					{#if selectedMode === 'human-vs-ai'}
						<div class="absolute right-3 top-3 h-1.5 w-1.5 rounded-full"
							style="background: rgba(var(--user-color),1);"></div>
					{/if}
				</button>

				<button type="button" onclick={() => (selectedMode = 'ai-vs-ai')}
					class="relative flex flex-col gap-2 p-5 text-left transition-all duration-200"
					style="
						background: {selectedMode === 'ai-vs-ai' ? 'rgba(var(--ai-color),0.06)' : 'transparent'};
						border: 1px solid {selectedMode === 'ai-vs-ai' ? 'rgba(var(--ai-color),0.35)' : 'rgba(var(--ink),0.10)'};
					">
					<span class="text-xs tracking-[0.3em] uppercase"
						style="font-family: var(--font-mono); color: {selectedMode === 'ai-vs-ai' ? 'rgba(var(--ai-color),1)' : 'rgba(var(--ink),0.40)'};">
						AI vs AI
					</span>
					<span class="text-xs leading-relaxed"
						style="font-family: var(--font-mono); color: rgba(var(--ink),0.70);">
						Watch two AIs argue opposite sides automatically
					</span>
					{#if selectedMode === 'ai-vs-ai'}
						<div class="absolute right-3 top-3 h-1.5 w-1.5 rounded-full"
							style="background: rgba(var(--ai-color),1);"></div>
					{/if}
				</button>
			</div>
		</div>

		<!-- Side selector — only shown in human-vs-ai mode -->
		{#if selectedMode === 'human-vs-ai'}
		<div class="mb-8">
			<p class="mb-4 text-xs tracking-[0.25em] uppercase"
				style="color: rgba(var(--ink),0.70); font-family: var(--font-mono);">Your Position</p>
			<div class="grid grid-cols-2 gap-3">
				{#each (['for', 'against'] as DebateSide[]) as side}
					<button type="button" onclick={() => (selectedSide = side)}
						class="relative flex flex-col gap-2 p-5 text-left transition-all duration-200"
						style="
							background: {selectedSide === side ? (side === 'for' ? 'rgba(var(--user-color),0.07)' : 'rgba(var(--ai-color),0.06)') : 'transparent'};
							border: 1px solid {selectedSide === side ? (side === 'for' ? 'rgba(var(--user-color),0.40)' : 'rgba(var(--ai-color),0.35)') : 'rgba(var(--ink),0.10)'};
						">
						<span class="text-xs tracking-[0.3em] uppercase"
							style="font-family: var(--font-mono); color: {selectedSide === side ? (side === 'for' ? 'rgba(var(--user-color),1)' : 'rgba(var(--ai-color),1)') : 'rgba(var(--ink),0.40)'};">
							{side === 'for' ? 'FOR' : 'AGAINST'}
						</span>
						<span class="text-xs leading-relaxed"
							style="font-family: var(--font-mono); color: rgba(var(--ink),0.70);">
							{side === 'for' ? 'Argue in favour of the proposition' : 'Argue against the proposition'}
						</span>
						{#if selectedSide === side}
							<div class="absolute right-3 top-3 h-1.5 w-1.5 rounded-full"
								style="background: {side === 'for' ? 'rgba(var(--user-color),1)' : 'rgba(var(--ai-color),1)'};"></div>
						{/if}
					</button>
				{/each}
			</div>
		</div>
		{:else}
		<!-- AI vs AI: show sides with voice pickers -->
		<div class="mb-8">
			<p class="mb-4 text-xs tracking-[0.25em] uppercase"
				style="color: rgba(var(--ink),0.70); font-family: var(--font-mono);">Sides &amp; Voices</p>
			<div class="grid grid-cols-2 gap-3">
				<!-- AI 1 (FOR) -->
				<div class="flex flex-col gap-3 p-4"
					style="border: 1px solid rgba(var(--user-color),0.22); background: rgba(var(--user-color),0.04);">
					<span class="text-xs tracking-[0.3em] uppercase"
						style="font-family: var(--font-mono); color: rgba(var(--user-color),0.85);">AI 1 · FOR</span>
					<div>
						<p class="mb-1.5 text-[10px] tracking-[0.2em] uppercase"
							style="font-family: var(--font-mono); color: rgba(var(--ink),0.45);">Voice</p>
						<select
							value={speech.ai1VoiceName}
							onchange={(e) => { speech.setAi1Voice(e.currentTarget.value); speech.speak('This is how I will sound during the debate.', e.currentTarget.value); }}
							style="width:100%; font-family:var(--font-mono); font-size:11px; background:rgba(var(--user-color),0.06); color:rgba(var(--ink),0.85); border:1px solid rgba(var(--user-color),0.25); padding:5px 6px; cursor:pointer; outline:none;"
						>
							{#each speech.availableVoices as v}
								<option value={v.name}>{v.label} ({v.region})</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- AI 2 (AGAINST) -->
				<div class="flex flex-col gap-3 p-4"
					style="border: 1px solid rgba(var(--ai-color),0.22); background: rgba(var(--ai-color),0.04);">
					<span class="text-xs tracking-[0.3em] uppercase"
						style="font-family: var(--font-mono); color: rgba(var(--ai-color),0.85);">AI 2 · AGAINST</span>
					<div>
						<p class="mb-1.5 text-[10px] tracking-[0.2em] uppercase"
							style="font-family: var(--font-mono); color: rgba(var(--ink),0.45);">Voice</p>
						<select
							value={speech.ai2VoiceName}
							onchange={(e) => { speech.setAi2Voice(e.currentTarget.value); speech.speak('This is how I will sound during the debate.', e.currentTarget.value); }}
							style="width:100%; font-family:var(--font-mono); font-size:11px; background:rgba(var(--ai-color),0.06); color:rgba(var(--ink),0.85); border:1px solid rgba(var(--ai-color),0.25); padding:5px 6px; cursor:pointer; outline:none;"
						>
							{#each speech.availableVoices as v}
								<option value={v.name}>{v.label} ({v.region})</option>
							{/each}
						</select>
					</div>
				</div>
			</div>
		</div>
		{/if}

		<!-- ── Model picker ─────────────────────────────────────────── -->
		<div class="mb-4" style="border-top: 1px solid rgba(var(--ink),0.08); padding-top: 1.25rem;">
			<button type="button" onclick={() => { showModelPicker = !showModelPicker; showVoicePicker = false; }}
				class="flex w-full items-center justify-between py-1 text-xs"
				style="font-family: var(--font-mono); background: transparent; border: none; cursor: pointer;">
				<span class="tracking-[0.25em] uppercase" style="color: rgba(var(--ink),0.70);">Model</span>
				<span class="flex items-center gap-2" style="color: rgba(var(--ink),0.65);">
					<span>{selectedModelLabel}</span>
					<span style="color: rgba(var(--ink),0.40);">
						{AVAILABLE_MODELS.find(m => m.id === llm.selectedModelId)?.size ?? ''}
					</span>
					<svg width="10" height="6" viewBox="0 0 10 6" fill="none"
						style="transform: {showModelPicker ? 'rotate(180deg)' : 'none'}; transition: transform 0.2s; flex-shrink:0;">
						<path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					</svg>
				</span>
			</button>

			{#if showModelPicker}
				<div class="mt-2" style="border: 1px solid rgba(var(--ink),0.10); animation: fade-up 0.2s ease-out both;">
					{#each AVAILABLE_MODELS as model}
						<button type="button" onclick={() => llm.setModel(model.id)}
							class="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition-colors duration-100"
							style="
								font-family: var(--font-mono);
								background: {llm.selectedModelId === model.id ? 'rgba(var(--user-color),0.07)' : 'transparent'};
								border: none;
								border-bottom: 1px solid rgba(var(--ink),0.06);
								cursor: pointer;
							"
							onmouseenter={(e) => { if (llm.selectedModelId === model.id) return; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(var(--ink),0.03)'; }}
							onmouseleave={(e) => { if (llm.selectedModelId === model.id) return; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
						>
							<div class="flex flex-col gap-0.5 min-w-0">
								<div class="flex items-center gap-2">
									<span class="text-xs" style="color: {llm.selectedModelId === model.id ? 'rgba(var(--user-color),1)' : 'rgba(var(--ink),0.90)'};">
										{model.name}
									</span>
									{#if model.recommended}
										<span class="text-[9px] tracking-widest uppercase px-1.5 py-0.5"
											style="color: rgba(var(--user-color),0.75); border: 1px solid rgba(var(--user-color),0.30);">
											Recommended
										</span>
									{/if}
								</div>
								<span class="text-[11px]" style="color: rgba(var(--ink),0.52);">{model.description}</span>
							</div>
							<span class="text-[11px] flex-shrink-0 tabular-nums" style="color: rgba(var(--ink),0.45);">{model.size}</span>
						</button>
					{/each}
					<p class="px-4 py-2.5 text-[11px]" style="color: rgba(var(--ink),0.38); font-family: var(--font-mono);">
						Downloaded once, cached in your browser. Requires Chrome/Edge with WebGPU.
					</p>
				</div>
			{/if}
		</div>

		<!-- ── Voice picker ─────────────────────────────────────────── -->
		<div class="mb-8" style="border-top: 1px solid rgba(var(--ink),0.08); padding-top: 1.25rem;">
			<button type="button" onclick={() => { showVoicePicker = !showVoicePicker; showModelPicker = false; }}
				class="flex w-full items-center justify-between py-1 text-xs"
				style="font-family: var(--font-mono); background: transparent; border: none; cursor: pointer;">
				<span class="tracking-[0.25em] uppercase" style="color: rgba(var(--ink),0.70);">
					{selectedMode === 'ai-vs-ai' ? 'Narrator Voice' : 'AI Opponent Voice'}
				</span>
				<span class="flex items-center gap-2" style="color: rgba(var(--ink),0.65);">
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
									background: {voiceRegionFilter === region ? 'rgba(var(--ai-color),0.08)' : 'transparent'};
									color: {voiceRegionFilter === region ? 'rgba(var(--ai-color),1)' : 'rgba(var(--ink),0.55)'};
									border: 1px solid {voiceRegionFilter === region ? 'rgba(var(--ai-color),0.35)' : 'rgba(var(--ink),0.10)'};
									cursor: pointer;
								"
							>{region === 'all' ? 'All regions' : region}</button>
						{/each}

						<!-- Divider -->
						<div class="h-5 w-px self-center" style="background: rgba(var(--ink),0.10);"></div>

						<!-- Gender -->
						{#each (['all', 'female', 'male'] as const) as g}
							<button type="button" onclick={() => voiceGenderFilter = g}
								class="px-2.5 py-1 text-[10px] tracking-widest uppercase transition-colors duration-100"
								style="
									font-family: var(--font-mono);
									background: {voiceGenderFilter === g ? 'rgba(var(--ai-color),0.08)' : 'transparent'};
									color: {voiceGenderFilter === g ? 'rgba(var(--ai-color),1)' : 'rgba(var(--ink),0.55)'};
									border: 1px solid {voiceGenderFilter === g ? 'rgba(var(--ai-color),0.35)' : 'rgba(var(--ink),0.10)'};
									cursor: pointer;
								"
							>{g === 'all' ? 'All' : g}</button>
						{/each}

						<!-- Divider -->
						<div class="h-5 w-px self-center" style="background: rgba(var(--ink),0.10);"></div>

						<!-- Quality -->
						{#each (['all', 'premium', 'standard'] as const) as q}
							<button type="button" onclick={() => voiceQualityFilter = q}
								class="px-2.5 py-1 text-[10px] tracking-widest uppercase transition-colors duration-100"
								style="
									font-family: var(--font-mono);
									background: {voiceQualityFilter === q ? 'rgba(var(--ai-color),0.08)' : 'transparent'};
									color: {voiceQualityFilter === q ? 'rgba(var(--ai-color),1)' : 'rgba(var(--ink),0.55)'};
									border: 1px solid {voiceQualityFilter === q ? 'rgba(var(--ai-color),0.35)' : 'rgba(var(--ink),0.10)'};
									cursor: pointer;
								"
							>{q === 'all' ? 'Any quality' : q}</button>
						{/each}
					</div>

					<!-- Voice list -->
					<div class="max-h-52 overflow-y-auto"
						style="border: 1px solid rgba(var(--ink),0.10); scrollbar-width: thin; scrollbar-color: rgba(var(--ink),0.10) transparent;">
						{#if speech.availableVoices.length === 0}
							<p class="px-4 py-3 text-xs" style="color: rgba(var(--ink),0.45); font-family: var(--font-mono);">
								Loading voices...
							</p>
						{:else if filteredVoices.length === 0}
							<p class="px-4 py-3 text-xs" style="color: rgba(var(--ink),0.45); font-family: var(--font-mono);">
								No voices match these filters.
							</p>
						{:else}
							{#each filteredVoices as voice}
								<button type="button" onclick={() => previewVoice(voice.name)}
									class="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors duration-100"
									style="
										font-family: var(--font-mono);
										background: {speech.selectedVoiceName === voice.name ? 'rgba(var(--user-color),0.07)' : 'transparent'};
										color: {speech.selectedVoiceName === voice.name ? 'rgba(var(--user-color),1)' : 'rgba(var(--ink),0.82)'};
										border: none;
										border-bottom: 1px solid rgba(var(--ink),0.06);
										cursor: pointer;
									"
									onmouseenter={(e) => { if (speech.selectedVoiceName === voice.name) return; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(var(--ink),0.04)'; }}
									onmouseleave={(e) => { if (speech.selectedVoiceName === voice.name) return; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
								>
									<div class="flex items-center gap-3 min-w-0">
										<span class="text-xs truncate">{voice.label}</span>
										<!-- Gender icon -->
										{#if voice.gender !== 'unknown'}
											<span style="color: rgba(var(--ink),0.38); font-size: 10px;">
												{voice.gender === 'female' ? '♀' : '♂'}
											</span>
										{/if}
									</div>
									<div class="flex items-center gap-2 flex-shrink-0">
										{#if voice.quality === 'premium'}
											<span class="text-[9px] tracking-widest uppercase"
												style="color: rgba(var(--user-color),0.65);">Neural</span>
										{/if}
										<span style="color: rgba(var(--ink),0.38); font-size: 10px;">
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
				background: {canStart ? 'rgba(var(--user-color),0.08)' : 'transparent'};
				color: {canStart ? 'rgba(var(--user-color),1)' : 'rgba(var(--ink),0.38)'};
				border: 1px solid {canStart ? 'rgba(var(--user-color),0.38)' : 'rgba(var(--ink),0.08)'};
				cursor: {canStart ? 'pointer' : 'not-allowed'};
			"
			onmouseenter={(e) => { if (!canStart) return; const t = e.currentTarget as HTMLButtonElement; t.style.background = 'rgba(var(--user-color),0.13)'; t.style.borderColor = 'rgba(var(--user-color),0.55)'; }}
			onmouseleave={(e) => { if (!canStart) return; const t = e.currentTarget as HTMLButtonElement; t.style.background = 'rgba(var(--user-color),0.08)'; t.style.borderColor = 'rgba(var(--user-color),0.38)'; }}
		>
			{selectedMode === 'ai-vs-ai' ? 'Watch the Debate' : 'Enter the Arena'}
		</button>

		<p class="mt-8 text-center text-xs leading-relaxed"
			style="color: rgba(var(--ink),0.52); font-family: var(--font-mono);">
			All processing happens in your browser. Nothing is sent to any server.
		</p>
	</div>
</main>
