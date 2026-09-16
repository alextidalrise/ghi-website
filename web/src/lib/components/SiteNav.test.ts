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

	it('renders the currency chip in the bar, outside the menu and before Contact', () => {
		const html = renderNav();
		const bar = html.slice(0, html.indexOf('id="site-nav-drawer"'));
		// Label spans for the unchosen state and each code; currency.css shows exactly one,
		// so the chip agrees with the prices before any script runs.
		expect(bar).toMatch(/data-ccy=""[^>]*>As listed</);
		for (const code of ['EUR', 'GBP', 'USD', 'AED', 'RUB']) {
			expect(bar).toMatch(new RegExp(`site-nav__ccy-label" data-ccy="${code}">${code}<`));
		}
		// The chip is a bar-level control, not a menu item, and leads the Contact action.
		expect(bar.indexOf('site-nav__ccy')).toBeGreaterThan(bar.indexOf('</ul>'));
		expect(bar.indexOf('site-nav__ccy')).toBeLessThan(bar.indexOf('site-nav__cta'));
	});

	it('offers the six currency options as one radio group, defaulting to "As listed"', () => {
		const html = renderNav();
		const bar = html.slice(0, html.indexOf('id="site-nav-drawer"'));
		expect(bar).toContain('role="radiogroup"');
		expect(bar.match(/role="radio"/g)).toHaveLength(6);
		// Codes are spoken by name, not spelled out letter by letter.
		expect(bar).toMatch(/aria-label="Russian rouble"[^>]*>RUB</);
		expect(bar).toMatch(/aria-checked="true"[^>]*aria-label="Each listing's own currency"/);
		// The dated rate line is always present, whether or not a choice has been made: how
		// fresh the rate is should not be something you have to pick a currency to discover.
		// The bank and its date are bound with non-breaking spaces, so the line wraps at the
		// middot rather than stranding "ECB" at the end of the first line.
		expect(bar).toContain('Converted prices are approximate · ECB\u00A0rates\u00A09\u00A0Sept\u00A02026');
	});

	it('keeps the currency control out of the drawer entirely', () => {
		const html = renderNav();
		const drawer = html.slice(html.indexOf('id="site-nav-drawer"'));
		// It lives in the fixed bar at every width, so a phone never has to scroll to it.
		expect(drawer).not.toContain('Show prices in');
		expect(drawer).not.toContain('site-nav__ccy');
		// Countries speak in the serif country voice; editorial rows do not.
		expect(drawer.match(/site-nav__drawer-link--country/g)).toHaveLength(2);
		expect(drawer).toMatch(/href="\/insights" class="site-nav__drawer-link(?! site-nav__drawer-link--country)/);
		// The pinned Contact footer closes the drawer.
		expect(drawer.indexOf('Insights')).toBeLessThan(drawer.indexOf('site-nav__drawer-footer'));
	});

	it('keeps a narrow dropdown for the fallback menu, whose countries carry no locations', () => {
		const html = renderNav(null);
		expect(html).not.toContain('site-nav__panel');
		expect(html).toContain('site-nav__submenu');
		expect(html).toContain('href="/spain"');
		expect(html).toContain('href="/portugal"');
	});
});
