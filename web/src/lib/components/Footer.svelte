<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { buildFooter, footerCountries, type FooterCountry } from '$lib/footer/footerContent';
	import { buildSiteNav, isNavItemActive } from '$lib/nav/siteNav';
	import { getConsent } from '$lib/analytics';
	import type { FooterContent, FooterSocialPlatform, HeaderNav } from '$lib/sanity/queries';

	type Props = {
		footer: FooterContent | null;
		nav: HeaderNav | null;
	};

	let { footer, nav }: Props = $props();

	// The footer's words, Explore links, legal and socials are authored in Sanity (with
	// built-in defaults). Its geography is not: the country index is read from the header
	// nav, so a country added to the header's Countries item appears here too.
	const content = $derived(buildFooter(footer, footerCountries(buildSiteNav(nav))));

	const isActive = (href: string | null) => isNavItemActive(href, page.url.pathname);
	const isCurrent = (href: string | null) => href?.split('?')[0] === page.url.pathname;
	const countryActive = (country: FooterCountry) =>
		isActive(country.href) || country.locations.some((place) => isActive(place.href));

	// Below 56rem each country folds to one row with a toggle, as in the drawer. Folding
	// waits for hydration: without JS every location stays listed, which is also what
	// crawlers read, since the links are in the HTML either way. The country holding the
	// current page arrives unfolded, so "where am I" is never tucked away.
	let enhanced = $state(false);
	let unfolded = $state<Record<number, boolean>>({});
	onMount(() => {
		enhanced = true;
	});
	const isUnfolded = (i: number, country: FooterCountry) => unfolded[i] ?? countryActive(country);
	function toggle(i: number, country: FooterCountry) {
		unfolded[i] = !isUnfolded(i, country);
	}

	const SOCIAL_LABELS: Record<FooterSocialPlatform, string> = {
		instagram: 'Instagram',
		facebook: 'Facebook',
		linkedin: 'LinkedIn',
		youtube: 'YouTube',
		x: 'X'
	};

	const year = new Date().getFullYear();

	// Cookie settings is a button, not a legal link. The legal list is overridable from
	// Sanity, so a data entry there cannot call openPreferences() — and a magic href the
	// footer intercepts would break silently the first time an editor reorders the list.
	const consent = getConsent();

	type Status = 'idle' | 'submitting' | 'success' | 'error';
	let email = $state('');
	let status = $state<Status>('idle');
	let message = $state('');

	async function subscribe(event: SubmitEvent) {
		event.preventDefault();
		if (status === 'submitting') return;

		status = 'submitting';
		message = '';

		try {
			const response = await fetch('/api/newsletter', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email })
			});
			const result = await response.json().catch(() => ({}));

			if (response.ok) {
				status = 'success';
				message = 'Thank you. We will be in touch occasionally, never often.';
				email = '';
			} else {
				status = 'error';
				message = result.error ?? 'Please enter a valid email address.';
			}
		} catch {
			status = 'error';
			message = 'We could not reach the server. Please try again shortly.';
		}
	}
</script>

