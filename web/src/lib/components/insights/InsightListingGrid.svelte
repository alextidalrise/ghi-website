<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightListingGridBlock } from '$lib/insights/types';

	let {
		portableText
	}: { portableText: CustomBlockComponentProps<InsightListingGridBlock> } = $props();

	const block = $derived(portableText.value);
	const groups = $derived(block.groups ?? []);
	const cards = $derived(block.cards ?? []);
	const heading = $derived(block.heading?.trim() || null);

	// One representative per destination shows initially on mobile unless the editor chose "all".
	const onePerGroup = $derived(block.mobileInitialMode !== 'all');
	// There is something to disclose only when a group has more than its representative.
	const hasExtras = $derived(groups.some((g) => g.cards.length > 1));
	const collapsible = $derived(onePerGroup && hasExtras);

	const gridId = $derived(`listing-grid-${block._key}`);
	const expandLabel = $derived(
		(block.expandLabel?.trim() || 'See all {count} properties').replace(
			'{count}',
			String(cards.length)
		)
	);
	const collapseLabel = $derived(block.collapseLabel?.trim() || 'Show fewer properties');

	let expanded = $state(false);
	const toggle = () => (expanded = !expanded);
</script>

{#if groups.length > 0}
	<div class="listing-shell" class:listing-shell--expanded={expanded}>
		{#if heading}
			<h3 class="listing-shell__heading">{heading}</h3>
		{/if}

		<!-- Desktop: groups collapse to `display: contents` so all cards flow in one flat two-column
		     grid in editor order. Mobile: groups become blocks with a destination heading, and all but
		     the first card in each group are disclosed behind the button. -->
		<div class="listing-grid" id={gridId} class:listing-grid--collapsible={collapsible}>
			{#each groups as group (group.label)}
				<div class="listing-group">
					<h4 class="listing-group__title">{group.label}</h4>
					{#each group.cards as card, i (card._id)}
						<a
							class="listing-card"
							class:listing-card--extra={collapsible && i > 0}
							href={card.href}
						>
							<div class="listing-card__image">
								{#if card.image}
									<img
										src={card.image}
										srcset={card.srcset || undefined}
										sizes="(max-width: 40rem) 100vw, 20rem"
										alt={card.alt}
										loading="lazy"
										decoding="async"
										style:background-image={card.lqip ? `url(${card.lqip})` : undefined}
									/>
								{/if}
							</div>
							<div class="listing-card__label">
								<div class="listing-card__title">{card.title}</div>
								{#if card.locationLabel}
									<div class="listing-card__location">{card.locationLabel}</div>
								{/if}
								{#if card.countryLabel}
									<div class="listing-card__country">{card.countryLabel}</div>
								{/if}
								{#if card.price || card.specsLabel}
									<div class="listing-card__facts">
										{#if card.price}
											<span class="listing-card__price">{card.price}</span>
										{/if}
										{#if card.specsLabel}
											<span class="listing-card__specs">{card.specsLabel}</span>
										{/if}
									</div>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/each}
		</div>

		{#if collapsible}
			<button
				class="listing-toggle"
				type="button"
				aria-controls={gridId}
				aria-expanded={expanded}
				onclick={toggle}
			>
				{expanded ? collapseLabel : expandLabel}
			</button>
		{/if}
	</div>
{/if}

<style>
	.listing-shell {
		margin-block: var(--space-lg);
	}

	.listing-shell__heading {
		font-size: var(--text-h3);
		margin-bottom: var(--space-lg);
	}

	.listing-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-lg);
	}

	/* Desktop: the destination grouping is invisible — cards flow as one flat grid in editor order. */
	.listing-group {
		display: contents;
	}

	.listing-group__title {
		display: none;
	}

	/* Whole card is one link. Flex column so the facts pin to the foot and rows stay even-height. */
	.listing-card {
		display: flex;
		flex-direction: column;
		min-width: 0;
		border: 1px solid var(--border);
		background: var(--white);
		color: inherit;
		text-decoration: none;
	}

	.listing-card__image {
		aspect-ratio: 3 / 2;
		overflow: hidden;
		background-color: var(--green);
	}

	.listing-card__image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		transition: transform var(--duration-hover, 0.3s) var(--ease);
	}

	.listing-card:hover .listing-card__image img,
	.listing-card:focus-visible .listing-card__image img {
		transform: scale(1.02);
	}

	.listing-card:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}

	.listing-card__label {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: 1rem 1.1rem 1.15rem;
	}

	.listing-card__title {
		font-family: var(--serif);
		font-size: 1.2rem;
		line-height: 1.2;
		color: var(--green);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.16em;
	}

	.listing-card__location {
		margin-top: 0.55rem;
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--charcoal);
	}

	.listing-card__country {
		margin-top: 0.15rem;
		font-family: var(--sans);
		font-size: var(--text-overline);
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	/* A hairline separates the identity from the commercial facts, which pin to the card foot. */
	.listing-card__facts {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.25rem 0.65rem;
		margin-top: auto;
		padding-top: 0.85rem;
		border-top: 1px solid var(--border);
	}

	.listing-card__price {
		font-family: var(--serif);
		font-size: 1.1rem;
		line-height: 1.3;
		color: var(--green);
	}

	.listing-card__specs {
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.4;
		color: var(--muted);
	}

	.listing-toggle {
		display: none;
	}

	/* Phone: one column, the destination grouping becomes visible, and all but the first card in each
	   group hide behind the disclosure until expanded. */
	@media (max-width: 40rem) {
		.listing-grid {
			grid-template-columns: 1fr;
			gap: var(--space-md);
		}

		.listing-group {
			display: grid;
			gap: var(--space-md);
		}

		.listing-group + .listing-group {
			margin-top: var(--space-lg);
		}

		.listing-group__title {
			display: block;
			font-family: var(--serif);
			font-size: 1.25rem;
			color: var(--green);
			padding-bottom: 0.6rem;
			border-bottom: 1px solid var(--border);
		}

		.listing-shell:not(.listing-shell--expanded) .listing-grid--collapsible .listing-card--extra {
			display: none;
		}

		.listing-grid--collapsible ~ .listing-toggle {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			min-height: 44px;
			margin-top: var(--space-lg);
			padding: 0.75rem 1.1rem;
			background: transparent;
			border: 1px solid var(--green);
			color: var(--green);
			font-family: var(--sans);
			font-size: var(--text-small);
			font-weight: 600;
			letter-spacing: var(--tracking-wide);
			text-transform: uppercase;
			cursor: pointer;
		}

		.listing-grid--collapsible ~ .listing-toggle:focus-visible {
			outline: 2px solid var(--gold);
			outline-offset: 3px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.listing-card__image img {
			transition: none;
		}
	}
</style>
