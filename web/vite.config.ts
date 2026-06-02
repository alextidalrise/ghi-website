import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// pnpm hoists dependencies to the repo-root node_modules (one level above this
		// `web/` project), so the SvelteKit client runtime lives outside Vite's default
		// fs.allow roots and is served as a 403 — which silently breaks hydration. Allow
		// the parent directory so the dev server can serve it.
		fs: {
			allow: ['..']
		}
	},
	test: {
		include: ['src/**/*.test.ts']
	}
});
