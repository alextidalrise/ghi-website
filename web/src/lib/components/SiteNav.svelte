<script lang="ts">
	const navItems = [
		{ label: 'Properties', href: '#' },
		{ label: 'Destinations', href: '#' },
		{ label: 'Golf', href: '#' },
		{ label: 'About', href: '#' }
	];
</script>

<nav class="site-nav" aria-label="Main">
	<a href="/" class="site-nav__logo" aria-label="Golf Homes International home">
		<img src="/design-system/assets/logo-white.svg" alt="" width="140" height="32" />
	</a>

	<ul class="site-nav__menu">
		{#each navItems as item (item.label)}
			<li>
				<a href={item.href} class="site-nav__link">{item.label}</a>
			</li>
		{/each}
	</ul>
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

	.site-nav__link {
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

	.site-nav__link:hover,
	.site-nav__link:focus-visible {
		color: var(--gold);
	}

	@media (max-width: 640px) {
		.site-nav {
			padding: 0 1.25rem;
		}

		.site-nav__menu {
			gap: 0;
		}

		.site-nav__link {
			padding: 0 0.75rem;
			font-size: var(--text-small);
		}
	}
</style>
