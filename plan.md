# Debate Partner — Technical Plan

## Concept
A fully browser-based voice debate app. No server, no API keys, no data leaves the device.
The user picks a topic and a position; the AI argues the opposite side. Fully voice-driven.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| LLM inference | `@mlc-ai/web-llm` | Runs quantized LLMs via WebGPU in-browser |
| Default model | `Llama-3.2-3B-Instruct-q4f16_1-MLC` | ~2GB, fast, capable enough for debate |
| Voice input (STT) | Web Speech API `SpeechRecognition` | Built-in Chrome/Edge, zero download |
| Voice output (TTS) | `kokoro-js` (Kokoro v1.0, 82M) | Runs in-browser via WASM/WebGPU, high quality, Apache licensed |
| Framework | Svelte 5 + SvelteKit | Reactive UI with runes, file-based routing |
| UI components | shadcn-svelte | Tailwind-based component library for Svelte |
| Styling | Tailwind CSS v4 | Utility-first, required by shadcn-svelte |
| Build tool | Vite (via SvelteKit) | Fast dev server, ES module bundling |

---

## Architecture

```
src/
  routes/
    +page.svelte          — root: redirects to /setup or /debate
    setup/
      +page.svelte        — topic entry, side selection
    debate/
      +page.svelte        — main debate arena UI
    results/
      +page.svelte        — final judgment screen
  lib/
    llm.svelte.ts         — WebLLM engine, system prompt, streaming (Svelte store)
    speech.svelte.ts      — STT + Kokoro TTS abstraction (Svelte store)
    debate.svelte.ts      — debate state machine (runes-based store)
  components/
    LoadingScreen.svelte  — model download progress
    TranscriptEntry.svelte — single debate turn (user or AI)
    VoiceButton.svelte    — mic button with animated states
    SideSelector.svelte   — pick your position UI
```

---

## User Flow

1. **Load** — Page loads, WebLLM + Kokoro download models in background with progress bar
2. **Setup** — User types or speaks a debate topic (e.g. "remote work is better than office work")
3. **Pick sides** — User chooses their position (or randomized); AI takes the opposite
4. **Debate rounds** — User speaks → STT transcribes → LLM generates rebuttal → Kokoro speaks it back
5. **End** — After N rounds (or user says "done"), a final LLM call judges the debate and declares a winner

---

## LLM System Prompt Strategy

```
You are a skilled, confident debate opponent. 
Topic: {topic}
Your position: {ai_position}
Your opponent's position: {user_position}

Rules:
- Respond ONLY with your argument/rebuttal — no meta-commentary
- Keep responses to 2–4 sentences, punchy and direct
- Build on prior arguments; don't repeat yourself
- Never concede your position
```

---

## Voice Pipeline (latency strategy)

The key to a good feel is minimizing the gap between user speaking and AI responding:

1. STT result arrives (interim or final)
2. Send final transcript to WebLLM — stream tokens
3. Buffer the first sentence (ends at `.` or `?`)
4. Start Kokoro TTS on that first sentence immediately
5. Continue streaming + queuing subsequent sentences to TTS

This gives a "thinking then speaking" feel with minimal total latency.

---

## Model Download / Caching

- WebLLM caches model weights in the browser's Cache API after first download
- Kokoro weights (~80MB) cached via transformers.js cache
- First load: ~2–2.5GB total download
- Subsequent loads: instant (served from cache)
- Show a cinematic loading screen on first visit explaining what's happening

---

## Browser Requirements

- Chrome 113+ or Edge 113+ (WebGPU required)
- Minimum 8GB RAM recommended (4GB VRAM for GPU path)
- HTTPS required for SpeechRecognition API
- Graceful degradation message for unsupported browsers

---

## Build & Run

```bash
npx sv create . --template minimal --types ts
npx shadcn-svelte@latest init
npm install @mlc-ai/web-llm kokoro-js
npm run dev
```

---

## Phases

### Phase 1 — Skeleton
- Vite project scaffolded
- WebLLM loads a model, responds to a text prompt
- Basic UI shell

### Phase 2 — Voice loop
- STT captures user speech
- LLM responds
- Web Speech API SpeechSynthesis speaks the response (placeholder TTS)

### Phase 3 — Kokoro TTS
- Replace SpeechSynthesis with Kokoro
- Implement streaming sentence-by-sentence TTS pipeline

### Phase 4 — Debate logic + UI
- System prompt, topic/side setup screen
- Round tracking, transcript display
- Final judgment round

### Phase 5 — Polish
- Loading screen with model download progress
- Visual "listening" / "thinking" / "speaking" states
- Mobile-friendly layout (mic input only, no keyboard required)
