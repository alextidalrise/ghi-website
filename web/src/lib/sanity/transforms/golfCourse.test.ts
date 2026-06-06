import { describe, expect, it } from 'vitest';
import {
	buildGolfCourseHref,
	buildGolfCourseRefHref,
	toGolfCourseCard,
	toPublicGolfCourse
} from './golfCourse';

describe('buildGolfCourseHref', () => {
	it('builds a canonical golf course path', () => {
		expect(
			buildGolfCourseHref({
				countrySlug: 'spain',
				locationSlug: 'marbella',
				communitySlug: 'nueva-andalucia',
				courseSlug: 'aloha-golf'
			})
		).toBe('/spain/marbella/nueva-andalucia/golf/aloha-golf');
	});

	it('returns null when a segment is missing', () => {
		expect(
			buildGolfCourseHref({
				countrySlug: 'spain',
				locationSlug: 'marbella',
				communitySlug: null,
				courseSlug: 'aloha-golf'
			})
		).toBeNull();
	});
});

describe('buildGolfCourseRefHref', () => {
	it('builds href from a listing golf course reference', () => {
		expect(
			buildGolfCourseRefHref({
				slug: 'la-quinta-golf',
				countrySlug: 'spain',
				locationSlug: 'marbella',
				communitySlug: 'la-quinta'
			})
		).toBe('/spain/marbella/la-quinta/golf/la-quinta-golf');
	});
});

describe('toPublicGolfCourse', () => {
	it('returns null without required fields', () => {
		expect(toPublicGolfCourse({ name: 'Aloha Golf' })).toBeNull();
	});

	it('normalizes public golf course fields', () => {
		expect(
			toPublicGolfCourse({
				_id: 'gc-1',
				name: 'Aloha Golf',
				slug: 'aloha-golf',
				tagline: '  Parkland classic ',
				shortDescription: ' A renowned course '
			})
		).toEqual({
			_id: 'gc-1',
			name: 'Aloha Golf',
			slug: 'aloha-golf',
			shortDescription: 'A renowned course',
			tagline: 'Parkland classic',
			seoTitle: null,
			metaDescription: null,
			holes: null,
			par: null,
			designStyle: null,
			websiteUrl: null,
			community: null
		});
	});
});

describe('toGolfCourseCard', () => {
	it('returns null without image or href segments', () => {
		expect(
			toGolfCourseCard({
				name: 'Aloha Golf',
				slug: 'aloha-golf'
			})
		).toBeNull();
	});
});
