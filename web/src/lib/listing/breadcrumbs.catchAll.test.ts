import { describe, expect, it } from 'vitest';
import { buildDevelopmentBreadcrumbs, buildPropertyBreadcrumbs } from './breadcrumbs';
import type { PublicDevelopment, PublicPropertyListing } from '$lib/sanity/transforms';

const catchAllListing = {
	title: 'Villa Example',
	location: {
		country: { slug: 'spain', name: 'Spain' },
		location: { slug: 'nueva-andalucia', name: 'Nueva Andalucia' },
		community: {
			slug: 'nueva-andalucia',
			name: 'Nueva Andalucia',
			isCatchAll: true
		}
	}
} as PublicPropertyListing;

const catchAllDevelopment = {
	title: 'Development Example',
	location: {
		country: { slug: 'spain', name: 'Spain' },
		location: { slug: 'nueva-andalucia', name: 'Nueva Andalucia' },
		community: {
			slug: 'nueva-andalucia',
			name: 'Nueva Andalucia',
			isCatchAll: true
		}
	}
} as PublicDevelopment;

describe('catch-all breadcrumbs', () => {
	it('omits the community crumb for catch-all properties', () => {
		const path = '/spain/nueva-andalucia/villa-example';
		expect(buildPropertyBreadcrumbs(catchAllListing, path)).toEqual([
			{ label: 'Home', href: '/' },
			{ label: 'Spain', href: '/spain' },
			{ label: 'Nueva Andalucia', href: '/spain/nueva-andalucia' },
			{ label: 'Villa Example', href: path }
		]);
	});

	it('omits the community crumb for catch-all developments', () => {
		const path = '/spain/nueva-andalucia/development-example';
		expect(buildDevelopmentBreadcrumbs(catchAllDevelopment, path)).toEqual([
			{ label: 'Home', href: '/' },
			{ label: 'Spain', href: '/spain' },
			{ label: 'Nueva Andalucia', href: '/spain/nueva-andalucia' },
			{ label: 'Development Example', href: path }
		]);
	});
});
