import { describe, expect, it } from 'vitest';
import { tagsForDoc, type PurgePayload } from './purgeTags';

const base = (over: Partial<PurgePayload> & { _type: string }): PurgePayload => ({
	_id: 'doc-1',
	...over
});

describe('tagsForDoc', () => {
	it('always includes the doc tag for the changed document', () => {
		expect(tagsForDoc(base({ _type: 'author' }))).toContain('doc:doc-1');
	});

	it('maps a listing to its location + country grids', () => {
		const tags = tagsForDoc(
			base({
				_id: 'ghi00369',
				_type: 'propertyListing',
				countrySlug: 'uae',
				locationId: 'loc-dubai'
			})
		);
		expect(tags).toEqual(
			expect.arrayContaining(['doc:ghi00369', 'grid:loc:loc-dubai', 'grid:country:uae'])
		);
		// Not frontline → no frontline tags.
		expect(tags).not.toContain('rail:frontline');
	});

	it('adds frontline + golf tags for a frontline listing linking courses', () => {
		const tags = tagsForDoc(
			base({
				_type: 'development',
				countrySlug: 'uae',
				locationId: 'loc-dubai',
				isFrontline: true,
				golfCourseIds: ['gc-earth', null]
			})
		);
		expect(tags).toEqual(
			expect.arrayContaining([
				'rail:frontline',
				'rail:frontline:country:uae',
				'rail:frontline:loc:loc-dubai',
				'golf:gc-earth'
			])
		);
		// A null course ref contributes nothing.
		expect(tags).not.toContain('golf:');
	});

	it('cascades a unit to its parent development and grids', () => {
		const tags = tagsForDoc(
			base({
				_id: 'unit-7',
				_type: 'unit',
				parentDevelopmentId: 'dev-9',
				countrySlug: 'uae',
				locationId: 'loc-dubai'
			})
		);
		expect(tags).toEqual(
			expect.arrayContaining(['doc:unit-7', 'doc:dev-9', 'grid:loc:loc-dubai', 'grid:country:uae'])
		);
	});

	it('maps a country taxonomy node to its grid, home and nav', () => {
		const tags = tagsForDoc(
			base({
				_id: 'ctry-uae',
				_type: 'locationTaxonomy',
				taxonomyType: 'country',
				countrySlug: 'uae'
			})
		);
		expect(tags).toEqual(expect.arrayContaining(['doc:ctry-uae', 'grid:country:uae', 'home', 'nav']));
	});

	it('maps a location taxonomy node to its own grid', () => {
		const tags = tagsForDoc(
			base({
				_id: 'loc-dubai',
				_type: 'locationTaxonomy',
				taxonomyType: 'location',
				countrySlug: 'uae'
			})
		);
		expect(tags).toEqual(
			expect.arrayContaining(['doc:loc-dubai', 'grid:loc:loc-dubai', 'grid:country:uae', 'nav'])
		);
	});

	it('maps a community node to its parent location grid', () => {
		const tags = tagsForDoc(
			base({
				_id: 'comm-jge',
				_type: 'locationTaxonomy',
				taxonomyType: 'community',
				parentLocationId: 'loc-dubai'
			})
		);
		expect(tags).toEqual(expect.arrayContaining(['doc:comm-jge', 'grid:loc:loc-dubai', 'nav']));
	});

	it('maps insight and author to the insights hub', () => {
		expect(tagsForDoc(base({ _type: 'insight' }))).toContain('hub:insights');
		expect(tagsForDoc(base({ _type: 'author' }))).toContain('hub:insights');
	});

	it('maps a guide to the guides hub and its country enquiry-shelf tag', () => {
		const tags = tagsForDoc(base({ _type: 'guide', countrySlug: 'spain' }));
		expect(tags).toEqual(expect.arrayContaining(['hub:guides', 'country:spain']));
	});

	it('maps a partner to the directory, home, and each covered country', () => {
		const tags = tagsForDoc(base({ _type: 'partner', partnerCountrySlugs: ['spain', 'portugal'] }));
		expect(tags).toEqual(
			expect.arrayContaining(['col:partners', 'home', 'country:spain', 'country:portugal'])
		);
	});

	it('maps siteSettings to home + nav', () => {
		expect(tagsForDoc(base({ _type: 'siteSettings' }))).toEqual(
			expect.arrayContaining(['home', 'nav'])
		);
	});

	it('gives a golf course only its doc tag (pages carry it already)', () => {
		expect(tagsForDoc(base({ _id: 'gc-1', _type: 'golfCourse' }))).toEqual(['doc:gc-1']);
	});

	it('returns unique tags', () => {
		const tags = tagsForDoc(
			base({ _type: 'propertyListing', countrySlug: 'uae', locationId: 'loc', isFrontline: true })
		);
		expect(new Set(tags).size).toBe(tags.length);
	});
});
