<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';
	import CountryFlagArt from '$lib/components/CountryFlagArt.svelte';
	import {
		buildSiteNav,
		hasPanel,
		isNavItemActive,
		isSiteNavGroupActive,
		isSiteNavItemActive,
		type SiteNavGroup,
		type SiteNavItem
	} from '$lib/nav/siteNav';
	import type { HeaderNav } from '$lib/sanity/queries/headerNav';
	import { CURRENCY_NAMES } from '$lib/currency/convert';
	import { getCurrency } from '$lib/currency/currency.svelte';
	import { CURRENCIES, type Currency } from '$lib/currency/rates';
	import { trackCurrencySelected } from '$lib/analytics';

	let { nav = null }: { nav?: HeaderNav | null } = $props();

	const site = $derived(buildSiteNav(nav));
	const navItems = $derived(site.items);
	const cta = $derived(site.cta);

	// The display-currency picker. It is a control, not a destination, so it sits outside
	// the authored menu list and is addressed by a sentinel index in the same one-open-at-
	// a-time state machine the CMS dropdowns use — no authored item can ever collide with
	// it. Unlike those dropdowns it does not open on hover: a pointer crossing the bar on
	// its way to Contact must not drop a picker over the page.
	const CURRENCY_MENU = -1;
	const currency = getCurrency();
	const currencyOptions: { code: Currency | null; label: string; name: string }[] = [
		{ code: null, label: 'As listed', name: "Each listing's own currency" },
		...CURRENCIES.map((code) => ({ code, label: code, name: CURRENCY_NAMES[code] }))
	];

	// Non-breaking spaces inside the date: the note is two short lines in a 19.5rem panel,
	// and "15 Sept 2026" splitting across the break reads as two separate facts.
	const formatRateDate = (iso: string) =>
		new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
			.format(new Date(`${iso}T00:00:00Z`))
			.replace(/ /g, '\u00A0');

	/**
	 * The panel's one line of fine print: what the figures are, and how fresh the rate
	 * behind them is. It is always present and always dated — a visitor deciding whether to
	 * trust a converted price should not have to make a selection to find out when the rate
	 * was set.
	 *
	 * Only the attribution moves. The rouble is not an ECB rate (the ECB has published none
	 * since March 2022), so while roubles are showing the line cites the Central Bank of
	 * Russia's fixing and its own date, which the two banks' different calendars can put a
	 * day or two apart.
	 *
	 * This is the only part of the switcher that depends on `chosen` at render time rather
	 * than through CSS. That is safe because it lives inside a panel that cannot be opened
	 * before hydration, so an edge-cached document never shows a stale sentence.
	 */
	// The attribution ("ECB rates 15 Sept 2026") is one fact, so it is bound with
	// non-breaking spaces: the line wraps at the middot, never between a bank and its date.
	const rateSource = (bank: string, iso: string) => `${bank}\u00A0rates\u00A0${formatRateDate(iso)}`;
	const currencyNote = $derived(
		`Converted prices are approximate · ${
			currency.chosen === 'RUB'
				? rateSource('CBR', currency.rubAsOf)
				: rateSource('ECB', currency.asOf)
		}`
	);

	let currencyButton = $state<HTMLButtonElement>();
	let currencyMenu = $state<HTMLElement>();
	let currencyRoot = $state<HTMLElement>();

	// The single point where a currency choice is recorded. Read the prior choice before
	// applying so the event can carry it, and report only a real change — re-picking the
	// current currency is a no-op worth no measurement.
	function chooseCurrency(code: Currency | null) {
		const previous = currency.chosen;
		currency.select(code);
		if (code !== previous) {
			trackCurrencySelected({ currency: code, previous, placement: 'nav_bar' });
		}
		openMenu = null;
		currencyButton?.focus();
	}

	function toggleCurrencyPicker() {
		if (currencyOpen) openMenu = null;
		else void openCurrencyPicker();
	}

	// Opening moves focus onto the chosen cell so the arrow keys work at once; Escape hands
	// focus back to the chip. The picker and the mobile drawer are both bar-level overlays,
	// so one opening closes the other rather than stacking them.
	async function openCurrencyPicker() {
		open = false;
		openMenu = CURRENCY_MENU;
		await tick();
		// After the DOM update, and one frame later so the panel has computed as visible
		// (an element that still computes hidden refuses focus).
		requestAnimationFrame(() => {
			currencyMenu?.querySelector<HTMLButtonElement>('[role="radio"][aria-checked="true"]')?.focus();
		});
	}

	function onCurrencyButtonKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			void openCurrencyPicker();
		} else if (event.key === 'Enter' || event.key === ' ') {
			// Handled here rather than by the synthesised click so the open moves focus.
			event.preventDefault();
			toggleCurrencyPicker();
		}
	}

	/**
	 * Radio-group keys across the picker's cells: arrows move focus, Home/End jump, and the
	 * choice is taken with Enter or Space. Focus deliberately does not select as it moves —
	 * the usual radio-group shortcut — because selecting here writes a cookie, repaints
	 * every price on the page and reports an analytics event; arrowing past four currencies
	 * to reach the fifth would fire all four.
	 */
	function onCurrencyMenuKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			openMenu = null;
			currencyButton?.focus();
			return;
		}
		const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
		if (!keys.includes(event.key)) return;
		const cells = Array.from(
			(event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="radio"]')
		);
		if (cells.length === 0) return;
		const current = cells.indexOf(document.activeElement as HTMLButtonElement);
		let next: number;
		if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (current + 1) % cells.length;
		else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft')
			next = (current - 1 + cells.length) % cells.length;
		else if (event.key === 'Home') next = 0;
		else next = cells.length - 1;
		event.preventDefault();
		cells[next]?.focus();
	}

	// The picker opens on activation, not on hover, so nothing closes it when the pointer
	// wanders off. A press anywhere outside it does — the same guard a filter popover uses.
	function onWindowPointerDown(event: PointerEvent) {
		if (!currencyOpen) return;
		if (currencyRoot?.contains(event.target as Node)) return;
		openMenu = null;
	}

	let open = $state(false); // mobile drawer
	let openMenu = $state<number | null>(null); // desktop dropdown / panel index, if any
	const currencyOpen = $derived(openMenu === CURRENCY_MENU);
	// Mobile accordion key, if any: `${i}` for a top-level dropdown, `${i}.${g}` for a
	// country inside a panel item (the drawer flattens the panel's first tier to a label,
	// so its countries are the drawer's own accordions).
	let expanded = $state<string | null>(null);
	let navRoot = $state<HTMLElement>();
	let drawer = $state<HTMLElement>();
	let toggleButton = $state<HTMLButtonElement>();

	function isActive(href: string | null): boolean {
		return isNavItemActive(href, page.url.pathname);
	}

	function itemActive(item: SiteNavItem): boolean {
		return isSiteNavItemActive(item, page.url.pathname);
	}

	function groupActive(group: SiteNavGroup): boolean {
		return isSiteNavGroupActive(group, page.url.pathname);
	}

	/** The accordion that should open to reveal the current page, if any. */
	function activeAccordionKey(): string | null {
		for (const [i, item] of navItems.entries()) {
			if (hasPanel(item)) {
				const g = item.children.findIndex((group) => group.children.length > 0 && groupActive(group));
				if (g !== -1) return `${i}.${g}`;
			} else if (item.children.length > 0 && itemActive(item)) {
				return `${i}`;
			}
		}
		return null;
	}

	// Opening the drawer answers "where am I?": the accordion holding the active page
	// starts expanded so its gold marker is visible instead of hidden behind a collapsed
	// group. No active section collapses everything.
	function toggleDrawer() {
		open = !open;
		// The picker hangs off the same bar; opening the drawer over it would leave two
		// overlays on screen with one scrim between them.
		if (open) {
			openMenu = null;
			expanded = activeAccordionKey();
		}
	}

	function toggleAccordion(key: string) {
		expanded = expanded === key ? null : key;
	}

	function openDropdown(i: number) {
		openMenu = i;
	}

	function closeDropdown(i: number) {
		if (openMenu === i) openMenu = null;
	}

	// Hover intent: a pointer crossing the bar on its way to Contact must not flash the
	// full-width panel over the page, so a pointer opens after a short settle and a
	// leave inside that window cancels it. Once a menu is open, moving to a sibling
	// switches at once. Click and focus stay immediate (see the handlers below).
	const HOVER_INTENT_MS = 120;
	let hoverTimer: ReturnType<typeof setTimeout> | null = null;

	function cancelHoverIntent() {
		if (hoverTimer !== null) {
			clearTimeout(hoverTimer);
			hoverTimer = null;
		}
	}

	function pointerEnterItem(i: number) {
		cancelHoverIntent();
		if (openMenu !== null) {
			openDropdown(i);
			return;
		}
		hoverTimer = setTimeout(() => {
			hoverTimer = null;
			openDropdown(i);
		}, HOVER_INTENT_MS);
	}

	function pointerLeaveItem(i: number) {
		cancelHoverIntent();
		closeDropdown(i);
	}

	function toggleDropdown(i: number) {
		openMenu = openMenu === i ? null : i;
	}

	// Close a desktop dropdown once focus leaves its item entirely (keyboard users tabbing
	// past the last sub-link). relatedTarget is the element focus is moving to. The wide
	// panel is a DOM descendant of its item even though it spans the bar, so the same
	// containment test covers both shapes.
	function handleItemFocusOut(event: FocusEvent, i: number) {
		const next = event.relatedTarget as Node | null;
		const item = event.currentTarget as HTMLElement;
		if (!next || !item.contains(next)) closeDropdown(i);
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && openMenu !== null) {
			openMenu = null;
		}
	}

	// Close everything after any navigation (e.g. a link tap inside the drawer or a
	// dropdown). afterNavigate only fires on real route changes.
	afterNavigate(() => {
		cancelHoverIntent();
		open = false;
		openMenu = null;
		expanded = null;
	});

	$effect(() => () => cancelHoverIntent());

	// Growing past the drawer breakpoint (rotating an iPad, un-snapping a window) hides
	// the open drawer via CSS but leaves `open` true — scroll stays locked and focus
	// stays trapped with no visible way out. Close it for real when the bar takes over.
	// Must mirror the @media (max-width: 79.9375rem) block below.
	$effect(() => {
		const drawerViewport = window.matchMedia('(max-width: 79.9375rem)');
		function onChange(event: MediaQueryListEvent) {
			if (!event.matches) open = false;
		}
		drawerViewport.addEventListener('change', onChange);
		return () => drawerViewport.removeEventListener('change', onChange);
	});

	// While the drawer is open: lock body scroll, trap focus inside the nav, and wire
	// Escape to close. The cleanup restores everything and returns focus to the toggle.
	$effect(() => {
		if (!open) return;

		const previouslyFocused = document.activeElement as HTMLElement | null;
		// Lock the page behind the drawer. iOS Safari historically ignores overflow on
		// body alone; hiding it on <html> as well covers the versions that scroll
		// through, without the position:fixed dance that fights SvelteKit's own scroll
		// restoration on navigation. The scrim's touch-action:none catches the rest.
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';

		// Move focus to the first link inside the drawer.
		drawer?.querySelector<HTMLElement>('a[href]')?.focus();

		// The drawer is a sibling of <nav>, not a child, so the trap spans the toggle
		// (which doubles as the close control) plus the drawer's own focusables.
		function getFocusable(): HTMLElement[] {
			const els: HTMLElement[] = [];
			if (toggleButton) els.push(toggleButton);
			if (drawer) {
				els.push(...drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
			}
			return els.filter((el) => el.offsetParent !== null);
		}

		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				open = false;
				return;
			}
			if (event.key !== 'Tab') return;

			const focusable = getFocusable();
			if (focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}

		document.addEventListener('keydown', onKeydown);

		return () => {
			document.documentElement.style.overflow = '';
			document.body.style.overflow = '';
			document.removeEventListener('keydown', onKeydown);
			(previouslyFocused ?? toggleButton)?.focus();
		};
	});
