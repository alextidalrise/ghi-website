<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { buildSiteNavItems, isNavItemActive, SITE_NAV_CTA } from '$lib/nav/siteNav';

	const navItems = buildSiteNavItems();

	let open = $state(false);
	let navRoot = $state<HTMLElement>();
	let drawer = $state<HTMLElement>();
	let toggleButton = $state<HTMLButtonElement>();

	function isActive(href: string): boolean {
		return isNavItemActive(href, page.url.pathname);
	}

	// Close the drawer after any navigation (e.g. a link tap inside it). afterNavigate
	// only fires on real route changes, unlike an effect that tracks the pathname.
	afterNavigate(() => {
		open = false;
	});

	// While open: lock body scroll, trap focus inside the nav, and wire Escape to close.
	// The cleanup restores everything and returns focus to the toggle.
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

<nav class="site-nav" aria-label="Main" bind:this={navRoot}>
	<a href="/" class="site-nav__logo" aria-label="Golf Homes International home">
		<img src="/design-system/assets/logo-white.svg" alt="" width="140" height="32" />
	</a>

	<ul class="site-nav__menu">
		{#each navItems as item (item.href)}
			<li>
				<a
					href={item.href}
					class="site-nav__link"
					class:is-active={isActive(item.href)}
					aria-current={isActive(item.href) ? 'page' : undefined}
				>
					{item.label}
				</a>
			</li>
		{/each}
		<li class="site-nav__cta-item">
			<a href={SITE_NAV_CTA.href} class="site-nav__cta">{SITE_NAV_CTA.label}</a>
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
		{#each navItems as item (item.href)}
			<li>
				<a
					href={item.href}
					class="site-nav__drawer-link"
					class:is-active={isActive(item.href)}
					aria-current={isActive(item.href) ? 'page' : undefined}
					tabindex={open ? 0 : -1}
				>
					{item.label}
				</a>
			</li>
		{/each}
	</ul>
	<a href={SITE_NAV_CTA.href} class="site-nav__drawer-cta" tabindex={open ? 0 : -1}>
		{SITE_NAV_CTA.label}
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

	.site-nav__link {
		position: relative;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.8);
		padding: 0 1.25rem;
		height: var(--nav-height);
		display: flex;
		align-items: center;
		text-decoration: none;
		white-space: nowrap;
		transition: color var(--duration-hover) var(--ease);
	}

	/* Gold underline anchored to the base of the bar; revealed for the active page. */
	.site-nav__link::after {
		content: '';
		position: absolute;
		left: 1.25rem;
		right: 1.25rem;
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

	/* Contact: the bar's one accent. Gold reads against deep green where a green
	   button would disappear. Separated from the text links so it parses as an action. */
	.site-nav__cta-item {
		margin-left: 1.25rem;
	}

	.site-nav__cta {
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		background: var(--gold);
		border: 1px solid var(--gold);
		padding: 0.7rem 1.6rem;
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

	.site-nav__drawer-link {
		position: relative;
		display: block;
		font-family: var(--serif);
		font-size: 1.375rem;
		color: var(--on-green);
		text-decoration: none;
		padding: 1rem 2rem;
		transition: color var(--duration-hover) var(--ease);
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
		top: 1rem;
		bottom: 1rem;
		width: 2px;
		background: var(--gold);
	}

	.site-nav__drawer-cta {
		margin: 1.5rem 2rem 0;
		text-align: center;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		background: var(--gold);
		border: 1px solid var(--gold);
		padding: 0.9rem 1.6rem;
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

	@media (max-width: 56rem) {
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
		.site-nav__cta,
		.site-nav__drawer-cta,
		.site-nav__drawer-link {
			transition: none;
		}
	}
</style>
