import { describe, expect, it } from 'vitest';
import { buildFooter, footerCountries } from './footerContent';
import { buildSiteNav, type SiteNav, type SiteNavGroup } from '$lib/nav/siteNav';
import type { FooterContent } from '$lib/sanity/queries';

const link = (label: string, href: string) => ({ label, href, external: false });

function country(label: string, slug: string, places: string[] = []): SiteNavGroup {
	return {
		label,
		href: `/${slug}`,
		external: false,
		countrySlug: slug,
		flag: null,
		children: places.map((p) => link(p, `/${slug}/${p.toLowerCase()}`))
	};
}

function nav(...items: SiteNav['items']): SiteNav {
	return { items, cta: link('Contact', '/contact') };
}

const content = (columns: FooterContent['columns']): FooterContent => ({
	brandStatement: null,
	inviteLead: null,
	invite: null,
	columns,
	legalLinks: [],
	socialLinks: []
});

describe('footerCountries', () => {
	it('reads every country group, in header order, with its locations', () => {
		const countries = footerCountries(
			nav({
				label: 'Countries',
				href: null,
				external: false,
				children: [country('Spain', 'spain', ['Marbella', 'Estepona']), country('UAE', 'uae')]
			})
		);
		expect(countries.map((c) => c.name)).toEqual(['Spain', 'UAE']);
		expect(countries[0].href).toBe('/spain');
		expect(countries[0].slug).toBe('spain');
		expect(countries[0].flag).toBeNull();
		expect(countries[0].locations.map((l) => l.label)).toEqual(['Marbella', 'Estepona']);
		expect(countries[1].locations).toEqual([]);
	});

	it('skips groups that are not countries, and lists a country once', () => {
		const countries = footerCountries(
			nav(
				{
					label: 'Countries',
					href: null,
					external: false,
					children: [country('Spain', 'spain')]
				},
				{
					label: 'More',
					href: null,
					external: false,
					children: [
						{ ...country('Guides', 'guides'), countrySlug: null },
						country('Spain again', 'spain')
					]
				}
			)
		);
		expect(countries.map((c) => c.name)).toEqual(['Spain']);
	});

	it("falls back to the header's built-in countries when no nav is authored", () => {
		expect(footerCountries(buildSiteNav(null)).map((c) => c.name)).toEqual(['Spain', 'Portugal']);
	});
});

describe('buildFooter', () => {
	const explore = { heading: 'Explore', links: [link('Insights', '/insights')], highlight: null };
	const spainColumn = { heading: 'spain ', links: [link('Marbella', '/spain/marbella')], highlight: null };
	const countries = footerCountries(
		nav({ label: 'Countries', href: null, external: false, children: [country('Spain', 'spain')] })
	);

	it('drops authored columns that repeat a country in the index', () => {
		const footer = buildFooter(content([spainColumn, explore]), countries);
		expect(footer.columns.map((c) => c.heading)).toEqual(['Explore']);
		expect(footer.countries).toBe(countries);
	});

	it('keeps country columns when the index is empty, so nothing disappears', () => {
		const footer = buildFooter(content([spainColumn, explore]), []);
		expect(footer.columns.map((c) => c.heading)).toEqual(['spain ', 'Explore']);
	});

	it('falls back to the built-in Explore column, never a country one', () => {
		expect(buildFooter(null, countries).columns.map((c) => c.heading)).toEqual(['Explore']);
		expect(buildFooter(content([spainColumn]), countries).columns.map((c) => c.heading)).toEqual([
			'Explore'
		]);
	});
});