</script>

<svelte:window onkeydown={onWindowKeydown} onpointerdown={onWindowPointerDown} />

<!-- One polite sentence when the display currency changes; silent otherwise. -->
<span class="visually-hidden" role="status" aria-live="polite">{currency.announcement}</span>

<!-- Screen-reader warning appended inside every link that leaves the site in a new
     tab; sighted users get the browser's own new-tab affordance. -->
{#snippet newTabHint(external: boolean)}{#if external}<span class="visually-hidden">
			(opens in new tab)</span
		>{/if}{/snippet}

<!-- The country's flag as a 1px-framed 3:2 stamp — the same emblem the homepage country
     index and the country hero carry, so the menu reads as the same portfolio. Only a
     country earns one (the query sets countrySlug for country references alone); the
     name carries the meaning, so the stamp is decorative. -->
{#snippet stamp(group: SiteNavGroup, cls: string)}
	{#if group.countrySlug}
		<span class={cls} aria-hidden="true">
			<CountryFlagArt slug={group.countrySlug} flagUrl={group.flag} />
		</span>
	{/if}
{/snippet}

{#snippet chevron(size: 'sm' | 'md', isOpen = false)}
	<svg
		class="site-nav__chevron"
		class:is-open={isOpen}
		width={size === 'md' ? 14 : 10}
		height={size === 'md' ? 8 : 6}
		viewBox="0 0 10 6"
		aria-hidden="true"
	>
		<path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{/snippet}

<nav class="site-nav" aria-label="Main" bind:this={navRoot}>
	<a href="/" class="site-nav__logo" aria-label="Golf Homes International home">
		<img src="/design-system/assets/logo-white.svg" alt="" width="140" height="32" />
	</a>

	<ul class="site-nav__menu">
		<!-- Unkeyed (index) each blocks throughout: the menu is CMS-authored, and labels
		     are the only candidate key but are not guaranteed unique — a duplicate would
		     take down the header on every page. The list only ever re-renders wholesale
		     from server data, so index identity is exactly right. -->
		{#each navItems as item, i}
			{@const panel = hasPanel(item)}
			{#if item.children.length}
				<li
					class="site-nav__item site-nav__item--has-menu"
					class:site-nav__item--panel={panel}
					onpointerenter={() => pointerEnterItem(i)}
					onpointerleave={() => pointerLeaveItem(i)}
					onfocusin={() => openDropdown(i)}
					onfocusout={(event) => handleItemFocusOut(event, i)}
				>
					{#if item.href}
						<a
							href={item.href}
							class="site-nav__link"
							class:is-active={itemActive(item)}
							aria-current={isActive(item.href) ? 'page' : undefined}
							target={item.external ? '_blank' : undefined}
							rel={item.external ? 'noopener noreferrer' : undefined}
						>
							{item.label}{@render newTabHint(item.external)}
						</a>
						<button
							type="button"
							class="site-nav__caret"
							class:is-open={openMenu === i}
							aria-label={`${openMenu === i ? 'Hide' : 'Show'} ${item.label} menu`}
							aria-expanded={openMenu === i}
							onclick={() => toggleDropdown(i)}
						>
							{@render chevron('sm')}
						</button>
					{:else}
						<button
							type="button"
							class="site-nav__link site-nav__link--button"
							class:is-active={itemActive(item)}
							aria-haspopup="true"
							aria-expanded={openMenu === i}
							onclick={() => toggleDropdown(i)}
						>
							{item.label}
							{@render chevron('sm', openMenu === i)}
						</button>
					{/if}

					{#if panel}
						<!-- The wide panel: a shelf beneath the bar, one column per group. Every
						     country and its places are visible at once — no second hover step.
						     Columns top-align and never stretch to a common height. -->
						<div class="site-nav__panel" class:is-open={openMenu === i}>
							<div class="site-nav__panel-inner">
								{#each item.children as group, g}
									{@const headId = `site-nav-col-${i}-${g}`}
									<div class="site-nav__column">
										{#if group.href}
											<a
												id={headId}
												href={group.href}
												class="site-nav__column-head"
												class:is-active={groupActive(group)}
												aria-current={isActive(group.href) ? 'page' : undefined}
												target={group.external ? '_blank' : undefined}
												rel={group.external ? 'noopener noreferrer' : undefined}
											>
												{@render stamp(group, 'site-nav__stamp')}
												<span class="site-nav__column-name">{group.label}</span
												>{@render newTabHint(group.external)}
											</a>
										{:else}
											<span
												id={headId}
												class="site-nav__column-head site-nav__column-head--static"
												class:is-active={groupActive(group)}
											>
												{@render stamp(group, 'site-nav__stamp')}
												<span class="site-nav__column-name">{group.label}</span>
											</span>
										{/if}
										{#if group.children.length}
											<ul class="site-nav__column-list" aria-labelledby={headId}>
												{#each group.children as child}
													<li>
														<a
															href={child.href}
															class="site-nav__column-link"
															class:is-active={isActive(child.href)}
															aria-current={isActive(child.href) ? 'page' : undefined}
															target={child.external ? '_blank' : undefined}
															rel={child.external ? 'noopener noreferrer' : undefined}
														>
															{child.label}{@render newTabHint(child.external)}
														</a>
													</li>
												{/each}
											</ul>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<ul class="site-nav__submenu" class:is-open={openMenu === i} aria-label={item.label}>
							{#each item.children as child}
								{#if child.href}
									<li>
										<a
											href={child.href}
											class="site-nav__submenu-link"
											class:is-active={isActive(child.href)}
											aria-current={isActive(child.href) ? 'page' : undefined}
											target={child.external ? '_blank' : undefined}
											rel={child.external ? 'noopener noreferrer' : undefined}
										>
											{child.label}{@render newTabHint(child.external)}
										</a>
									</li>
								{/if}
							{/each}
						</ul>
					{/if}
				</li>
			{:else if item.href}
				<li class="site-nav__item">
					<a
						href={item.href}
						class="site-nav__link"
						class:is-active={isActive(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
						target={item.external ? '_blank' : undefined}
						rel={item.external ? 'noopener noreferrer' : undefined}
					>
						{item.label}{@render newTabHint(item.external)}
					</a>
				</li>
			{/if}
		{/each}
	</ul>

	<!-- The display-currency picker. It sits outside the menu list, and outside the drawer,
	     because it belongs to the prices on the page rather than to the site's structure:
	     it is the one control the visitor may want at any moment, so it stays in the fixed
	     bar at every width instead of hiding inside a scrolling drawer on a phone.

	     The chip's label is one of six spans chosen by the same root attribute that chooses
	     every price (see $lib/styles/currency.css), so the bar and the figures agree from
	     the first frame, before any script runs. -->
	<div
		class="site-nav__ccy"
		bind:this={currencyRoot}
		onfocusout={(event) => handleItemFocusOut(event, CURRENCY_MENU)}
	>
		<button
			bind:this={currencyButton}
			type="button"
			class="site-nav__ccy-trigger"
			class:is-open={currencyOpen}
			aria-label="Display currency"
			aria-haspopup="true"
			aria-expanded={currencyOpen}
			aria-controls="site-nav-currency"
			onclick={toggleCurrencyPicker}
			onkeydown={onCurrencyButtonKeydown}
		>
			<span class="site-nav__ccy-value">
				<span class="site-nav__ccy-label" data-ccy="">As listed</span>
				{#each CURRENCIES as code (code)}
					<span class="site-nav__ccy-label" data-ccy={code}>{code}</span>
				{/each}
			</span>
			{@render chevron('sm', currencyOpen)}
		</button>

		<div
			id="site-nav-currency"
			class="site-nav__ccy-panel"
			class:is-open={currencyOpen}
		>
			<p class="site-nav__ccy-title" id="site-nav-currency-title">Show prices in</p>
			<div
				bind:this={currencyMenu}
				class="site-nav__ccy-grid"
				role="radiogroup"
				aria-labelledby="site-nav-currency-title"
				tabindex={-1}
				onkeydown={onCurrencyMenuKeydown}
			>
				{#each currencyOptions as option (option.label)}
					<button
						type="button"
						role="radio"
						class="site-nav__ccy-cell"
						class:site-nav__ccy-cell--reset={option.code === null}
						class:is-active={currency.chosen === option.code}
						aria-checked={currency.chosen === option.code}
						aria-label={option.name}
						tabindex={currencyOpen && currency.chosen === option.code ? 0 : -1}
						onclick={() => chooseCurrency(option.code)}
					>
						{option.label}
					</button>
				{/each}
			</div>
			<p class="site-nav__ccy-note">{currencyNote}</p>
		</div>
	</div>

	<a
		href={cta.href}
		class="site-nav__cta"
		target={cta.external ? '_blank' : undefined}
		rel={cta.external ? 'noopener noreferrer' : undefined}
	>
		{cta.label}{@render newTabHint(cta.external)}
	</a>

	<button
		bind:this={toggleButton}
		type="button"
		class="site-nav__toggle"
		class:is-open={open}
		aria-label={open ? 'Close menu' : 'Open menu'}
		aria-expanded={open}
		aria-controls="site-nav-drawer"
		onclick={toggleDrawer}
	>
		<span class="site-nav__toggle-bar"></span>
		<span class="site-nav__toggle-bar"></span>
		<span class="site-nav__toggle-bar"></span>
	</button>
</nav>

<div
	class="site-nav__scrim"
	class:is-open={open}
	onclick={() => (open = false)}
	aria-hidden="true"
></div>

<!-- A drawer accordion row: a country (inside a panel item) or a top-level dropdown. The
     link, or a static label when the entry has no page of its own, shares the line with
     the chevron that reveals the sub-list. -->
{#snippet drawerAccordion(
	key: string,
	label: string,
	href: string | null,
	external: boolean,
	active: boolean,
	children: { label: string; href: string; external: boolean }[],
	group: SiteNavGroup | null
)}
	<div class="site-nav__drawer-row">
		{#if href}
			<a
				{href}
				class="site-nav__drawer-link"
				class:site-nav__drawer-link--country={group !== null}
				class:is-active={active}
				aria-current={isActive(href) ? 'page' : undefined}
				target={external ? '_blank' : undefined}
				rel={external ? 'noopener noreferrer' : undefined}
				tabindex={open ? 0 : -1}
			>
				{#if group}{@render stamp(group, 'site-nav__drawer-stamp')}{/if}
				<span>{label}{@render newTabHint(external)}</span>
			</a>
		{:else}
			<span
				class="site-nav__drawer-link site-nav__drawer-link--static"
				class:site-nav__drawer-link--country={group !== null}
				class:is-active={active}
			>
				{#if group}{@render stamp(group, 'site-nav__drawer-stamp')}{/if}
				<span>{label}</span>
			</span>
		{/if}
		<button
			type="button"
			class="site-nav__drawer-accordion"
			class:is-open={expanded === key}
			aria-label={`${expanded === key ? 'Hide' : 'Show'} ${label} submenu`}
			aria-expanded={expanded === key}
			aria-controls={`drawer-submenu-${key.replace('.', '-')}`}
			tabindex={open ? 0 : -1}
			onclick={() => toggleAccordion(key)}
		>
			{@render chevron('md')}
		</button>
	</div>
	<ul
		id={`drawer-submenu-${key.replace('.', '-')}`}
		class="site-nav__drawer-submenu"
		hidden={expanded !== key}
	>
		{#each children as child}
			<li>
				<a
					href={child.href}
					class="site-nav__drawer-sublink"
					class:is-active={isActive(child.href)}
					aria-current={isActive(child.href) ? 'page' : undefined}
					target={child.external ? '_blank' : undefined}
					rel={child.external ? 'noopener noreferrer' : undefined}
					tabindex={open && expanded === key ? 0 : -1}
				>
					{child.label}{@render newTabHint(child.external)}
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

<!-- A navigation landmark, not an aside: at drawer widths this *is* the site menu
     (the bar's own list is display:none), and screen-reader users find menus by
     navigation landmarks. Closed, it is inert and hidden, so the two nav landmarks
     never compete. -->
<nav
	id="site-nav-drawer"
	class="site-nav__drawer"
	class:is-open={open}
	aria-label="Main menu"
	aria-hidden={!open}
	inert={open ? undefined : true}
	bind:this={drawer}
>
	<!-- No brand masthead here: the bar and its logo stay visible above the drawer, so
	     repeating the name inside the panel read as duplication on device. -->
	<ul class="site-nav__drawer-menu">
		{#each navItems as item, i}
			{#if hasPanel(item)}
				<!-- A panel item does not nest two accordions in the drawer. Its label becomes
				     a section overline and each of its groups (countries) is a row of the
				     drawer itself, so the drawer keeps exactly two interactive tiers. -->
				<li class="site-nav__drawer-section">
					{#if item.href}
						<a
							href={item.href}
							class="site-nav__drawer-overline"
							aria-current={isActive(item.href) ? 'page' : undefined}
							target={item.external ? '_blank' : undefined}
							rel={item.external ? 'noopener noreferrer' : undefined}
							tabindex={open ? 0 : -1}
						>
							{item.label}{@render newTabHint(item.external)}
						</a>
					{:else}
						<span class="site-nav__drawer-overline">{item.label}</span>
					{/if}
					<ul class="site-nav__drawer-groups">
						{#each item.children as group, g}
							<li class="site-nav__drawer-item">
								{#if group.children.length}
									{@render drawerAccordion(
										`${i}.${g}`,
										group.label,
										group.href,
										group.external,
										groupActive(group),
										group.children,
										group
									)}
								{:else if group.href}
									<a
										href={group.href}
										class="site-nav__drawer-link site-nav__drawer-link--country"
										class:is-active={isActive(group.href)}
										aria-current={isActive(group.href) ? 'page' : undefined}
										target={group.external ? '_blank' : undefined}
										rel={group.external ? 'noopener noreferrer' : undefined}
										tabindex={open ? 0 : -1}
									>
										{@render stamp(group, 'site-nav__drawer-stamp')}
										<span>{group.label}{@render newTabHint(group.external)}</span>
									</a>
								{/if}
							</li>
						{/each}
					</ul>
				</li>
			{:else if item.children.length}
				<li class="site-nav__drawer-item">
					{@render drawerAccordion(
						`${i}`,
						item.label,
						item.href,
						item.external,
						itemActive(item),
						item.children.filter((group) => group.href !== null) as {
							label: string;
							href: string;
							external: boolean;
						}[],
						null
					)}
				</li>
			{:else if item.href}
				<li class="site-nav__drawer-item">
					<a
						href={item.href}
						class="site-nav__drawer-link"
						class:is-active={isActive(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
						target={item.external ? '_blank' : undefined}
						rel={item.external ? 'noopener noreferrer' : undefined}
						tabindex={open ? 0 : -1}
					>
						<span>{item.label}{@render newTabHint(item.external)}</span>
					</a>
				</li>
			{/if}
		{/each}
	</ul>
	<div class="site-nav__drawer-footer">
		<a
			href={cta.href}
			class="site-nav__drawer-cta"
			target={cta.external ? '_blank' : undefined}
			rel={cta.external ? 'noopener noreferrer' : undefined}
			tabindex={open ? 0 : -1}
		>
			{cta.label}{@render newTabHint(cta.external)}
		</a>
	</div>
</nav>

<style>
	.site-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: var(--nav-height);
		background: var(--green-deep);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		padding: 0 2.5rem;
		z-index: 100;
	}

	.site-nav__logo {
		width: 140px;
		flex-shrink: 0;
		line-height: 0;
	}

	.site-nav__logo img {
		width: 100%;
		height: auto;
	}

	.site-nav__menu {
		display: flex;
		align-items: center;
		gap: 0;
		margin-left: auto;
		list-style: none;
	}

	/* Each item is its own positioning context so a dropdown can anchor beneath it. */
	.site-nav__item {
		position: relative;
		display: flex;
		align-items: center;
		height: var(--nav-height);
	}

	/* A panel item gives up its own context: the wide panel anchors to the bar itself
	   (the fixed <nav> is the nearest positioned ancestor) and spans it edge to edge. */
	.site-nav__item--panel {
		position: static;
	}

	.site-nav__link {
		position: relative;
		font-family: var(--sans);
		font-size: 0.8125rem;
		font-weight: 300;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--on-green);
		/* 1rem, down from 1.15rem: the currency item (Step 3) had to fit without pushing a
		   1280px laptop into the drawer. Seven items × 2 sides × 0.15rem bought ~34px. */
		padding: 0 1rem;
		height: var(--nav-height);
		display: flex;
		align-items: center;
		gap: 0.4rem;
		text-decoration: none;
		white-space: nowrap;
		transition: color var(--duration-hover) var(--ease);
	}

	/* Button-styled parent (a dropdown heading with no link of its own). */
	.site-nav__link--button {
		background: none;
		border: none;
		cursor: pointer;
	}

	/* Gold underline anchored to the base of the bar; revealed for the active page. */
	.site-nav__link::after {
		content: '';
		position: absolute;
		left: 1rem;
		right: 1rem;
		bottom: 0;
		height: 2px;
		background: var(--gold);
		transform: scaleX(0);
		transform-origin: left center;
		transition: transform var(--duration-hover) var(--ease);
	}

	.site-nav__link:hover,
	.site-nav__link:focus-visible {
		color: var(--gold);
	}

	.site-nav__link.is-active {
		color: var(--gold);
	}

	.site-nav__link.is-active::after {
		transform: scaleX(1);
	}

	/* When a parent carries its own link, the caret is a separate, narrow toggle so the
	   link stays clickable and the dropdown stays operable by touch/click. */
	.site-nav__caret {
		display: flex;
		align-items: center;
		justify-content: center;
		height: var(--nav-height);
		padding: 0 0.85rem 0 0;
		margin-left: -0.6rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--on-green);
		transition: color var(--duration-hover) var(--ease);
	}

	.site-nav__caret:hover,
	.site-nav__caret:focus-visible {
		color: var(--gold);
	}

	.site-nav__chevron {
		transition: transform var(--duration-hover) var(--ease);
	}

	.site-nav__caret.is-open .site-nav__chevron,
	.site-nav__chevron.is-open {
		transform: rotate(180deg);
	}

	/* Dropdown panel — anchored to the base of the bar, hidden until its item is open. */
	.site-nav__submenu {
		position: absolute;
		top: 100%;
		left: 0;
		min-width: 13rem;
		list-style: none;
		background: var(--green-deep);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-top: 2px solid var(--gold);
		padding: 0.4rem 0;
		box-shadow: 0 22px 48px rgba(15, 22, 17, 0.4);
		opacity: 0;
		visibility: hidden;
		transform: translateY(-0.5rem);
		pointer-events: none;
		/* Visibility does not fade: it flips to hidden once the fade-out has finished
		   (the delay), and to visible at once on open — an element mid-way through a
		   visibility transition still computes as hidden in its first frame and refuses
		   focus, which broke moving focus into the currency menu from the keyboard. */
		transition:
			opacity var(--duration-hover) var(--ease),
			transform var(--duration-hover) var(--ease),
			visibility 0s linear var(--duration-hover);
		z-index: 1;
	}

	.site-nav__submenu.is-open {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
		pointer-events: auto;
		transition-delay: 0s;
	}

	.site-nav__submenu-link {
		display: block;
		font-family: var(--sans);
		/* Match the top-level link size so children never outweigh their parent;
		   hierarchy comes from the panel, the indent, and the gold active marker. */
		font-size: 0.8125rem;
		font-weight: 400;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--on-green);
		padding: 0.7rem 1.75rem 0.7rem 1.25rem;
		text-decoration: none;
		white-space: nowrap;
		transition:
			color var(--duration-hover) var(--ease),
			background var(--duration-hover) var(--ease);
	}

	/* Hairline between rows keeps the second tier reading as a considered list. */
	.site-nav__submenu li + li .site-nav__submenu-link {
		border-top: 1px solid rgba(255, 255, 255, 0.07);
	}

	.site-nav__submenu-link:hover,
	.site-nav__submenu-link:focus-visible,
	.site-nav__submenu-link.is-active {
		color: var(--gold);
		background: rgba(255, 255, 255, 0.04);
	}

	/* ---- Currency picker ----------------------------------------------------------
	   A control, not a destination. The bar's other items are unframed Light-300 words;
	   this one is a framed chip in Regular 400, set off by a vertical hairline, so the eye
	   reads it as an instrument before it reads the label. The chip keeps the bar's height
	   so its panel hangs from the bar's edge like every other. */
	.site-nav__ccy {
		position: relative;
		display: flex;
		align-items: center;
		height: var(--nav-height);
		margin: 0 1rem 0 0.9rem;
	}

	/* The hairline that separates instrument from menu. */
	.site-nav__ccy::before {
		content: '';
		position: absolute;
		left: -0.9rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1px;
		height: 1.5rem;
		background: rgba(255, 255, 255, 0.16);
	}

	.site-nav__ccy-trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.6rem;
		background: none;
		border: 1px solid rgba(245, 241, 232, 0.3);
		color: var(--on-green);
		font-family: var(--sans);
		font-size: 0.75rem;
		font-weight: 400;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		line-height: 1;
		cursor: pointer;
		transition:
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	/* One fixed slot for the label, so the bar never reflows when the visitor picks a
	   currency and "AS LISTED" gives way to "GBP". The indent optically centres the tracked
	   caps, whose trailing letter-space would otherwise push them left. */
	.site-nav__ccy-value {
		min-width: 4.5rem;
		text-align: center;
		text-indent: 0.12em;
		white-space: nowrap;
	}

	.site-nav__ccy-trigger:hover,
	.site-nav__ccy-trigger:focus-visible,
	.site-nav__ccy-trigger.is-open {
		color: var(--gold);
		border-color: var(--gold);
	}

	.site-nav__ccy-trigger:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}

	/* The panel wears the dropdown's shell — deep green, 2px gold top rule, the same deep
	   shadow — but holds a grid, not a list of rows: six options read at a glance instead of
	   scanning a six-deep column, and a seventh currency costs a cell rather than a row. */
	.site-nav__ccy-panel {
		position: absolute;
		top: 100%;
		right: 0;
		width: 19.5rem;
		max-width: calc(100vw - 2rem);
		background: var(--green-deep);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-top: 2px solid var(--gold);
		box-shadow: 0 22px 48px rgba(15, 22, 17, 0.4);
		padding: 1.15rem 1.25rem 1.1rem;
		opacity: 0;
		visibility: hidden;
		transform: translateY(-0.5rem);
		pointer-events: none;
		/* Visibility flips instantly on open and only after the fade on close: an element
		   mid-transition still computes as hidden and refuses to take focus. */
		transition:
			opacity var(--duration-hover) var(--ease),
			transform var(--duration-hover) var(--ease),
			visibility 0s linear var(--duration-hover);
		z-index: 2;
	}

	.site-nav__ccy-panel.is-open {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
		pointer-events: auto;
		transition-delay: 0s;
	}

	.site-nav__ccy-title {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		line-height: 1;
		text-transform: uppercase;
		color: var(--on-green);
		margin-bottom: 0.9rem;
	}

	.site-nav__ccy-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	/* Neighbours share one hairline: each cell pulls over its left and top neighbour's
	   edge, and the chosen one rises above them all to show its gold frame unbroken. */
	.site-nav__ccy-cell {
		min-height: 2.75rem;
		padding: 0 0.35rem;
		margin: -1px 0 0 -1px;
		background: none;
		border: 1px solid rgba(255, 255, 255, 0.18);
		font-family: var(--sans);
		font-size: 0.8125rem;
		font-weight: 400;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		white-space: nowrap;
		color: var(--on-green);
		cursor: pointer;
		transition:
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.site-nav__ccy-cell:nth-child(3n + 1) {
		margin-left: 0;
	}

	.site-nav__ccy-cell:nth-child(-n + 3) {
		margin-top: 0;
	}

	/* "As listed" is not a currency, and says so in a different voice: Light 300 in
	   sentence case where the codes are Regular 400 tracked caps. */
	.site-nav__ccy-cell--reset {
		font-weight: 300;
		font-size: 0.875rem;
		letter-spacing: 0.02em;
		text-transform: none;
	}

	.site-nav__ccy-cell:hover,
	.site-nav__ccy-cell:focus-visible {
		color: var(--gold);
	}

	/* The focus ring is ivory, not gold, because inside this panel gold already means
	   "this is the one you chose" — two gold frames would say the same thing twice and
	   leave a keyboard user unable to tell where they are from what they picked. */
	.site-nav__ccy-cell:focus-visible {
		outline: 2px solid var(--on-green);
		outline-offset: -3px;
		position: relative;
		z-index: 2;
	}

	/* The chosen cell: gold ink and a gold frame, never a fill — a fill here would read as
	   a second Contact button. */
	.site-nav__ccy-cell.is-active {
		position: relative;
		z-index: 1;
		color: var(--gold);
		border-color: var(--gold);
	}

	/* The one piece of fine print, below a hairline: what the figures are and where the
	   rate came from. */
	.site-nav__ccy-note {
		margin-top: 0.9rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		font-family: var(--sans);
		font-size: var(--text-small);
		font-weight: 300;
		letter-spacing: 0.02em;
		line-height: 1.45;
		text-wrap: pretty;
		color: var(--on-green);
	}

	/* ---- The wide panel ----------------------------------------------------------
	   The bar drops a shelf: same deep green, the dropdown's gold top rule stretched
	   across the viewport, and its deep shadow beneath. Columns sit on the page's own
	   1060px content measure so the panel reads as part of the page, not a floating box. */
	.site-nav__panel {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--green-deep);
		border-top: 2px solid var(--gold);
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 22px 48px rgba(15, 22, 17, 0.4);
		padding: 0 2.5rem;
		opacity: 0;
		visibility: hidden;
		transform: translateY(-0.5rem);
		pointer-events: none;
		transition:
			opacity var(--duration-hover) var(--ease),
			transform var(--duration-hover) var(--ease),
			visibility var(--duration-hover) var(--ease);
		z-index: 1;
	}

	.site-nav__panel.is-open {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
		pointer-events: auto;
	}

	/* One column per country. auto-fit lets four columns breathe across the measure and
	   still seats six on one row; past that the grid wraps to a second row of columns
	   rather than shrinking the type. Rows top-align: a column is as tall as its list. */
	.site-nav__panel-inner {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: 2rem 0 2.25rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
		row-gap: 2.25rem;
		align-items: start;
	}

	/* Vertical hairlines divide the columns; the first sits flush with the content edge. */
	.site-nav__column {
		min-width: 0;
		padding: 0 1.75rem 0 1.5rem;
		border-left: 1px solid rgba(255, 255, 255, 0.08);
	}

	.site-nav__column:first-child {
		padding-left: 0;
		border-left-color: transparent;
	}

	/* Country head: the serif is the desktop dropdown's editorial voice, kept mixed-case
	   so the three tiers read as three voices — Light caps → serif name → Regular caps. */
	.site-nav__column-head {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		font-family: var(--serif);
		font-size: 1.25rem;
		font-weight: 400;
		line-height: 1.15;
		color: var(--on-green);
		text-decoration: none;
		padding-bottom: 0.9rem;
		margin-bottom: 0.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		transition: color var(--duration-hover) var(--ease);
	}

	.site-nav__column-head--static {
		cursor: default;
	}

	a.site-nav__column-head:hover,
	a.site-nav__column-head:focus-visible,
	.site-nav__column-head.is-active {
		color: var(--gold);
	}

	.site-nav__column-name {
		text-wrap: balance;
	}

	/* The flag stamp: a 3:2 emblem in a 1px frame, framed in the ivory ink at low
	   alpha so it holds its edge on green without a bright box. */
	.site-nav__stamp,
	.site-nav__drawer-stamp {
		flex: 0 0 auto;
		display: inline-flex;
		width: 2.25rem;
		height: 1.5rem;
		overflow: hidden;
		border: 1px solid rgba(245, 241, 232, 0.35);
	}

	.site-nav__stamp :global(svg),
	.site-nav__stamp :global(img),
	.site-nav__drawer-stamp :global(svg),
	.site-nav__drawer-stamp :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.site-nav__column-list {
		list-style: none;
	}

	/* Locations: the existing second-tier vocabulary (Regular caps, hairline rows),
	   left to wrap rather than truncate — "San Pedro de Alcantara" keeps its name. */
	.site-nav__column-link {
		display: block;
		font-family: var(--sans);
		font-size: 0.8125rem;
		font-weight: 400;
		letter-spacing: 0.1em;
		line-height: 1.4;
		text-transform: uppercase;
		color: var(--on-green);
		padding: 0.6rem 0;
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.site-nav__column-list li + li .site-nav__column-link {
		border-top: 1px solid rgba(255, 255, 255, 0.07);
	}

	.site-nav__column-link:hover,
	.site-nav__column-link:focus-visible,
	.site-nav__column-link.is-active {
		color: var(--gold);
	}

	/* Contact: the bar's one accent. Gold reads against deep green where a green
	   button would disappear. Separated from the text links so it parses as an action. */
	.site-nav__cta {
		flex: none;
		font-family: var(--sans);
		font-size: 0.8125rem;
		font-weight: 400;
		letter-spacing: 0.14em;
		/* Tracked caps gain a trailing gap after the last letter; nudge the text back
		   so the label sits optically centred in the button. */
		text-indent: 0.14em;
		text-transform: uppercase;
		color: var(--green);
		background: var(--gold);
		border: 1px solid var(--gold);
		padding: 0.62rem 1.5rem;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.site-nav__cta:hover,
	.site-nav__cta:focus-visible {
		background: var(--on-green);
		border-color: var(--on-green);
	}

	/* Hamburger — hidden on desktop, revealed at the mobile breakpoint. */
	.site-nav__toggle {
		display: none;
		margin-left: auto;
		flex: none;
		width: 2.75rem;
		height: 2.75rem;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 5px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.site-nav__toggle-bar {
		display: block;
		width: 22px;
		height: 1.5px;
		background: var(--on-green);
		transition:
			transform var(--duration-hover) var(--ease),
			opacity var(--duration-hover) var(--ease),
			background var(--duration-hover) var(--ease);
	}

	/* The toggle joins the nav's shared interaction vocabulary: gold on hover/focus,
	   like every other control in the bar. */
	.site-nav__toggle:hover .site-nav__toggle-bar,
	.site-nav__toggle:focus-visible .site-nav__toggle-bar {
		background: var(--gold);
	}

	.site-nav__toggle.is-open .site-nav__toggle-bar:nth-child(1) {
		transform: translateY(6.5px) rotate(45deg);
	}

	.site-nav__toggle.is-open .site-nav__toggle-bar:nth-child(2) {
		opacity: 0;
	}

	.site-nav__toggle.is-open .site-nav__toggle-bar:nth-child(3) {
		transform: translateY(-6.5px) rotate(-45deg);
	}

	/* Scrim + drawer sit below the bar (z-index < 100) so the hamburger stays tappable
	   above them. Both are display:none on desktop. */
	.site-nav__scrim {
		display: none;
		position: fixed;
		top: var(--nav-height);
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(15, 22, 17, 0.55);
		opacity: 0;
		pointer-events: none;
		transition: opacity var(--duration-hover) var(--ease);
		z-index: 90;
	}

	.site-nav__scrim.is-open {
		opacity: 1;
		pointer-events: auto;
		/* Swallow scroll gestures that land on the scrim — the second half of the iOS
		   scroll lock (the overflow:hidden on html+body is the first). */
		touch-action: none;
	}

	.site-nav__drawer {
		display: none;
		position: fixed;
		top: var(--nav-height);
		right: 0;
		bottom: 0;
		/* Wide enough to feel like a panel, not a phone pattern stretched onto the
		   tablet sizes this breakpoint also serves. */
		width: min(85vw, 420px);
		background: var(--green-deep);
		/* Gold hairline on the leading edge — the drawer's counterpart to the desktop
		   dropdown's gold top accent — with the same deep shadow so the panel lifts off
		   the scrim instead of floating on its plane. */
		border-left: 1px solid var(--gold);
		box-shadow: -22px 0 48px rgba(15, 22, 17, 0.4);
		flex-direction: column;
		padding: 1.5rem 0 0;
		transform: translateX(100%);
		transition: transform 0.4s var(--ease);
		z-index: 95;
		pointer-events: none;
		/* Off-screen drawer still paints past the viewport edge; clip it closed so
		   iOS cannot rubber-band the page sideways to reveal it. */
		clip-path: inset(0 0 0 100%);
	}

	.site-nav__drawer.is-open {
		transform: translateX(0);
		pointer-events: auto;
		clip-path: none;
	}

	/* The list is the scroll region; the CTA footer below it never scrolls away. */
	.site-nav__drawer-menu {
		list-style: none;
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		/* The list only ever scrolls vertically; a row that fails to fit must wrap or shrink,
		   never open a sideways scroll on a phone. */
		overflow-x: hidden;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: rgba(245, 241, 232, 0.25) transparent;
	}

	/* The countries section: an overline names it, its country rows follow, and a
	   hairline closes it before the editorial items. The overline is set in the same
	   ivory as the rows, well below their size: gold in the drawer means "you are here",
	   so a static label never takes it. */
	.site-nav__drawer-section {
		padding-bottom: 0.75rem;
		margin-bottom: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.site-nav__drawer-overline {
		display: block;
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		line-height: 1;
		text-transform: uppercase;
		color: var(--on-green);
		text-decoration: none;
		padding: 0.25rem 2rem 0.75rem;
		transition: color var(--duration-hover) var(--ease);
	}

	a.site-nav__drawer-overline:hover,
	a.site-nav__drawer-overline:focus-visible {
		color: var(--gold);
	}

	.site-nav__drawer-groups {
		list-style: none;
	}

	/* A parent row: the link (or static label) and the accordion toggle share a line. */
	.site-nav__drawer-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	/* Three voices, as on the desktop shelf. Editorial items (the buying guide, insights,
	   partners, about) speak in the bar's own voice — light tracked caps in warm ivory —
	   at a size that sits clearly below the countries. Rows stay comfortably over 44px. */
	.site-nav__drawer-link {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.85rem;
		flex: 1;
		font-family: var(--sans);
		font-size: 0.9375rem;
		font-weight: 300;
		letter-spacing: 0.12em;
		line-height: 1.3;
		text-transform: uppercase;
		color: var(--on-green);
		text-decoration: none;
		padding: 0.95rem 2rem;
		transition: color var(--duration-hover) var(--ease);
	}

	/* Countries are the destinations, so they take the shelf's country voice: Playfair,
	   mixed case, beside the 1px-framed flag stamp. The serif against the caps is what
	   separates "where we are" from "what we publish" at a glance. */
	.site-nav__drawer-link--country {
		gap: 1rem;
		font-family: var(--serif);
		font-size: 1.375rem;
		font-weight: 400;
		letter-spacing: normal;
		line-height: 1.15;
		text-transform: none;
		padding: 0.9rem 2rem;
	}

	/* A parent with no destination of its own keeps full ink — dimming it read as
	   "disabled" (and fell below AA); the chevron alone signals "expands, doesn't
	   navigate". Hover gold is scoped to real links so the span never pretends. */
	.site-nav__drawer-link--static {
		cursor: default;
	}

	a.site-nav__drawer-link:hover,
	a.site-nav__drawer-link:focus-visible {
		color: var(--gold);
	}

	.site-nav__drawer-link.is-active {
		color: var(--gold);
	}

	/* Gold marker on the leading edge for the active page in the drawer. */
	.site-nav__drawer-link.is-active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.9rem;
		bottom: 0.9rem;
		width: 2px;
		background: var(--gold);
	}

	.site-nav__drawer-accordion {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 3.5rem;
		align-self: stretch;
		background: none;
		border: none;
		border-left: 1px solid rgba(255, 255, 255, 0.08);
		color: var(--on-green);
		cursor: pointer;
	}

	.site-nav__drawer-accordion:hover,
	.site-nav__drawer-accordion:focus-visible {
		color: var(--gold);
	}

	.site-nav__drawer-accordion.is-open .site-nav__chevron {
		transform: rotate(180deg);
	}

	.site-nav__drawer-submenu {
		list-style: none;
		/* Recess tinted with the site's own dark green (#0E1410) rather than black, so
		   the well deepens the hue instead of cooling it toward neutral. */
		background: rgba(14, 20, 16, 0.4);
	}

	/* Children read uppercase / tracked at Regular 400 — the same way the desktop
	   dropdown presents them — recessed and indented beneath their parent. */
	.site-nav__drawer-sublink {
		position: relative;
		display: block;
		font-family: var(--sans);
		/* A real size step below the 1.0625rem parent (was a near-invisible 1px), so
		   the two tiers read as structure, not rendering noise. Rows stay >=44px. */
		font-size: 0.875rem;
		font-weight: 400;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--on-green);
		text-decoration: none;
		padding: 0.95rem 2rem 0.95rem 2.75rem;
		transition: color var(--duration-hover) var(--ease);
	}

	/* Hairline between rows, echoing the desktop dropdown. */
	.site-nav__drawer-submenu li + li .site-nav__drawer-sublink {
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.site-nav__drawer-sublink:hover,
	.site-nav__drawer-sublink:focus-visible,
	.site-nav__drawer-sublink.is-active {
		color: var(--gold);
	}

	/* The drawer's closing gesture: the CTA sits in a pinned footer beneath a hairline,
	   always on screen however long the list or short the viewport. */
	.site-nav__drawer-footer {
		flex-shrink: 0;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		padding: 1.25rem 2rem calc(1.5rem + env(safe-area-inset-bottom, 0px));
	}

	.site-nav__drawer-cta {
		display: block;
		text-align: center;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 400;
		letter-spacing: 0.14em;
		text-indent: 0.14em;
		text-transform: uppercase;
		color: var(--green);
		background: var(--gold);
		border: 1px solid var(--gold);
		padding: 0.95rem 1.6rem;
		text-decoration: none;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.site-nav__drawer-cta:hover,
	.site-nav__drawer-cta:focus-visible {
		background: var(--on-green);
		border-color: var(--on-green);
	}

	/* Same rule UnitsInventory carries: readable by assistive tech, invisible on screen. */
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}

	/* Below 88rem the bar's side padding steps down from 2.5rem to 1.5rem: the 1280px
	   laptop class needs those 32px for the full menu (see the breakpoint note below). */
	@media (max-width: 88rem) {
		.site-nav {
			padding: 0 1.5rem;
		}

		/* The 1280px laptop is the ceiling the drawer breakpoint was set to protect, and
		   the chip is wider than the word it replaced. Trim the word-links and the chip's
		   own margins rather than letting the bar clip or the drawer take a laptop. */
		.site-nav__link {
			padding: 0 0.8rem;
		}

		.site-nav__link::after {
			left: 0.8rem;
			right: 0.8rem;
		}

		.site-nav__ccy {
			margin: 0 0.75rem 0 0.7rem;
		}

		.site-nav__ccy::before {
			left: -0.7rem;
		}
	}

	/* Collapse to the drawer while the full menu still has room. Re-measured 2026-09-10
	   with the currency switcher in the bar and the six-item authored menu (Countries +
	   Front Line Collection, Buying Guides, Partners, Insights, About + Contact), fonts
	   loaded: the list is ~1085px wide, so with the logo and 1.5rem side padding it needs
	   ~1273px. The hamburger takes over up to 1279px (79.9375rem); 1280px itself keeps the
	   full bar, which is the ceiling the Step 3 brief set so a 13-inch laptop never gets
	   the drawer. The earlier 78rem (1248px) figure predates the switcher. */
	@media (max-width: 79.9375rem) {
		.site-nav {
			padding: 0 1.25rem;
		}

		.site-nav__menu,
		.site-nav__cta {
			display: none;
		}

		/* The picker survives the collapse — it is the reason it never lived in the drawer.
		   With the menu gone it takes the free space and leads the hamburger, and its
		   separating hairline has nothing left to separate it from. */
		.site-nav__ccy {
			position: static;
			margin: 0 0.6rem 0 auto;
		}

		/* A phone taps this; the desktop chip's 30px would be a mean target for the older
		   hands PRODUCT.md asks us to design for. It matches the hamburger beside it. */
		.site-nav__ccy-trigger {
			min-height: 2.75rem;
			padding: 0 0.7rem;
		}

		.site-nav__ccy::before {
			display: none;
		}

		/* The chip is no longer the panel's positioning context, so the panel hangs from
		   the bar itself, inset to the bar's own gutter rather than to the chip's edge —
		   a 19.5rem panel anchored to a chip 3rem from the edge would run off a phone. */
		.site-nav__ccy-panel {
			right: 1.25rem;
		}

		.site-nav__toggle {
			display: flex;
			margin-left: 0;
		}

		.site-nav__drawer {
			display: flex;
		}

		.site-nav__scrim {
			display: block;
		}
	}

	/* Narrow phones (≤380px). Logo, chip and hamburger are all fixed-width, so below this
	   the row stops fitting: the gutter tightens and the wordmark steps down, which keeps
	   the chip on one line and the hamburger at its full 44px target. */
	@media (max-width: 23.75rem) {
		.site-nav {
			padding: 0 1rem;
		}

		.site-nav__logo {
			width: 112px;
		}

		.site-nav__ccy {
			margin-right: 0.5rem;
		}

		.site-nav__ccy-trigger {
			padding: 0 0.6rem;
		}

		.site-nav__ccy-value {
			min-width: 4.25rem;
		}

		.site-nav__ccy-panel {
			right: 1rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.site-nav__drawer,
		.site-nav__scrim,
		.site-nav__link::after,
		.site-nav__toggle-bar,
		.site-nav__chevron,
		.site-nav__submenu,
		.site-nav__panel,
		.site-nav__cta,
		.site-nav__drawer-cta,
		.site-nav__drawer-link,
		.site-nav__drawer-sublink,
		.site-nav__caret,
		.site-nav__submenu-link,
		.site-nav__column-head,
		.site-nav__column-link,
		.site-nav__ccy-trigger,
		.site-nav__ccy-panel,
		.site-nav__ccy-cell {
			transition: none;
		}
	}
</style>
