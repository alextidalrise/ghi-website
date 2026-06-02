<script lang="ts">
	import { SITE_NAV_CTA } from '$lib/nav/siteNav';
	import type { NavCountryOption, NavLocationOption } from '$lib/sanity/queries/nav';

	type Props = {
		countries: NavCountryOption[];
		locations: NavLocationOption[];
	};

	let { countries, locations }: Props = $props();

	// Footer geography is curated, not exhaustive: a few locations per country with a
	// link through to the country page for the rest. Honours "curation over volume"
	// while still updating itself as Sanity content grows.
	const LOCATIONS_PER_COUNTRY = 5;

	const countryColumns = $derived(
		countries.map((country) => ({
			...country,
			locations: locations
				.filter((location) => location.countrySlug === country.slug)
				.slice(0, LOCATIONS_PER_COUNTRY)
		}))
	);

	// Editorial/site pages, linked ahead of the routes that aren't built yet (matching
	// the nav's convention).
	const resourceLinks = [
		{ label: 'Front Line Collection', href: '/front-line-collection' },
		{ label: 'Buying Guide', href: '/buying-guide' },
		{ label: 'About Us', href: '/about' },
		{ label: 'Contact', href: '/contact' }
	];

	const year = new Date().getFullYear();
	const instagramUrl = 'https://www.instagram.com/golfhomesinternational';

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

<footer class="footer on-dark">
	<div class="footer__inner content-wrap">
		<!-- Tier 1: brand + invitation -->
		<div class="footer__masthead">
			<div class="footer__brand">
				<a href="/" class="footer__wordmark">Golf Homes International</a>
				<p class="footer__statement">
					Curated residential property on and near the finest golf courses of Spain and Portugal.
				</p>
			</div>

			<div class="footer__invite">
				<p class="footer__invite-lead">Considering a move?</p>
				<a href={SITE_NAV_CTA.href} class="footer__invite-cta">
					Make an enquiry
					<span class="footer__arrow" aria-hidden="true">&rarr;</span>
				</a>
			</div>
		</div>

		<!-- Tier 2: index columns + newsletter -->
		<div class="footer__columns">
			{#each countryColumns as country (country._id)}
				{#if country.locations.length > 0}
					<nav class="footer__col" aria-label={country.name}>
						<h2 class="footer__heading">{country.name}</h2>
						<ul class="footer__list">
							{#each country.locations as location (location._id)}
								<li>
									<a class="footer__link" href={`/${country.slug}/${location.slug}`}>
										{location.name}
									</a>
								</li>
							{/each}
							<li>
								<a class="footer__link footer__link--all" href={`/${country.slug}`}>
									All {country.name}
									<span class="footer__arrow" aria-hidden="true">&rarr;</span>
								</a>
							</li>
						</ul>
					</nav>
				{/if}
			{/each}

			<nav class="footer__col" aria-label="Resources">
				<h2 class="footer__heading">Explore</h2>
				<ul class="footer__list">
					{#each resourceLinks as link (link.href)}
						<li><a class="footer__link" href={link.href}>{link.label}</a></li>
					{/each}
				</ul>
			</nav>

			<div class="footer__col footer__col--signup">
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
							<button
								class="footer__signup-button"
								type="submit"
								disabled={status === 'submitting'}
							>
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

		<!-- Tier 3: legal + social -->
		<div class="footer__baseline">
			<p class="footer__copyright">© {year} Golf Homes International. All rights reserved.</p>
			<div class="footer__baseline-right">
				<ul class="footer__legal">
					<li><a class="footer__link" href="/privacy">Privacy</a></li>
					<li><a class="footer__link" href="/terms">Terms</a></li>
				</ul>
				<a
					class="footer__social"
					href={instagramUrl}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Golf Homes International on Instagram"
				>
					<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
						<rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" stroke-width="1.6" />
						<circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6" />
						<circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
					</svg>
				</a>
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
		font-family: var(--serif);
		font-weight: 600;
		font-size: var(--text-h3);
		line-height: 1.1;
		letter-spacing: var(--tracking-tight);
		color: var(--on-green);
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.footer__wordmark:hover,
	.footer__wordmark:focus-visible {
		color: var(--gold);
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

	/* Tier 2 — index columns; newsletter is the widest column and wraps to full width
	   first on narrow viewports. */
	.footer__columns {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: var(--space-xl) var(--space-lg);
		padding-block: var(--space-xl);
	}

	.footer__col--signup {
		grid-column: span 2;
		min-width: 16rem;
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

	.footer__signup-row {
		display: flex;
		align-items: stretch;
		gap: var(--space-sm);
		max-width: 26rem;
	}

	.footer__signup-input {
		flex: 1;
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

		.footer__col--signup {
			grid-column: 1 / -1;
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
		.footer__signup-error {
			transition: none;
		}
	}
</style>
