import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import type { HeaderNav, HeaderNavGroup } from '$lib/sanity/queries/headerNav';
import { CURRENCY_CONTEXT_KEY, CurrencyStore } from '$lib/currency/currency.svelte';

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
	// The root layout provides the currency store; stand in for it here.
	const context = new Map<symbol, unknown>([[CURRENCY_CONTEXT_KEY, new CurrencyStore()]]);
	return render(SiteNav, { props: { nav }, context }).body;
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

	it('renders the currency switcher in the bar, before Contact, with every label variant', () => {
		const html = renderNav();
		const bar = html.slice(0, html.indexOf('id="site-nav-drawer"'));
		expect(bar).toContain('aria-haspopup="menu"');
		// Label spans for the unchosen state and each code; CSS shows exactly one.
		expect(bar).toMatch(/data-ccy=""[^>]*>Prices</);
		for (const code of ['EUR', 'GBP', 'USD', 'AED']) {
			expect(bar).toMatch(new RegExp(`site-nav__currency-label[^>]*data-ccy="${code}"[^>]*>${code}<`));
		}
		// The switcher precedes the Contact action.
		expect(bar.indexOf('site-nav__item--currency')).toBeLessThan(bar.indexOf('site-nav__cta-item'));
		// Five radio rows, "As listed" checked by default, plus the dated rates line.
		expect(bar.match(/role="menuitemradio"/g)).toHaveLength(5);
		expect(bar).toMatch(/aria-checked="true"[^>]*>\s*<span[^>]*>As listed</);
		expect(bar).toContain('ECB rates 9 Sept 2026');
	});

	it('renders the switcher as a flat five-segment row in the drawer', () => {
		const html = renderNav();
		const drawer = html.slice(html.indexOf('id="site-nav-drawer"'));
		expect(drawer).toContain('Show prices in');
		expect(drawer.match(/site-nav__drawer-segment /g)).toHaveLength(5);
		expect(drawer).toMatch(/aria-pressed="true"[^>]*aria-label="As listed"/);
		// It sits after the editorial items and before the pinned Contact footer.
		expect(drawer.indexOf('Insights')).toBeLessThan(drawer.indexOf('site-nav__drawer-currency'));
		expect(drawer.indexOf('site-nav__drawer-currency')).toBeLessThan(
			drawer.indexOf('site-nav__drawer-footer')
		);
	});

	it('keeps a narrow dropdown for the fallback menu, whose countries carry no locations', () => {
		const html = renderNav(null);
		expect(html).not.toContain('site-nav__panel');
		expect(html).toContain('site-nav__submenu');
		expect(html).toContain('href="/spain"');
		expect(html).toContain('href="/portugal"');
	});
});
