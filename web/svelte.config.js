import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
	},
	kit: {
		adapter: adapter(),
		// Merge and inline every stylesheet under this size (UTF-16 code units, measured
		// uncompressed) instead of linking it. The homepage pulled eight stylesheets —
		// 82KB raw, ~18KB gzipped, largest 31KB — and render-blocking CSS is fetched at
		// the browser's highest priority, above images, which `fetchpriority="high"`
		// cannot outrank. So those eight requests sat in front of the LCP hero: 2.4s of
		// resource load delay for an image that then transferred in 22ms.
		//
		// Inlining is roughly transfer-neutral (the same bytes move, gzipped, inside the
		// document) and trades eight blocking round trips for none. Lighthouse mobile,
		// same build, varying only this number: 91 with eight blocking, 93 with four,
		// 94 with none. It costs some main-thread parse time, so TBT rises — worth it
		// while TBT has headroom, but that is the number to watch if this is raised.
		//
		// 40000 clears the largest file. A previous attempt at 102400 appeared to regress
		// badly, but it shipped alongside a 138KB hero image that was the real cause.
		inlineStyleThreshold: 40000
	}
};

export default config;
