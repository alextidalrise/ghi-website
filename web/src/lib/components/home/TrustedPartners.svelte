<script lang="ts">
	export type TrustedPartner = {
		/** Display name (used as the logo's alt text once a logo is supplied). */
		name: string;
		/** The advisory role this partner fills; shown as the placeholder until a logo lands. */
		role: string;
		/** The partner category, shown as a quiet label beneath the logo or placeholder. */
		category?: string;
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

	// Live partners (with logos and category labels) come from Sanity via the homepage
	// loader. These category-taxonomy placeholders are the evergreen fallback shown only
	// when no partner logos are returned. Empty `partners` omits the section entirely,
	// mirroring SharedAmenities.
	let {
		partners = [
			{ name: 'Legal & Tax', role: 'Legal & Tax' },
			{ name: 'Wealth Management', role: 'Wealth Management' },
			{ name: 'Mortgage', role: 'Mortgage' },
			{ name: 'Currency Exchange', role: 'Currency Exchange' },
			{ name: 'Project Management', role: 'Project Management' },
			{ name: 'Rental & Investment', role: 'Rental & Investment' },
			{ name: 'Holiday Rentals', role: 'Holiday Rentals' }
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

		{#snippet mark(partner: TrustedPartner)}
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
			{#if partner.category}
				<span class="partner__category">{partner.category}</span>
			{/if}
		{/snippet}

		<ul class="partners__wall">
			{#each partners as partner, index (partner.name)}
				<li class="partner" style="--reveal-delay: {index * 70}ms">
					{#if partner.href}
						<a class="partner__cell partner__cell--link" href={partner.href}>
							{@render mark(partner)}
						</a>
					{:else}
						<div class="partner__cell">
							{@render mark(partner)}
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

	/* Logo wall: five across on desktop, three on tablet, two on phones. Laid out with
	   flex-wrap so a short final row centres under the one above it rather than hanging
	   left. Each cell is sized to a fixed column fraction (--cols) so full rows still sit
	   edge to edge and read as one band, whether they hold logos or labels. */
	.partners__wall {
		--cols: 2;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-md);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	@media (min-width: 560px) {
		.partners__wall {
			--cols: 3;
		}
	}

	@media (min-width: 900px) {
		.partners__wall {
			--cols: 5;
		}
	}

	.partner {
		min-width: 0;
		flex: 0 1 calc((100% - (var(--cols) - 1) * var(--space-md)) / var(--cols));
	}

	.partner__cell {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 7rem;
		/* Extra room at the foot so the centred logo never crowds the corner caption. */
		padding: var(--space-md) var(--space-md) calc(var(--space-md) + 0.75rem);
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

	/* Category label: a quiet chip hugging the cell's bottom-left corner, clear of the
	   centred logo so the logo stays the focus. A soft warm-neutral fill (a mix of the
	   hairline tone with white) reads as a tag, not part of the mark. */
	.partner__category {
		position: absolute;
		left: 0.5rem;
		bottom: 0.5rem;
		max-width: calc(100% - 1rem);
		padding: 0.22rem 0.4rem;
		background: color-mix(in srgb, var(--border) 55%, var(--white));
		border-radius: 2px;
		font-family: var(--sans);
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		line-height: 1.15;
		text-align: left;
		color: var(--charcoal);
		transition: background var(--duration-hover) var(--ease);
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

	.partner__cell--link:hover .partner__category,
	.partner__cell--link:focus-visible .partner__category {
		background: color-mix(in srgb, var(--border) 80%, var(--white));
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