{#snippet socialIcon(platform: FooterSocialPlatform)}
	<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
		{#if platform === 'instagram'}
			<rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" stroke-width="1.6" />
			<circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6" />
			<circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
		{:else if platform === 'facebook'}
			<path fill="currentColor" d="M13.5 21v-7h2.3l.4-2.7h-2.7V9.5c0-.8.2-1.3 1.4-1.3h1.5V5.8c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8v2.7h2.5V21h3z" />
		{:else if platform === 'linkedin'}
			<path fill="currentColor" d="M6.94 8.5H4.3V20h2.64V8.5zM5.62 4a1.53 1.53 0 100 3.06 1.53 1.53 0 000-3.06zM20 20h-2.64v-6.2c0-1.48-.53-2.49-1.85-2.49-1.01 0-1.61.68-1.88 1.34-.1.24-.12.57-.12.9V20H11.5s.04-10.5 0-11.5h2.6v1.63c.35-.54.98-1.31 2.39-1.31 1.74 0 3.04 1.14 3.04 3.6V20z" />
		{:else if platform === 'youtube'}
			<path fill="currentColor" d="M21.6 8.2a2.5 2.5 0 00-1.76-1.76C18.27 6 12 6 12 6s-6.27 0-7.84.44A2.5 2.5 0 002.4 8.2 26 26 0 002 12a26 26 0 00.4 3.8 2.5 2.5 0 001.76 1.76C5.73 18 12 18 12 18s6.27 0 7.84-.44a2.5 2.5 0 001.76-1.76A26 26 0 0022 12a26 26 0 00-.4-3.8zM10 14.6V9.4l4.5 2.6-4.5 2.6z" />
		{:else if platform === 'x'}
			<path fill="currentColor" d="M17.5 4h2.6l-5.7 6.5L21 20h-5.3l-4.1-5.4L6.8 20H4.2l6.1-7L4 4h5.4l3.7 4.9L17.5 4zm-.9 14.4h1.4L8.5 5.5H7l9.6 12.9z" />
		{/if}
	</svg>
{/snippet}

<footer class="footer on-dark" class:is-enhanced={enhanced}>
	<div class="footer__inner content-wrap">
		<!-- Tier 1: brand + invitation -->
		<div class="footer__masthead">
			<div class="footer__brand">
				<a href="/" class="footer__wordmark" aria-label="Golf Homes International home">
					<img
						src="/design-system/assets/logo-white.svg"
						alt="Golf Homes International"
						width="180"
						height="66"
					/>
				</a>
				<p class="footer__statement">{content.brandStatement}</p>
			</div>

			<div class="footer__invite">
				<p class="footer__invite-lead">{content.inviteLead}</p>
				<a
					href={content.invite.href}
					class="footer__invite-cta"
					target={content.invite.external ? '_blank' : undefined}
					rel={content.invite.external ? 'noopener noreferrer' : undefined}
				>
					{content.invite.label}
					<span class="footer__arrow" aria-hidden="true">&rarr;</span>
				</a>
			</div>
		</div>

		<!-- Tier 2: the country index beside the editorial links and the newsletter. One
		     row per country, so a new market adds a short row, never a column. -->
		<div class="footer__index">
			{#if content.countries.length}
				<nav class="footer__countries" aria-labelledby="footer-countries-heading">
					<h2 class="footer__heading" id="footer-countries-heading">Countries</h2>
					<!-- Unkeyed: the rows come from CMS labels, which are not guaranteed unique. -->
					<ul class="footer__country-list">
						{#each content.countries as country, i}
							{@const open = isUnfolded(i, country)}
							<li class="footer__country">
								<div class="footer__country-head">
									{#if country.href}
										<a
											class="footer__country-name"
											class:is-active={countryActive(country)}
											href={country.href}
											aria-current={isCurrent(country.href) ? 'page' : undefined}
											target={country.external ? '_blank' : undefined}
											rel={country.external ? 'noopener noreferrer' : undefined}
										>
											{country.name}
											<span class="footer__arrow" aria-hidden="true">&rarr;</span>
										</a>
									{:else}
										<span class="footer__country-name" class:is-active={countryActive(country)}>
											{country.name}
										</span>
									{/if}
									{#if country.locations.length}
										<button
											type="button"
											class="footer__fold"
											class:is-open={open}
											aria-expanded={open}
											aria-controls={`footer-places-${i}`}
											aria-label={`${open ? 'Hide' : 'Show'} locations in ${country.name}`}
											onclick={() => toggle(i, country)}
										>
											<span class="footer__fold-count" aria-hidden="true">
												{country.locations.length}
											</span>
											<svg class="footer__chevron" width="14" height="8" viewBox="0 0 10 6" aria-hidden="true">
												<path
													d="M1 1l4 4 4-4"
													fill="none"
													stroke="currentColor"
													stroke-width="1.5"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
										</button>
									{/if}
								</div>
								{#if country.locations.length}
									<ul id={`footer-places-${i}`} class="footer__places" class:is-folded={!open}>
										{#each country.locations as place}
											<li class="footer__place">
												<a
													class="footer__link"
													class:is-active={isActive(place.href)}
													href={place.href}
													aria-current={isCurrent(place.href) ? 'page' : undefined}
													target={place.external ? '_blank' : undefined}
													rel={place.external ? 'noopener noreferrer' : undefined}
												>
													{place.label}
												</a>
											</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				</nav>
			{/if}

			<div class="footer__aside">
				{#each content.columns as column}
					<nav class="footer__col" aria-label={column.heading}>
						<h2 class="footer__heading">{column.heading}</h2>
						<ul class="footer__list">
							{#each column.links as link}
								<li>
									<a
										class="footer__link"
										href={link.href}
										target={link.external ? '_blank' : undefined}
										rel={link.external ? 'noopener noreferrer' : undefined}
									>
										{link.label}
									</a>
								</li>
							{/each}
							{#if column.highlight}
								<li>
									<a
										class="footer__link footer__link--all"
										href={column.highlight.href}
										target={column.highlight.external ? '_blank' : undefined}
										rel={column.highlight.external ? 'noopener noreferrer' : undefined}
									>
										{column.highlight.label}
										<span class="footer__arrow" aria-hidden="true">&rarr;</span>
									</a>
								</li>
							{/if}
						</ul>
					</nav>
				{/each}

				<!-- Newsletter — its own block, so the number of columns never moves it -->
				<div class="footer__signup">
					<h2 class="footer__heading">Stay in touch</h2>
					{#if status === 'success'}
						<p class="footer__signup-success" role="status">{message}</p>
					{:else}
						<p class="footer__signup-lead">
							Occasional notes on new listings and the markets we cover. A few times a year, no more.
						</p>
						<form class="footer__signup-form" onsubmit={subscribe} novalidate>
							<label class="footer__signup-label" for="footer-email">Email address</label>
							<div class="footer__signup-row">
								<input
									id="footer-email"
									class="footer__signup-input"
									type="email"
									name="email"
									placeholder="you@example.com"
									autocomplete="email"
									bind:value={email}
									disabled={status === 'submitting'}
									aria-describedby="footer-signup-msg"
								/>
								<button class="footer__signup-button" type="submit" disabled={status === 'submitting'}>
									{status === 'submitting' ? 'Sending' : 'Subscribe'}
								</button>
							</div>
							<p
								id="footer-signup-msg"
								class="footer__signup-error"
								class:is-visible={status === 'error'}
								role="alert"
							>
								{status === 'error' ? message : ''}
							</p>
						</form>
					{/if}
				</div>
			</div>
		</div>

		<!-- Tier 3: legal + social -->
		<div class="footer__baseline">
			<p class="footer__copyright">© {year} Golf Homes International. All rights reserved.</p>
			<div class="footer__baseline-right">
				{#if content.legalLinks.length}
					<ul class="footer__legal">
						{#each content.legalLinks as link (link.href)}
							<li>
								<a
									class="footer__link"
									href={link.href}
									target={link.external ? '_blank' : undefined}
									rel={link.external ? 'noopener noreferrer' : undefined}
								>
									{link.label}
								</a>
							</li>
						{/each}
						<li>
							<button type="button" class="footer__link footer__cookie" onclick={() => consent.openPreferences()}>
								Cookie settings
							</button>
						</li>
					</ul>
				{:else}
					<ul class="footer__legal">
						<li>
							<button type="button" class="footer__link footer__cookie" onclick={() => consent.openPreferences()}>
								Cookie settings
							</button>
						</li>
					</ul>
				{/if}
				{#if content.socials.length}
					<div class="footer__socials">
						{#each content.socials as social (social.platform)}
							<a
								class="footer__social"
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`Golf Homes International on ${SOCIAL_LABELS[social.platform]}`}
							>
								{@render socialIcon(social.platform)}
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: var(--green);
		color: var(--on-green);
	}

	.footer__inner {
		padding-block: var(--space-2xl);
	}

	/* Tier 1 — brand left, invitation right; stacks under the columns breakpoint. */
	.footer__masthead {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-lg) var(--space-2xl);
		padding-bottom: var(--space-xl);
		border-bottom: 1px solid rgba(245, 241, 232, 0.14);
	}

	.footer__wordmark {
		display: inline-block;
		width: 180px;
		max-width: 60%;
		line-height: 0;
		transition: opacity var(--duration-hover) var(--ease);
	}

	.footer__wordmark img {
		width: 100%;
		height: auto;
	}

	.footer__wordmark:hover,
	.footer__wordmark:focus-visible {
		opacity: 0.82;
	}

	.footer__statement {
		max-width: 34ch;
		margin-top: var(--space-sm);
		font-size: var(--text-ui);
		font-weight: 350;
		line-height: 1.8;
		letter-spacing: 0.01em;
		color: rgba(245, 241, 232, 0.78);
	}

	.footer__invite {
		text-align: right;
	}

	.footer__invite-lead {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h4);
		color: var(--on-green);
	}

	.footer__invite-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--gold);
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.footer__invite-cta:hover,
	.footer__invite-cta:focus-visible {
		color: var(--on-green);
	}

	.footer__arrow {
		display: inline-block;
		transition: transform var(--duration-hover) var(--ease);
	}

	.footer__invite-cta:hover .footer__arrow,
	.footer__link--all:hover .footer__arrow,
	.footer__invite-cta:focus-visible .footer__arrow,
	.footer__link--all:focus-visible .footer__arrow {
		transform: translateX(3px);
	}

	/* Tier 2 — the country index takes two thirds, the editorial links and the
	   newsletter stack in the last third. The index grows by one row per market, so the
	   two sides come level at around six or seven countries rather than the index
	   running away with the page. */
	.footer__index {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
		gap: var(--space-xl) var(--space-2xl);
		padding-block: var(--space-xl);
	}

	.footer__aside {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	/* One row per country: the name in the shelf's serif voice on the left, its places
	   running inline on the right, hairlines between rows. */
	.footer__country-list {
		list-style: none;
		border-top: 1px solid rgba(245, 241, 232, 0.14);
	}

	.footer__country {
		display: grid;
		grid-template-columns: 10rem minmax(0, 1fr);
		column-gap: var(--space-lg);
		align-items: baseline;
		padding-block: 1.15rem;
		border-bottom: 1px solid rgba(245, 241, 232, 0.14);
	}

	.footer__country-head {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.footer__country-name {
		display: inline-flex;
		align-items: baseline;
		gap: 0.5rem;
		font-family: var(--serif);
		font-size: 1.25rem;
		font-weight: 400;
		line-height: 1.2;
		color: var(--on-green);
		text-decoration: none;
		text-wrap: balance;
		transition: color var(--duration-hover) var(--ease);
	}

	.footer__country-name .footer__arrow {
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: rgba(245, 241, 232, 0.6);
		transition:
			color var(--duration-hover) var(--ease),
			transform var(--duration-hover) var(--ease);
	}

	a.footer__country-name:hover,
	a.footer__country-name:focus-visible,
	.footer__country-name.is-active,
	.footer__country-name.is-active .footer__arrow,
	a.footer__country-name:hover .footer__arrow,
	a.footer__country-name:focus-visible .footer__arrow {
		color: var(--gold);
	}

	a.footer__country-name:hover .footer__arrow,
	a.footer__country-name:focus-visible .footer__arrow {
		transform: translateX(3px);
	}

	/* The fold toggle exists for phones only, and only once the page has hydrated. */
	.footer__fold {
		display: none;
	}

	/* Places run inline and wrap, parted by gold dots. Each dot sits in its item's
	   leading padding; the list is pulled left by that padding and clipped there, so
	   a dot that would open a wrapped line is cut away rather than hanging at the
	   margin. The clip stops 4px short of each link, leaving focus rings whole. */
	.footer__places {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		row-gap: 0.35rem;
		margin-left: -1.25rem;
		clip-path: inset(-0.5rem -0.5rem -0.5rem calc(1.25rem - 4px));
	}

	.footer__place {
		position: relative;
		padding-left: 1.25rem;
	}

	.footer__place::before {
		content: '';
		position: absolute;
		left: 0.475rem;
		top: 50%;
		width: 3px;
		height: 3px;
		margin-top: -1px;
		background: var(--gold);
		opacity: 0.7;
	}

	.footer__place .footer__link {
		white-space: nowrap;
	}

	/* Gold ink alone sits too close in value to the ivory links around it, so the page
	   you are on also takes a gold hairline underline. */
	.footer__link.is-active {
		color: var(--gold);
		text-decoration: underline;
		text-decoration-color: var(--gold);
		text-decoration-thickness: 1px;
		text-underline-offset: 0.3em;
	}

	.footer__link:focus-visible,
	.footer__country-name:focus-visible,
	.footer__fold:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}

	.footer__heading {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--gold);
		margin-bottom: var(--space-md);
	}

	.footer__countries .footer__heading {
		margin-bottom: var(--space-sm);
	}

	.footer__list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.footer__link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: var(--text-ui);
		font-weight: 400;
		line-height: 1.4;
		color: rgba(245, 241, 232, 0.82);
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.footer__link:hover,
	.footer__link:focus-visible {
		color: var(--gold);
	}

	.footer__link--all {
		color: var(--on-green);
	}

	/* Newsletter — bottom-border input + gold submit, the brand's form idiom on green. */
	.footer__signup-lead {
		max-width: 38ch;
		font-size: var(--text-ui);
		font-weight: 350;
		line-height: 1.8;
		letter-spacing: 0.01em;
		color: rgba(245, 241, 232, 0.78);
		margin-bottom: var(--space-md);
	}

	.footer__signup-label {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* In the narrow desktop column the button drops beneath the field rather than
	   squeezing it: an address has to fit where it is typed. */
	.footer__signup-row {
		display: flex;
		flex-wrap: wrap;
		align-items: stretch;
		gap: var(--space-sm);
		max-width: 26rem;
	}

	.footer__signup-input {
		flex: 1 1 10rem;
		min-width: 0;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(245, 241, 232, 0.3);
		padding: 0.75rem 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--on-green);
		transition: border-color var(--duration-hover) var(--ease);
	}

	.footer__signup-input::placeholder {
		color: rgba(245, 241, 232, 0.6);
	}

	.footer__signup-input:focus {
		outline: none;
		border-bottom-color: var(--gold);
	}

	.footer__signup-input:disabled {
		opacity: 0.6;
	}

	.footer__signup-button {
		flex-shrink: 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		background: var(--gold);
		border: 1px solid var(--gold);
		padding: 0.7rem 1.5rem;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.footer__signup-button:hover:not(:disabled),
	.footer__signup-button:focus-visible:not(:disabled) {
		background: var(--on-green);
		border-color: var(--on-green);
	}

	.footer__signup-button:disabled {
		cursor: default;
		opacity: 0.7;
	}

	.footer__signup-error {
		min-height: 1.25rem;
		margin-top: 0.5rem;
		font-size: var(--text-small);
		color: rgba(245, 241, 232, 0.6);
		opacity: 0;
		transition: opacity var(--duration-hover) var(--ease);
	}

	.footer__signup-error.is-visible {
		opacity: 1;
		color: #e9b9a3; /* warm, not alarming — reads on green, well above 4.5:1 */
	}

	.footer__signup-success {
		max-width: 38ch;
		font-size: var(--text-ui);
		font-weight: 350;
		line-height: 1.8;
		letter-spacing: 0.01em;
		color: var(--on-green);
	}

	/* Tier 3 — baseline */
	.footer__baseline {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-md) var(--space-lg);
		padding-top: var(--space-lg);
		border-top: 1px solid rgba(245, 241, 232, 0.14);
	}

	.footer__copyright {
		font-size: var(--text-small);
		color: rgba(245, 241, 232, 0.6);
	}

	.footer__baseline-right {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
	}

	.footer__legal {
		list-style: none;
		display: flex;
		gap: var(--space-md);
	}

	.footer__legal .footer__link {
		font-size: var(--text-small);
	}

	/* Reset the button back to the link vocabulary it sits in: visually it is the third
	   legal link, it just happens to open a dialog rather than navigate. */
	.footer__cookie {
		padding: 0;
		background: none;
		border: 0;
		font-family: inherit;
		cursor: pointer;
	}

	.footer__cookie:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.footer__socials {
		display: inline-flex;
		align-items: center;
		gap: var(--space-md);
	}

	.footer__social {
		display: inline-flex;
		color: rgba(245, 241, 232, 0.82);
		transition: color var(--duration-hover) var(--ease);
	}

	.footer__social:hover,
	.footer__social:focus-visible {
		color: var(--gold);
	}

	@media (max-width: 56rem) {
		.footer__masthead {
			flex-direction: column;
		}

		.footer__invite {
			text-align: left;
		}

		.footer__index {
			grid-template-columns: minmax(0, 1fr);
		}

		/* Six short editorial links take two columns rather than a tall single one. */
		.footer__list {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0 var(--space-md);
		}

		.footer__list .footer__link {
			padding-block: 0.6rem;
		}

		/* The row becomes the drawer's: the name links to the country, a hairline-parted
		   toggle on the right shows its places as a plain list beneath. */
		.footer__country {
			grid-template-columns: minmax(0, 1fr);
			padding-block: 0;
		}

		.footer__country-name {
			flex: 1;
			padding-block: 0.8rem;
		}

		.footer.is-enhanced .footer__fold {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.6rem;
			flex-shrink: 0;
			align-self: stretch;
			min-width: 4.25rem;
			min-height: 2.75rem;
			padding: 0 0 0 var(--space-sm);
			background: none;
			border: none;
			border-left: 1px solid rgba(245, 241, 232, 0.14);
			font-family: var(--sans);
			font-size: var(--text-small);
			font-feature-settings: 'tnum';
			color: rgba(245, 241, 232, 0.72);
			cursor: pointer;
			transition: color var(--duration-hover) var(--ease);
		}

		.footer__fold:hover {
			color: var(--gold);
		}

		.footer__chevron {
			transition: transform var(--duration-hover) var(--ease);
		}

		.footer__fold.is-open .footer__chevron {
			transform: rotate(180deg);
		}

		.footer__places {
			display: block;
			margin: 0 0 var(--space-sm);
			padding-left: var(--space-sm);
			border-left: 1px solid rgba(214, 195, 163, 0.35);
			clip-path: none;
		}

		.footer.is-enhanced .footer__places.is-folded {
			display: none;
		}

		.footer__place {
			padding-left: 0;
		}

		.footer__place::before {
			content: none;
		}

		.footer__place .footer__link {
			padding-block: 0.6rem;
			white-space: normal;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.footer__wordmark,
		.footer__invite-cta,
		.footer__link,
		.footer__social,
		.footer__arrow,
		.footer__signup-input,
		.footer__signup-button,
		.footer__signup-error,
		.footer__cookie,
		.footer__country-name,
		.footer__country-name .footer__arrow,
		.footer__fold,
		.footer__chevron {
			transition: none;
		}
	}
</style>
