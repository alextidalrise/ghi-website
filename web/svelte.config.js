import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
	},
	kit: {
		/* Run the serverless functions in Frankfurt, not Vercel's US-East default.
		   Responses were arriving with `x-vercel-id: fra1::iad1::` — entering the edge
		   network at Frankfurt, then crossing the Atlantic to execute in Washington DC and
		   crossing back. Production TTFB was 1.2–3.0s against a 6–21ms connect, and since
		   nothing paints until the document lands, that gated FCP, LCP and Speed Index
		   alike on every page.
		   fra1 over lhr1: the audience is European buyers of Spanish and Portuguese
		   property rather than UK-only, and Frankfurt is the better-connected hub for the
		   continent. The difference between the two for a UK visitor is ~15ms — noise next
		   to the ~90ms transatlantic hop this removes. One region, so it stays within a
		   Hobby plan's single-region limit. */
		adapter: adapter({ regions: ['fra1'] })
		/* Deliberately no inlineStyleThreshold. Inlining all eight stylesheets does remove
		   every render-blocking request, and Lighthouse against a local preview scored it
		   a point better (94 vs 93) — but production disagreed: 88 against 91. The ~82KB
		   of CSS in the document buys Speed Index (5.1s -> 3.7s) and costs more back on
		   FCP (1.7s -> 2.0s), LCP (2.9s -> 3.4s) and TBT (20ms -> 130ms).
		   Local preview is not a valid test for this setting: it has no GTM and no real
		   network, which is where the larger document is paid for. Re-measure on
		   production, not localhost, before turning it back on. */
	}
};

export default config;
