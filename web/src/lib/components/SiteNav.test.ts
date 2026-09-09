import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import type { HeaderNav, HeaderNavGroup } from '$lib/sanity/queries/headerNav';

// SvelteKit's page state and navigation hooks need a running app; stub them so the
// component renders in a plain node (SSR) test. The pathname drives active-state checks.
let pathname = '/';
vi.mock('$app/state', () => ({
	page: {
		get url() {
			return new URL(`https://www.golfhomesinternational.com${pathname}`);
		}
	}
}));
vi.mock('$app/navigation', () => ({ afterNavigate: () => {} }));

const SiteNav = (await import('./SiteNav.svelte')).default;

function group(partial: Partial<HeaderNavGroup> & { label: string }): HeaderNavGroup {
	return { href: null, external: false, countrySlug: null, flag: null, children: [], ...partial };
}

const threeTier: HeaderNav = {
	items: [
		{
			label: 'Countries',
			href: null,
			external: false,
			children: [
				group({
					label: 'Spain',
					href: '/spain',
					countrySlug: 'spain',
					flag: 'https://cdn.example/es.svg',
					children: [
						{ label: 'Marbella', href: '/spain/marbella', external: false },
						{ label: 'San Pedro de Alcantara', href: '/spain/san-pedro-de-alcantara', external: false }
					]
				}),
				group({
					label: 'Portugal',
					href: '/portugal',
					countrySlug: 'portugal',
					children: [{ label: 'Vilamoura', href: '/portugal/vilamoura', external: false }]
				})
			]
		},
		{ label: 'Insights', href: '/insights', external: false, children: [] }
	],
	cta: { label: 'Contact', href: '/contact', external: false }
};

function renderNav(nav: HeaderNav | null = threeTier, at = '/'): string {
	pathname = at;
	return render(SiteNav, { props: { nav } }).body;
}

describe('SiteNav — three-tier countries menu', () => {
	it('renders a wide panel with one labelled column per country', () => {
		const html = renderNav();
		expect(html).toContain('site-nav__panel');
		expect(html.match(/class="site-nav__column /g)).toHaveLength(2);
		// Each column list is labelled by its country head, so a screen reader hears
		// "Spain, list, 2 items" rather than an anonymous list.
		expect(html).toContain('id="site-nav-col-0-0"');
		expect(html).toContain('aria-labelledby="site-nav-col-0-0"');
		expect(html).toContain('San Pedro de Alcantara');
	});

	it('shows the uploaded flag, and the built-in stamp for a country without one', () => {
		const html = renderNav();
		expect(html).toContain('src="https://cdn.example/es.svg"');
		// Portugal has no uploaded flag: CountryFlagArt draws its built-in stamp.
		expect(html).toContain('fill="#046A38"');
	});

	it('lights the Countries item, the country head and the location for the current page', () => {
		const html = renderNav(threeTier, '/spain/marbella');
		const countries = html.slice(html.indexOf('site-nav__link--button'), html.indexOf('Countries'));
		expect(countries).toContain('is-active');
		// Scoped class hashes sit between the class names, so match loosely.
		expect(html).toMatch(/href="\/spain" class="site-nav__column-head [^"]*is-active" aria-current="page"/);
		expect(html).toMatch(
			/href="\/spain\/marbella" class="site-nav__column-link [^"]*is-active" aria-current="page"/
		);
	});

	it('flattens the panel item to an overline and country accordions in the drawer', () => {
		const html = renderNav();
		expect(html).toContain('site-nav__drawer-overline');
		expect(html).toContain('id="drawer-submenu-0-0"');
		expect(html).toContain('id="drawer-submenu-0-1"');
		expect(html).toContain('aria-label="Show Spain submenu"');
		// The countries section is its own group; Insights follows as a plain row.
		const drawer = html.slice(html.indexOf('id="site-nav-drawer"'));
		expect(drawer.indexOf('site-nav__drawer-section')).toBeLessThan(drawer.indexOf('Insights'));
	});

	it('keeps a narrow dropdown for the fallback menu, whose countries carry no locations', () => {
		const html = renderNav(null);
		expect(html).not.toContain('site-nav__panel');
		expect(html).toContain('site-nav__submenu');
		expect(html).toContain('href="/spain"');
		expect(html).toContain('href="/portugal"');
	});
});
