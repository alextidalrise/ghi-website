import { describe, expect, it } from 'vitest';
import { INSIGHT_SECTION_PUBLIC } from './allowlists';

/**
 * The public Insight section projection is the security boundary for the external-property grid:
 * partner rentals are article-owned, and the editor's internal approval notes must never reach the
 * browser. These assertions lock the projected field set so a future edit can't silently leak them.
 */
describe('insightExternalPropertyGrid public projection', () => {
	it('projects the block with its public reader-facing fields', () => {
		expect(INSIGHT_SECTION_PUBLIC).toContain('_type == "insightExternalPropertyGrid"');
		for (const field of [
			'name',
			'location',
			'guests',
			'bedrooms',
			'fromPrice',
			'description',
			'features',
			'linkLabel',
			'linkHref',
			'priceNote'
		]) {
			expect(INSIGHT_SECTION_PUBLIC).toContain(field);
		}
	});

	it('never projects the internal-only approval notes', () => {
		expect(INSIGHT_SECTION_PUBLIC).not.toContain('sourceNote');
		expect(INSIGHT_SECTION_PUBLIC).not.toContain('checkedAt');
	});

	it('excludes the block from the catch-all pass-through so only the explicit fields are exposed', () => {
		expect(INSIGHT_SECTION_PUBLIC).toContain('_type != "insightExternalPropertyGrid"');
	});
});
