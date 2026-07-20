import { describe, expect, it } from 'vitest';
import {
	CONSENT_CATEGORIES,
	bannerBody,
	categoryById,
	selectableCategories,
	willReload
} from './copy';

describe('CONSENT_CATEGORIES', () => {
	it('lists necessary, analytics and marketing in panel order', () => {
		expect(CONSENT_CATEGORIES.map((c) => c.id)).toEqual(['necessary', 'analytics', 'marketing']);
	});

	it('locks only the necessary category', () => {
		expect(CONSENT_CATEGORIES.filter((c) => c.locked).map((c) => c.id)).toEqual(['necessary']);
	});

	it('gives every category a label and a description', () => {
		for (const category of CONSENT_CATEGORIES) {
			expect(category.label).not.toBe('');
			expect(category.description).not.toBe('');
		}
	});

	it('says marketing is not currently in use rather than implying advertising runs', () => {
		const marketing = categoryById('marketing');
		expect(marketing.description).toMatch(/not running any advertising/i);
	});
});

describe('selectableCategories', () => {
	it('returns the two the visitor can change', () => {
		expect(selectableCategories().map((c) => c.id)).toEqual(['analytics', 'marketing']);
	});
});

describe('categoryById', () => {
	it('resolves a known category', () => {
		expect(categoryById('analytics').label).toBe('Analytics');
	});

	it('throws on an unknown category rather than rendering a blank row', () => {
		// @ts-expect-error deliberately outside the union
		expect(() => categoryById('tracking')).toThrow(/Unknown consent category/);
	});
});

describe('bannerBody', () => {
	it('is shorter on narrow viewports, where the banner stacks above the enquiry bar', () => {
		expect(bannerBody('narrow').length).toBeLessThan(bannerBody('wide').length);
	});

	it('promises nothing is stored before a choice, in both variants', () => {
		expect(bannerBody('narrow')).toMatch(/nothing is stored until you choose/i);
		expect(bannerBody('wide')).toMatch(/nothing is stored on your device until you choose/i);
	});
});

describe('willReload', () => {
	const none = { analytics: false, marketing: false };
	const all = { analytics: true, marketing: true };

	it('is false for a first-time visitor rejecting everything', () => {
		expect(willReload(none, none)).toBe(false);
	});

	it('is false when granting', () => {
		expect(willReload(none, all)).toBe(false);
		expect(willReload({ analytics: true, marketing: false }, all)).toBe(false);
	});

	it('is true when withdrawing a granted category', () => {
		expect(willReload(all, none)).toBe(true);
		expect(willReload(all, { analytics: true, marketing: false })).toBe(true);
		expect(willReload(all, { analytics: false, marketing: true })).toBe(true);
	});

	it('is false when a denied category stays denied', () => {
		expect(willReload({ analytics: true, marketing: false }, { analytics: true, marketing: false }))
			.toBe(false);
	});
});
