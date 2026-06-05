<script lang="ts">
	import ListingRail from './ListingRail.svelte';
	import SpotlightCard from './SpotlightCard.svelte';
	import type { PublicPropertyCard } from '$lib/sanity/transforms/propertyCard';

	type Props = {
		cards: PublicPropertyCard[];
		heading: string;
		/** Optional editorial subtitle; falls back to a plain count. */
		summary?: string;
		viewAllHref?: string;
	};

	let { cards, heading, summary, viewAllHref }: Props = $props();

	const summaryLine = $derived(
		summary ??
			(cards.length === 1 ? '1 property on the golf course' : `${cards.length} properties on the golf course`)
	);
</script>

{#if cards.length > 0}
	<!-- The premier range gets the page's one deep-green emphasis surface. The band
	     breaks out to full width; the head stays in the content column while the rail
	     bleeds off the right edge, filling the width with listings instead of flat green. -->
	<section class="frontline on-dark" aria-labelledby="frontline-heading">
		<div class="frontline__inner">
			<div class="frontline__head">
				<p class="frontline__marker">
					<span class="frontline__diamond" aria-hidden="true"></span>
					Frontline Golf
				</p>
				<h2 id="frontline-heading" class="frontline__title">{heading}</h2>

				<!-- Subhead and CTA share one row beneath the full-width title. Wraps to a
				     stack only when the viewport is too narrow to hold both comfortably. -->
				<div class="frontline__head-row">
					<p class="frontline__summary">{summaryLine}</p>

					{#if viewAllHref}
						<a class="frontline__cta" href={viewAllHref}>
							View all frontline
							<span aria-hidden="true">→</span>
						</a>
					{:else if cards.length > 1}
						<span class="frontline__cue" aria-hidden="true">‹ scroll ›</span>
					{/if}
				</div>
			</div>
		</div>

		<ListingRail
			items={cards}
			getKey={(c, i) => `${c._id}-${i}`}
			bleed
			labelledby="frontline-heading"
		>
			{#snippet card(c)}
				<SpotlightCard card={c} surface="green" />
			{/snippet}
		</ListingRail>
	</section>
{/if}

<style>
	.frontline {
		/* Full-bleed: escape the surrounding content column to the viewport edges.
		   The page-level `overflow-x: clip` on .site-main absorbs the scrollbar gutter. */
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		color: var(--on-green);
		padding-block: clamp(3rem, 4.5vw, 4.25rem);
		/* Depth instead of a flat slab: a soft light from the top-left behind the
		   heading, settling into a gently deeper green at the base. */
		background:
			radial-gradient(120% 90% at 14% -20%, oklch(0.37 0.05 165) 0%, transparent 52%),
			linear-gradient(180deg, oklch(0.31 0.035 165) 0%, oklch(0.24 0.03 165) 100%);
		/* Hairline gold rules frame the band crisply against the white page. */
		border-block: 1px solid oklch(0.82 0.05 85 / 0.28);
	}

	/* Full-bleed head: the marker, title and CTA align to the same edge gutter as the
	   bleeding rail, so the premier band uses the whole width rather than sitting in
	   the narrower page column. */
	.frontline__inner {
		padding-inline: var(--content-padding);
	}

	.frontline__head {
		margin-bottom: var(--space-lg);
	}

	/* Subhead (left) and CTA (right) always share one row under the title. The summary
	   flexes and shrinks (its text wraps to more lines); the CTA holds its size. No
	   flex-wrap, so the button never drops beneath the subhead. */
	.frontline__head-row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-md) var(--space-lg);
		margin-top: var(--space-md);
	}

	.frontline__marker {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: var(--space-md);
		padding: 0.4rem 0.8rem;
		background: var(--gold);
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 600;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
	}

	.frontline__diamond {
		width: 6px;
		height: 6px;
		background: currentColor;
		transform: rotate(45deg);
	}

	.frontline__title {
		color: var(--on-green);
		max-width: 22ch;
	}

	.frontline__summary {
		flex: 1;
		min-width: 0;
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: oklch(0.86 0.02 85 / 0.82);
	}

	/* On-dark outline button: anchors the right of the head row so the band reads as a
	   composed spread, not a narrow column floating in green. */
	.frontline__cta {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.8rem 1.5rem;
		border: 1px solid oklch(0.82 0.05 85 / 0.55);
		color: var(--on-green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		text-decoration: none;
		white-space: nowrap;
		transition:
			background-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.frontline__cta span {
		transition: transform var(--duration-hover) var(--ease);
	}

	.frontline__cta:hover,
	.frontline__cta:focus-visible {
		background: var(--gold);
		color: var(--green);
		border-color: var(--gold);
	}

	.frontline__cta:hover span,
	.frontline__cta:focus-visible span {
		transform: translateX(3px);
	}

	.frontline__cta:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.frontline__cue {
		flex-shrink: 0;
		align-self: center;
		font-family: var(--sans);
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		color: var(--gold);
	}

	@media (max-width: 600px) {
		.frontline__cue {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.frontline__cta span {
			transition: none;
		}
		.frontline__cta:hover span,
		.frontline__cta:focus-visible span {
			transform: none;
		}
	}
</style>
