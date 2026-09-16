<script lang="ts">
	/**
	 * One market's block on the Guides hub: the flag stamp and country name, then its
	 * guides.
	 *
	 * The stamp is the same 1px-framed 3:2 object the header Countries shelf and the
	 * homepage country index already use — third use of the site's standing way of saying
	 * "a market", so a reader who has seen the nav recognises the row instantly.
	 *
	 * A market with no guide still renders. Omitting it would let a buyer looking at 23
	 * Montenegro listings infer from an absence that GHI does not cover it; saying "not
	 * written yet, talk to us" is both true and a better offer. It deliberately does not
	 * say "coming soon" — an undated promise on a crawled page ages badly, and nobody owns
	 * the date.
	 */
	import CountryFlagArt from '$lib/components/CountryFlagArt.svelte';
	import GuideCardLink from './GuideCardLink.svelte';
	import type { GuideMarketGroup } from '$lib/guides/markets';
	import { marketInProse } from '$lib/markets/markets';

	type Props = {
		group: GuideMarketGroup;
	};

	let { group }: Props = $props();

	const headingId = $derived(`guides-market-${group.market.slug}`);
	// Category sub-headings only earn their place once a market carries more than one kind
	// of guide. With buying guides alone they would be a label on every block saying the
	// same word.
	const showCategories = $derived(group.categories.length > 1);
</script>

<section class="market" aria-labelledby={headingId}>
	<header class="market__head">
		<span class="market__stamp" aria-hidden="true">
			<CountryFlagArt slug={group.market.slug} flagUrl={group.market.flagUrl} />
		</span>
		<h2 class="market__name" id={headingId}>{group.market.name}</h2>
	</header>

	{#if group.isEmpty}
		<p class="market__empty">
			No written guide to buying in {marketInProse(group.market.name)} yet.
			<a class="market__empty-link" href={`/contact?enquiry=guide&country=${group.market.slug}`}>
				Ask us how it works
				<span class="market__arrow" aria-hidden="true">→</span>
			</a>
		</p>
	{:else if showCategories}
		{#each group.categories as subgroup (subgroup.category)}
			<div class="market__subgroup">
				<h3 class="market__subheading">{subgroup.meta.label}</h3>
				<ul class="market__list">
					{#each subgroup.guides as card (card._id)}
						<li class="market__item"><GuideCardLink {card} /></li>
					{/each}
				</ul>
			</div>
		{/each}
	{:else}
		<ul class="market__list">
			{#each group.guides as card (card._id)}
				<li class="market__item"><GuideCardLink {card} /></li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.market {
		min-width: 0;
	}

	/* Hairline above the market name, so the countries read as an index down the page
	   rather than as a stack of cards. Emphasis Ladder tier 2. */
	.market__head {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding-top: var(--space-md);
		margin-bottom: var(--space-lg);
		border-top: 1px solid var(--border);
	}

	/* The same 1px-framed 3:2 stamp as the header shelf and the homepage country index. */
	.market__stamp {
		display: block;
		flex-shrink: 0;
		width: 2.25rem;
		height: 1.5rem;
		border: 1px solid var(--border);
		overflow: hidden;
	}

	.market__stamp :global(img),
	.market__stamp :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.market__name {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h3);
		color: var(--green);
		margin: 0;
	}

	.market__subgroup + .market__subgroup {
		margin-top: var(--space-xl);
	}

	.market__subheading {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		/* Green, not gold: gold on white measures ~1.6:1. See DESIGN.md Gold-as-Accent. */
		color: var(--green);
		margin: 0 0 var(--space-md);
	}

	/* The hub's established row list: GuideCardLink is built as a full-width row (thumbnail
	   beside title), separated by hairlines — not a tile to be gridded. A two-up grid
	   crushed the titles to four lines. */
	.market__list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--border);
	}

	.market__item {
		min-width: 0;
		border-bottom: 1px solid var(--border);
	}

	/* The next market's header rule is the boundary; a closing rule here would stack a
	   second hairline above it. */
	.market__item:last-child {
		border-bottom: 0;
	}

	.market__empty {
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--muted);
		max-width: 60ch;
		margin: 0;
	}

	.market__empty-link {
		display: inline-flex;
		align-items: baseline;
		gap: 0.4rem;
		color: var(--green);
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition:
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.market__empty-link:hover,
	.market__empty-link:focus-visible {
		color: var(--gold);
		border-bottom-color: var(--gold);
	}

	.market__empty-link:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.market__arrow {
		transition: transform var(--duration-hover) var(--ease);
	}

	.market__empty-link:hover .market__arrow,
	.market__empty-link:focus-visible .market__arrow {
		transform: translateX(3px);
	}

	@media (prefers-reduced-motion: reduce) {
		.market__empty-link,
		.market__arrow {
			transition: none;
		}

		.market__empty-link:hover .market__arrow,
		.market__empty-link:focus-visible .market__arrow {
			transform: none;
		}
	}
</style>
