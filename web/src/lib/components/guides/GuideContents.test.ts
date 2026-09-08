import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import GuideContents from './GuideContents.svelte';

const items = [
	{ anchor: 'intro', heading: 'Introduction' },
	{ anchor: 'market', heading: 'The market' },
	{ anchor: 'faq', heading: 'Questions' }
];

describe('GuideContents mobile contents state', () => {
	it('wires the collapse control to its list for assistive tech', () => {
		const { body } = render(GuideContents, { props: { items, title: 'In this article' } });
		// The toggle declares its collapsed state and the region it controls.
		expect(body).toMatch(/aria-expanded="false"/);
		const controls = body.match(/aria-controls="([^"]+)"/);
		expect(controls).not.toBeNull();
		// The controlled id names a list that is actually present in the markup.
		expect(body).toContain(`id="${controls![1]}"`);
	});

	it('ships every item as an in-page anchor so no-JS readers can still navigate', () => {
		const { body } = render(GuideContents, { props: { items } });
		for (const item of items) {
			expect(body).toContain(`href="#${item.anchor}"`);
		}
	});

	it('uses the provided title as the control label', () => {
		const { body } = render(GuideContents, { props: { items, title: 'In this article' } });
		expect(body).toContain('In this article');
	});

	it('does not paint the progress fill until the client enhances it', () => {
		// The fill is enhancement-only (needs scroll listeners); the SSR/no-JS render must omit it so
		// hydration starts from a matching, fill-free bar.
		const { body } = render(GuideContents, { props: { items } });
		expect(body).not.toContain('toc__progress');
	});
});
