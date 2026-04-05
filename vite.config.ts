import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), mkcert()],
	optimizeDeps: {
		exclude: ['@mlc-ai/web-llm', 'kokoro-js']
	},
	build: {
		// WebLLM and Kokoro WASM are intentionally large — suppress the noise
		chunkSizeWarningLimit: 25000
	},
	server: {
		host: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin'
		}
	},
	preview: {
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin'
		}
	}
});
