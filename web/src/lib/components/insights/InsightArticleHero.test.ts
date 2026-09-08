import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import type { InsightDetail } from '$lib/insights/types';
import InsightArticleHero from './InsightArticleHero.svelte';

// The hero (and InsightMeta beneath it) are the only children that touch the image builder; stub it
// so the SSR render is a pure markup check and never reaches Sanity's URL helpers.
vi.mock('$lib/sanity/image', () => ({
	buildPublicImageUrl: () => 'https://cdn.test/image.jpg',
	buildImageSrcset: () => 'https://cdn.test/image.jpg 800w',
	getImagePlaceholder: () => null
}));

const baseInsight = (overrides: Partial<InsightDetail>): InsightDetail =>
	({
		title: 'Meet Albany Global',
		titleEmphasis: null,
		insightCategory: 'partner',
		heroImage: { altText: 'Albany' },
		subhead: 'A private-rental partner for Spain and Portugal.',
		publishedAt: '2026-09-01',
		author: null,
		sections: [],
		...overrides
	}) as unknown as InsightDetail;

/** Position of the first match of a tag in the rendered HTML, or -1. */
const indexOf = (html: string, needle: string) => html.indexOf(needle);

describe('InsightArticleHero opening hierarchy', () => {
	it('renders exactly one H1', () => {
		const { body } = render(InsightArticleHero, {
			props: { insight: baseInsight({ heroLayout: 'coBrand' }), breadcrumbs: [] }
		});
		expect(body.match(/<h1/g)?.length ?? 0).toBe(1);
	});

	it('places the H1 before the standfirst in the co-brand hero (DOM order)', () => {
		const { body } = render(InsightArticleHero, {
			props: { insight: baseInsight({ heroLayout: 'coBrand' }), breadcrumbs: [] }
		});
		const h1 = indexOf(body, '<h1');
		const standfirst = indexOf(body, 'article-hero__standfirst');
		expect(h1).toBeGreaterThanOrEqual(0);
		expect(standfirst).toBeGreaterThanOrEqual(0);
		expect(h1).toBeLessThan(standfirst);
	});

	it('places the H1 before the deck in the standard hero (DOM order)', () => {
		const { body } = render(InsightArticleHero, {
			props: { insight: baseInsight({ heroLayout: null }), breadcrumbs: [] }
		});
		const h1 = indexOf(body, '<h1');
		const deck = indexOf(body, 'article-hero__deck');
		expect(h1).toBeGreaterThanOrEqual(0);
		expect(deck).toBeGreaterThanOrEqual(0);
		expect(h1).toBeLessThan(deck);
	});

	it('keeps the emphasised phrase inside the single H1', () => {
		const { body } = render(InsightArticleHero, {
			props: {
				insight: baseInsight({
					heroLayout: 'coBrand',
					title: 'Meet Albany Global',
					titleEmphasis: 'Global'
				}),
				breadcrumbs: []
			}
		});
		// The <em> must sit within the <h1>…</h1>, not as a sibling headline.
		const h1Open = indexOf(body, '<h1');
		const h1Close = body.indexOf('</h1>', h1Open);
		// Svelte scopes the <em> with a class, so match the tag open, not a bare `<em>`.
		const em = body.indexOf('<em', h1Open);
		expect(em).toBeGreaterThan(h1Open);
		expect(em).toBeLessThan(h1Close);
	});
});
