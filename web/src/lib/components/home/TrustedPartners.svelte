<script lang="ts">
	export type TrustedPartner = {
		/** Display name (used as the logo's alt text once a logo is supplied). */
		name: string;
		/** The advisory role this partner fills; shown as the placeholder until a logo lands. */
		role: string;
		/** Optional logo image URL. When present the cell renders the logo in place of the role label. */
		logo?: string;
		/** Optional responsive candidates for the logo image. */
		srcset?: string;
		/** Optional link to the partner. When present the cell becomes a focusable link. */
		href?: string;
	};

	type Props = {
		partners?: TrustedPartner[];
		heading?: string;
		subhead?: string;
		ctaLabel?: string;
		ctaHref?: string;
		ctaSupport?: string;
	};

	// Role placeholders for now; real partner logos slot into `logo`/`href` later
	// (or move to Sanity) without touching the markup. Empty `partners` omits the
	// section entirely, mirroring SharedAmenities.
	let {
		partners = [
			{ name: 'Legal partner', role: 'Legal partner' },
			{ name: 'Tax advisor', role: 'Tax advisor' },
			{ name: 'Mortgage broker', role: 'Mortgage broker' },
			{ name: 'Currency exchange', role: 'Currency exchange' },
			{ name: 'Local agent', role: 'Local agent' }
		],
		heading = 'Trusted Partners',
		subhead = 'Legal, financial and local expertise across Spain and Portugal.',
		ctaLabel = 'Request introduction',
		ctaHref = '/contact',
		ctaSupport = "Tell us what you need and we'll connect you with the right specialist."
	}: Props = $props();
</script>

{#if partners.length > 0}
	<section class="partners" aria-labelledby="partners-heading">
		<div class="partners__head">
			<h2 id="partners-heading">{heading}</h2>
			{#if subhead}
				<p class="partners__subhead">{subhead}</p>
			{/if}
		</div>

		<ul class="partners__wall">
			{#each partners as partner, index (partner.name)}
				<li class="partner" style="--reveal-delay: {index * 70}ms">
					{#if partner.href}
						<a class="partner__cell partner__cell--link" href={partner.href}>
							{#if partner.logo}
								<img
									class="partner__logo"
									src={partner.logo}
									srcset={partner.srcset}
									alt={partner.name}
									loading="lazy"
								/>
							{:else}
								<span class="partner__role">{partner.role}</span>
							{/if}
						</a>
					{:else}
						<div class="partner__cell">
							{#if partner.logo}
								<img
									class="partner__logo"
									src={partner.logo}
									srcset={partner.srcset}
									alt={partner.name}
									loading="lazy"
								/>
							{:else}
								<span class="partner__role">{partner.role}</span>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>

		<div class="partners__cta">
			<p class="partners__cta-support">{ctaSupport}</p>
			<a class="partners__cta-button" href={ctaHref}>
				{ctaLabel}
				<svg
					class="partners__cta-arrow"
					width="18"
					height="9"
					viewBox="0 0 18 9"
					fill="none"
					aria-hidden="true"
				>
					<path d="M0 4.5h15.5M12 1l4 3.5-4 3.5" stroke="currentColor" stroke-width="1.25" />
				</svg>
			</a>
		</div>
	</section>
{/if}

<style>
	.partners {
		min-width: 0;
	}

	.partners__head {
		display: grid;
		gap: var(--space-xs);
		margin-bottom: var(--space-lg);
	}

	.partners__subhead {
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}

	/* Logo wall: five across on desktop, three on tablet, two on phones. Equal-height
	   hairline cells so the row reads as one band whether it holds logos or labels. */
	.partners__wall {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-md);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	@media (min-width: 560px) {
		.partners__wall {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (min-width: 900px) {
		.partners__wall {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}
	}

	.partner {
		min-width: 0;
	}

	.partner__cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 6.5rem;
		padding: var(--space-md);
		border: 1px solid var(--border);
		text-align: center;
	}

	/* Placeholder label: reads as a quiet "logo lands here" marker, not a chip. */
	.partner__role {
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: 0.02em;
		color: var(--muted);
	}

	/* Real logos sit muted at rest and resolve on hover/focus, the standard
	   grayscale logo-wall treatment. */
	.partner__logo {
		max-width: 100%;
		max-height: 2.75rem;
		width: auto;
		height: auto;
		object-fit: contain;
		filter: grayscale(1);
		opacity: 0.7;
		transition:
			filter var(--duration-hover) var(--ease),
			opacity var(--duration-hover) var(--ease);
	}

	.partner__cell--link {
		text-decoration: none;
		transition: border-color var(--duration-hover) var(--ease);
	}

	.partner__cell--link:hover,
	.partner__cell--link:focus-visible {
		border-color: var(--gold);
	}

	.partner__cell--link:hover .partner__logo,
	.partner__cell--link:focus-visible .partner__logo {
		filter: grayscale(0);
		opacity: 1;
	}

	.partner__cell--link:hover .partner__role,
	.partner__cell--link:focus-visible .partner__role {
		color: var(--green);
	}

	.partner__cell--link:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* CTA: the section's one green moment. A hairline separates it from the wall so the
	   action reads as the close of the band, not another cell. */
	.partners__cta {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-md);
		margin-top: var(--space-lg);
		padding-top: var(--space-lg);
		border-top: 1px solid var(--border);
	}

	.partners__cta-support {
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--charcoal);
		max-width: 42ch;
	}

	.partners__cta-button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		flex-shrink: 0;
		padding: 0.85rem 1.75rem;
		background: var(--green);
		color: var(--white);
		border: 1px solid var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.partners__cta-button:hover,
	.partners__cta-button:focus-visible {
		background: var(--charcoal);
		border-color: var(--charcoal);
	}

	.partners__cta-button:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.partners__cta-arrow {
		color: var(--gold);
		transition: transform var(--duration-hover) var(--ease);
	}

	.partners__cta-button:hover .partners__cta-arrow,
	.partners__cta-button:focus-visible .partners__cta-arrow {
		transform: translateX(4px);
	}

	/* On wider screens the support line and the action share a row, the support copy
	   carrying the left, the button anchored right. */
	@media (min-width: 720px) {
		.partners__cta {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}

	/* Entrance enhances an already-visible default: cells render in place, then stagger
	   in only when motion is welcome. Under reduced motion they simply appear. */
	@media (prefers-reduced-motion: no-preference) {
		.partner {
			opacity: 0;
			transform: translateY(16px);
			animation: partner-reveal 0.6s var(--ease) forwards;
			animation-delay: var(--reveal-delay, 0ms);
		}

		@keyframes partner-reveal {
			to {
				opacity: 1;
				transform: none;
			}
		}
	}
</style>
