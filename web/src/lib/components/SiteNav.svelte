<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { buildSiteNav, isNavItemActive, isSiteNavItemActive, type SiteNavItem } from '$lib/nav/siteNav';
	import type { HeaderNav } from '$lib/sanity/queries/headerNav';

	let { nav = null }: { nav?: HeaderNav | null } = $props();

	const site = $derived(buildSiteNav(nav));
	const navItems = $derived(site.items);
	const cta = $derived(site.cta);

	let open = $state(false); // mobile drawer
	let openMenu = $state<number | null>(null); // desktop dropdown index, if any
	let expanded = $state<number | null>(null); // mobile accordion index, if any
	let navRoot = $state<HTMLElement>();
	let drawer = $state<HTMLElement>();
	let toggleButton = $state<HTMLButtonElement>();

	function isActive(href: string | null): boolean {
		return isNavItemActive(href, page.url.pathname);
	}

	function itemActive(item: SiteNavItem): boolean {
		return isSiteNavItemActive(item, page.url.pathname);
	}

	function openDropdown(i: number) {
		openMenu = i;
	}

	function closeDropdown(i: number) {
		if (openMenu === i) openMenu = null;
	}

	function toggleDropdown(i: number) {
		openMenu = openMenu === i ? null : i;
	}

	// Close a desktop dropdown once focus leaves its item entirely (keyboard users tabbing
	// past the last sub-link). relatedTarget is the element focus is moving to.
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
		open = false;
		openMenu = null;
		expanded = null;
	});

	// While the drawer is open: lock body scroll, trap focus inside the nav, and wire
	// Escape to close. The cleanup restores everything and returns focus to the toggle.
	$effect(() => {
		if (!open) return;

		const previouslyFocused = document.activeElement as HTMLElement | null;
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
			document.body.style.overflow = '';
			document.removeEventListener('keydown', onKeydown);
			(previouslyFocused ?? toggleButton)?.focus();
		};
	});
</script>

<svelte:window onkeydown={onWindowKeydown} />

