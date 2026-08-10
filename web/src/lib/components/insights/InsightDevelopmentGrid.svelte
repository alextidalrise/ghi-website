<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightDevelopmentGridBlock } from '$lib/insights/types';

	let {
		portableText
	}: { portableText: CustomBlockComponentProps<InsightDevelopmentGridBlock> } = $props();

	const block = $derived(portableText.value);
	const groups = $derived(block.groups ?? []);
	const cards = $derived(block.cards ?? []);
	const heading = $derived(block.heading?.trim() || null);

	// One representative per destination shows initially on mobile unless the editor chose "all".
	const onePerGroup = $derived(block.mobileInitialMode !== 'all');
	// There is something to disclose only when a group has more than its representative.
	const hasExtras = $derived(groups.some((g) => g.cards.length > 1));
	const collapsible = $derived(onePerGroup && hasExtras);

	const gridId = $derived(`dev-grid-${block._key}`);
	const expandLabel = $derived(
		(block.expandLabel?.trim() || 'See all {count} developments').replace(
			'{count}',
			String(cards.length)
		)
	);
	const collapseLabel = $derived(block.collapseLabel?.trim() || 'Show fewer developments');

	let expanded = $state(false);
	const toggle = () => (expanded = !expanded);
</script>

{#if groups.length > 0}
	<div class="dev-shell" class:dev-shell--expanded={expanded}>
		{#if heading}
			<h3 class="dev-shell__heading">{heading}</h3>
		{/if}

		<!-- Desktop: groups collapse to `display: contents` so all cards flow in one flat two-column
		     grid in editor order. Mobile: groups become blocks with a destination heading, and all but
		     the first card in each group are disclosed behind the button. -->
		<div class="dev-grid" id={gridId} class:dev-grid--collapsible={collapsible}>
			{#each groups as group (group.label)}
				<div class="dev-group">
					<h4 class="dev-group__title">{group.label}</h4>
					{#each group.cards as card, i (card._id)}
						<a
							class="dev-card"
							class:dev-card--extra={collapsible && i > 0}
							href={card.href}
						>
							<div class="dev-card__image">
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
							<div class="dev-card__label">
								<div class="dev-card__title">{card.title}</div>
								{#if card.locationLabel}
									<div class="dev-card__location">{card.locationLabel}</div>
								{/if}
								{#if card.countryLabel}
									<div class="dev-card__country">{card.countryLabel}</div>
								{/if}
								{#if card.price || card.statusLabel || card.completionLabel}
									<div class="dev-card__facts">
										{#if card.price}
											<span class="dev-card__price">{card.price}</span>
										{/if}
										{#if card.statusLabel || card.completionLabel}
											<div class="dev-card__timeline">
												{#if card.statusLabel}
													<span class="dev-card__status">{card.statusLabel}</span>
												{/if}
												{#if card.completionLabel}
													<span class="dev-card__completion">{card.completionLabel}</span>
												{/if}
											</div>
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
				class="dev-toggle"
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
	.dev-shell {
		margin-block: var(--space-lg);
	}

	.dev-shell__heading {
		font-size: var(--text-h3);
		margin-bottom: var(--space-lg);
	}

	.dev-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-lg);
	}

	/* Desktop: the destination grouping is invisible — cards flow as one flat grid in editor order. */
	.dev-group {
		display: contents;
	}

	.dev-group__title {
		display: none;
	}

	/* Whole card is one link. Flex column so the facts pin to the foot and rows stay even-height. */
	.dev-card {
		display: flex;
		flex-direction: column;
		min-width: 0;
		border: 1px solid var(--border);
		background: var(--white);
		color: inherit;
		text-decoration: none;
	}

	.dev-card__image {
		aspect-ratio: 3 / 2;
		overflow: hidden;
		background-color: var(--green);
	}

	.dev-card__image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		transition: transform var(--duration-hover, 0.3s) var(--ease);
	}

	.dev-card:hover .dev-card__image img,
	.dev-card:focus-visible .dev-card__image img {
		transform: scale(1.02);
	}

	.dev-card:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}

	.dev-card__label {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: 1rem 1.1rem 1.15rem;
	}

	.dev-card__title {
		font-family: var(--serif);
		font-size: 1.2rem;
		line-height: 1.2;
		color: var(--green);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.16em;
	}

	.dev-card__location {
		margin-top: 0.55rem;
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--charcoal);
	}

	.dev-card__country {
		margin-top: 0.15rem;
		font-family: var(--sans);
		font-size: var(--text-overline);
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	/* A hairline separates the identity from the commercial facts, which pin to the card foot. */
	.dev-card__facts {
		margin-top: auto;
		padding-top: 0.85rem;
		border-top: 1px solid var(--border);
	}

	.dev-card__price {
		display: block;
		font-family: var(--serif);
		font-size: 1.1rem;
		line-height: 1.3;
		color: var(--green);
	}

	.dev-card__timeline {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.65rem;
		margin-top: 0.55rem;
	}

	.dev-card__status {
		background: var(--green);
		color: var(--on-green);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		line-height: 1.3;
		padding: 0.35rem 0.5rem;
	}

	.dev-card__completion {
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.4;
		color: var(--muted);
	}

	.dev-toggle {
		display: none;
	}

	/* Phone: one column, the destination grouping becomes visible, and all but the first card in each
	   group hide behind the disclosure until expanded. */
	@media (max-width: 40rem) {
		.dev-grid {
			grid-template-columns: 1fr;
			gap: var(--space-md);
		}

		.dev-group {
			display: grid;
			gap: var(--space-md);
		}

		.dev-group + .dev-group {
			margin-top: var(--space-lg);
		}

		.dev-group__title {
			display: block;
			font-family: var(--serif);
			font-size: 1.25rem;
			color: var(--green);
			padding-bottom: 0.6rem;
			border-bottom: 1px solid var(--border);
		}

		.dev-shell:not(.dev-shell--expanded) .dev-grid--collapsible .dev-card--extra {
			display: none;
		}

		.dev-grid--collapsible ~ .dev-toggle {
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

		.dev-grid--collapsible ~ .dev-toggle:focus-visible {
			outline: 2px solid var(--gold);
			outline-offset: 3px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dev-card__image img {
			transition: none;
		}
	}
</style>
