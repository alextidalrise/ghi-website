<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import ListingRail from '$lib/components/listing/ListingRail.svelte';
	import SpotlightCard from '$lib/components/listing/SpotlightCard.svelte';
	import { toAnalyticsItemsByPosition, type ListContext } from '$lib/analytics';
	import { FRONTLINE_COLLECTION_PATH } from '$lib/listing/routes';
	import { isInternalHref, withoutCampaignParams } from '$lib/sanity/href';
	import type { InsightFrontlineRailBlock } from '$lib/insights/types';

	// Distinct from the homepage band's `frontline` context so an article's carousel engagement
	// is measurable on its own rather than merged into homepage frontline metrics.
	const FRONTLINE_INSIGHT_LIST: ListContext = {
		list_id: 'frontline_insight',
		list_name: 'Front-line collection (insight)'
	};

	let { portableText }: { portableText: CustomBlockComponentProps<InsightFrontlineRailBlock> } =
		$props();

	// The editor's hand-picked, publish-gated listings, mapped to cards in the Insight server load
	// and carried on the block itself (see hydrateFrontlineRails). Withdrawn/unpublished picks are
	// already filtered out, so an empty list means the whole rail hides.
	const cards = $derived(portableText.value.cards ?? []);

	const heading = $derived(portableText.value.heading?.trim());
	const headingId = $derived(`insight-frontline-${portableText.value._key}`);

	// An explicit summary wins verbatim. Otherwise the count-based auto-summary: an editable
	// singular/plural template per block (defaults preserve today's copy), with {count} swapped for
	// the live number of listings.
	const summaryLine = $derived.by(() => {
		const explicit = portableText.value.summary?.trim();
		if (explicit) return explicit;
		const count = cards.length;
		const template =
			count === 1
				? portableText.value.summaryCountSingular?.trim() || '1 property on the golf course'
				: portableText.value.summaryCountPlural?.trim() || '{count} properties on the golf course';
		return template.replace(/\{count\}/g, String(count));
	});

	// The outbound link is editor-configurable: shown by default (undefined reads as shown, so
	// blocks predating the toggle keep the link), with an authorable label and destination. The
	// href is campaign-stripped like every other authored link (see $lib/sanity/href) and opens in
	// a new tab only when it points off-site.
	const showViewAll = $derived(portableText.value.showViewAll !== false);
	const viewAllLabel = $derived(portableText.value.viewAllLabel?.trim() || 'View all frontline');
	const viewAllHref = $derived(
		withoutCampaignParams(portableText.value.viewAllHref?.trim() || FRONTLINE_COLLECTION_PATH)
	);
	const viewAllExternal = $derived(/^https?:\/\//.test(viewAllHref) && !isInternalHref(viewAllHref));

	const analyticsItems = $derived(toAnalyticsItemsByPosition(cards, FRONTLINE_INSIGHT_LIST));
	const impressionItems = $derived(analyticsItems.filter((item) => item !== null));
</script>

{#if cards.length > 0}
	<!-- Contained inline carousel: the hand-picked Front Line selection sitting within the
	     article's reading column (not the full-bleed green band). The section h2 already titles the
	     block, so the heading here is an h3 — and when the editor leaves it blank, a
	     screen-reader-only h3 still names the rail and keeps it in the document outline without a
	     visible repeat of the h2. -->
	<div class="frontline-inline">
		<div class="frontline-inline__head">
			<h3 id={headingId} class="frontline-inline__title" class:sr-only={!heading}>
				{heading || 'Front Line collection'}
			</h3>
			<div class="frontline-inline__meta">
				<p class="frontline-inline__summary">{summaryLine}</p>
				{#if showViewAll}
					<a
						class="frontline-inline__cta"
						href={viewAllHref}
						target={viewAllExternal ? '_blank' : undefined}
						rel={viewAllExternal ? 'noopener noreferrer' : undefined}
					>
						{viewAllLabel}
						<span aria-hidden="true">→</span>
					</a>
				{/if}
			</div>
		</div>

		<ListingRail
			items={cards}
			getKey={(c, i) => `${c.card._id}-${i}`}
			labelledby={headingId}
			list={FRONTLINE_INSIGHT_LIST}
			analyticsItems={impressionItems}
		>
			{#snippet card(c, i)}
				{#if c.kind === 'development'}
					<SpotlightCard card={c.card} kind="development" showLocation item={analyticsItems[i] ?? null} />
				{:else}
					<SpotlightCard card={c.card} showLocation item={analyticsItems[i] ?? null} />
				{/if}
			{/snippet}
		</ListingRail>
	</div>
{/if}

<style>
	/* Set-piece spacing to match the article's other framed blocks (card grid, takeaways):
	   whitespace does the separating, no rule. */
	.frontline-inline {
		margin-block: var(--space-xl);
	}

	.frontline-inline__head {
		margin-bottom: var(--space-md);
	}

	/* An h3, one step below the section h2 — folds to the article's in-section heading type. */
	.frontline-inline__title {
		margin: 0;
		font-family: var(--serif);
		font-size: var(--text-h4);
		line-height: 1.25;
		color: var(--green);
	}

	/* Summary (left) and the collection link (right) share one row under the title. The summary
	   flexes; the link holds its size. Wraps to a stack only when the column is too narrow. */
	.frontline-inline__meta {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-xs) var(--space-md);
		margin-top: var(--space-xs);
	}

	.frontline-inline__summary {
		flex: 1 1 12rem;
		min-width: 0;
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--charcoal);
	}

	.frontline-inline__cta {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		color: var(--green);
		text-decoration: underline;
		text-decoration-color: var(--border);
		text-underline-offset: 0.18em;
		white-space: nowrap;
		transition:
			text-decoration-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.frontline-inline__cta span {
		transition: transform var(--duration-hover) var(--ease);
	}

	.frontline-inline__cta:hover,
	.frontline-inline__cta:focus-visible {
		color: var(--gold);
		text-decoration-color: var(--gold);
	}

	.frontline-inline__cta:hover span,
	.frontline-inline__cta:focus-visible span {
		transform: translateX(3px);
	}

	.sr-only {
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

	@media (prefers-reduced-motion: reduce) {
		.frontline-inline__cta,
		.frontline-inline__cta span {
			transition: none;
		}
		.frontline-inline__cta:hover span,
		.frontline-inline__cta:focus-visible span {
			transform: none;
		}
	}
</style>