<nav class="site-nav" aria-label="Main" bind:this={navRoot}>
	<a href="/" class="site-nav__logo" aria-label="Golf Homes International home">
		<img src="/design-system/assets/logo-white.svg" alt="" width="140" height="32" />
	</a>

	<ul class="site-nav__menu">
		{#each navItems as item, i (item.label)}
			{#if item.children.length}
				<li
					class="site-nav__item site-nav__item--has-menu"
					onpointerenter={() => openDropdown(i)}
					onpointerleave={() => closeDropdown(i)}
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
							{item.label}
						</a>
						<button
							type="button"
							class="site-nav__caret"
							class:is-open={openMenu === i}
							aria-label={`${openMenu === i ? 'Hide' : 'Show'} ${item.label} menu`}
							aria-expanded={openMenu === i}
							onclick={() => toggleDropdown(i)}
						>
							<svg class="site-nav__chevron" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
								<path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
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
							<svg class="site-nav__chevron" class:is-open={openMenu === i} width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
								<path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</button>
					{/if}

					<ul class="site-nav__submenu" class:is-open={openMenu === i} aria-label={item.label}>
						{#each item.children as child (child.label)}
							<li>
								<a
									href={child.href}
									class="site-nav__submenu-link"
									class:is-active={isActive(child.href)}
									aria-current={isActive(child.href) ? 'page' : undefined}
									target={child.external ? '_blank' : undefined}
									rel={child.external ? 'noopener noreferrer' : undefined}
								>
									{child.label}
								</a>
							</li>
						{/each}
					</ul>
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
						{item.label}
					</a>
				</li>
			{/if}
		{/each}
		<li class="site-nav__cta-item">
			<a
				href={cta.href}
				class="site-nav__cta"
				target={cta.external ? '_blank' : undefined}
				rel={cta.external ? 'noopener noreferrer' : undefined}
			>
				{cta.label}
			</a>
		</li>
	</ul>

	<button
		bind:this={toggleButton}
		type="button"
		class="site-nav__toggle"
		class:is-open={open}
		aria-label={open ? 'Close menu' : 'Open menu'}
		aria-expanded={open}
		aria-controls="site-nav-drawer"
		onclick={() => (open = !open)}
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

<aside
	id="site-nav-drawer"
	class="site-nav__drawer"
	class:is-open={open}
	aria-label="Main"
	aria-hidden={!open}
	inert={open ? undefined : true}
	bind:this={drawer}
>
	<ul class="site-nav__drawer-menu">
		{#each navItems as item, i (item.label)}
			<li class="site-nav__drawer-item">
				{#if item.children.length}
					<div class="site-nav__drawer-row">
						{#if item.href}
							<a
								href={item.href}
								class="site-nav__drawer-link"
								class:is-active={isActive(item.href)}
								aria-current={isActive(item.href) ? 'page' : undefined}
								target={item.external ? '_blank' : undefined}
								rel={item.external ? 'noopener noreferrer' : undefined}
								tabindex={open ? 0 : -1}
							>
								{item.label}
							</a>
						{:else}
							<span class="site-nav__drawer-link site-nav__drawer-link--static">{item.label}</span>
						{/if}
						<button
							type="button"
							class="site-nav__drawer-accordion"
							class:is-open={expanded === i}
							aria-label={`${expanded === i ? 'Hide' : 'Show'} ${item.label} submenu`}
							aria-expanded={expanded === i}
							aria-controls={`drawer-submenu-${i}`}
							tabindex={open ? 0 : -1}
							onclick={() => (expanded = expanded === i ? null : i)}
						>
							<svg class="site-nav__chevron" width="14" height="8" viewBox="0 0 10 6" aria-hidden="true">
								<path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</button>
					</div>
					<ul id={`drawer-submenu-${i}`} class="site-nav__drawer-submenu" hidden={expanded !== i}>
						{#each item.children as child (child.label)}
							<li>
								<a
									href={child.href}
									class="site-nav__drawer-sublink"
									class:is-active={isActive(child.href)}
									aria-current={isActive(child.href) ? 'page' : undefined}
									target={child.external ? '_blank' : undefined}
									rel={child.external ? 'noopener noreferrer' : undefined}
									tabindex={open && expanded === i ? 0 : -1}
								>
									{child.label}
								</a>
							</li>
						{/each}
					</ul>
				{:else if item.href}
					<a
						href={item.href}
						class="site-nav__drawer-link"
						class:is-active={isActive(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
						target={item.external ? '_blank' : undefined}
						rel={item.external ? 'noopener noreferrer' : undefined}
						tabindex={open ? 0 : -1}
					>
						{item.label}
					</a>
				{/if}
			</li>
		{/each}
	</ul>
	<a
		href={cta.href}
		class="site-nav__drawer-cta"
		target={cta.external ? '_blank' : undefined}
		rel={cta.external ? 'noopener noreferrer' : undefined}
		tabindex={open ? 0 : -1}
	>
		{cta.label}
	</a>
</aside>

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

	.site-nav__link {
		position: relative;
		font-family: var(--sans);
		font-size: 0.8125rem;
		font-weight: 300;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--on-green);
		padding: 0 1.15rem;
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
		left: 1.15rem;
		right: 1.15rem;
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
		transition:
			opacity var(--duration-hover) var(--ease),
			transform var(--duration-hover) var(--ease),
			visibility var(--duration-hover) var(--ease);
		z-index: 1;
	}

	.site-nav__submenu.is-open {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
		pointer-events: auto;
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

	/* Contact: the bar's one accent. Gold reads against deep green where a green
	   button would disappear. Separated from the text links so it parses as an action. */
	.site-nav__cta-item {
		display: flex;
		align-items: center;
		margin-left: 1.25rem;
	}

	.site-nav__cta {
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
			opacity var(--duration-hover) var(--ease);
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
	}

	.site-nav__drawer {
		display: none;
		position: fixed;
		top: var(--nav-height);
		right: 0;
		bottom: 0;
		width: min(80vw, 360px);
		background: var(--green-deep);
		border-left: 1px solid rgba(255, 255, 255, 0.1);
		flex-direction: column;
		padding: 1.5rem 0 2rem;
		transform: translateX(100%);
		transition: transform 0.4s var(--ease);
		z-index: 95;
		overflow-y: auto;
		overscroll-behavior: contain;
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

	.site-nav__drawer-menu {
		list-style: none;
		display: flex;
		flex-direction: column;
	}

	/* A parent row: the link (or static label) and the accordion toggle share a line. */
	.site-nav__drawer-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	/* Same vocabulary as the desktop bar — light tracked caps in warm ivory — just
	   sized up for the vertical, touch-first drawer. The Playfair wordmark at the top
	   keeps the serif present; the menu items stay sans, matching desktop. */
	.site-nav__drawer-link {
		position: relative;
		display: block;
		flex: 1;
		font-family: var(--sans);
		font-size: 1rem;
		font-weight: 300;
		letter-spacing: 0.11em;
		line-height: 1.3;
		text-transform: uppercase;
		color: var(--on-green);
		text-decoration: none;
		padding: 1.05rem 2rem;
		transition: color var(--duration-hover) var(--ease);
	}

	.site-nav__drawer-link--static {
		color: rgba(245, 241, 232, 0.55);
	}

	.site-nav__drawer-link:hover,
	.site-nav__drawer-link:focus-visible {
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
		top: 1.05rem;
		bottom: 1.05rem;
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
		background: rgba(0, 0, 0, 0.18);
	}

	/* Children read uppercase / tracked at Regular 400 — the same way the desktop
	   dropdown presents them — recessed and indented beneath their parent. */
	.site-nav__drawer-sublink {
		position: relative;
		display: block;
		font-family: var(--sans);
		font-size: 0.9375rem;
		font-weight: 400;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--on-green);
		text-decoration: none;
		padding: 0.9rem 2rem 0.9rem 2.75rem;
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

	.site-nav__drawer-cta {
		margin: 1.75rem 2rem 0;
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

	/* Collapse to the drawer while the full menu still has room. The airier nav type
	   needs ~1140px to lay out without clipping, so the hamburger takes over below 72rem
	   rather than letting the links crowd the Contact action off the bar. */
	@media (max-width: 72rem) {
		.site-nav {
			padding: 0 1.25rem;
		}

		.site-nav__menu {
			display: none;
		}

		.site-nav__toggle {
			display: flex;
		}

		.site-nav__scrim,
		.site-nav__drawer {
			display: flex;
		}

		.site-nav__scrim {
			display: block;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.site-nav__drawer,
		.site-nav__scrim,
		.site-nav__link::after,
		.site-nav__toggle-bar,
		.site-nav__chevron,
		.site-nav__submenu,
		.site-nav__cta,
		.site-nav__drawer-cta,
		.site-nav__drawer-link,
		.site-nav__submenu-link {
			transition: none;
		}
	}
</style>
