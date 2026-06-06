import { describe, expect, it } from 'vitest';
import { buildGolfCourseBreadcrumbs } from './breadcrumbs';
import type { PublicGolfCourse } from '$lib/sanity/transforms';

const course: PublicGolfCourse = {
	_id: 'gc-1',
	name: 'Aloha Golf',
	slug: 'aloha-golf',
	shortDescription: null,
	tagline: null,
	seoTitle: null,
	metaDescription: null,
	holes: 18,
	par: 72,
	designStyle: null,
	websiteUrl: null,
	community: {
		_id: 'comm-1',
		name: 'Nueva Andalucia',
		slug: 'nueva-andalucia',
		countrySlug: 'spain',
		locationSlug: 'marbella',
		country: { slug: 'spain', name: 'Spain' },
		parent: { slug: 'marbella', name: 'Marbella' }
	}
};

describe('buildGolfCourseBreadcrumbs', () => {
	it('builds a full trail through community filter URL', () => {
		const path = '/spain/marbella/nueva-andalucia/golf/aloha-golf';
		expect(buildGolfCourseBreadcrumbs(course, path)).toEqual([
			{ label: 'Home', href: '/' },
			{ label: 'Spain', href: '/spain' },
			{ label: 'Marbella', href: '/spain/marbella' },
			{ label: 'Nueva Andalucia', href: '/spain/marbella?community=nueva-andalucia' },
			{ label: 'Aloha Golf', href: path }
		]);
	});
});
