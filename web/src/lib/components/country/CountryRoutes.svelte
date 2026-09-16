<script lang="ts">
	/**
	 * The country page's cross-link panel: "Buying in Spain — read the guide, meet the
	 * specialists."
	 *
	 * It exists because the partner directory is discipline-first with the market as a
	 * filter, which is right for the network's credibility but leaves the country page mute
	 * on partners. This is the route in: the second action carries the market's own partner
	 * count and deep-links the filter.
	 *
	 * It is a CONTAINED panel, not a full-bleed band, for two reasons. The country page
	 * already spends its one deep-green surface on the Frontline rail (see
	 * FrontlineListings), and the 2026-09-15 decision established that a contained routes
	 * panel on --surface-tint is a contained panel rather than the one-per-page tint *band*
	 * — so this costs the page nothing it has already spent. Vocabulary is InsightRoutes':
	 * 1px hairline with a gold top edge, faint green bed, ruled header row, outline actions
	 * on white beds so they read as solid keys rather than lines drawn on the tint.
	 *
	 * Both routes degrade honestly rather than disappearing. A market with no guide written
	 * says so and offers the conversation; a market with no partners offers the
	 * introduction. Dropping the row instead would read, to a buyer looking at 23
	 * Montenegro listings, as though GHI has no presence there.
	 */
	import type { CountryRoutes } from '$lib/sanity/queries/countryRoutes';
	import { marketInProse, partnersPath } from '$lib/markets/markets';

	type Props = {
		routes: CountryRoutes;
		/** The market's display name, e.g. "Spain". */
		countryName: string;
		countrySlug: string;
	};

	let { routes, countryName, countrySlug }: Props = $props();

	const labelId = $derived(`country-routes-${countrySlug}`);
	const inProse = $derived(marketInProse(countryName));
	const introHref = $derived(
		`/contact?enquiry=specialist&country=${encodeURIComponent(countrySlug)}`
	);
	const guideAskHref = $derived(
		`/contact?enquiry=guide&country=${encodeURIComponent(countrySlug)}`
	);

	const partnerCount = $derived(routes.partnerCount);
	// Counts sit mid-sentence, spelled out to nine and in figures above, so "one" and "12"
	// never lead a sentence side by side on two country pages.
	const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
	const countWord = $derived(NUMBER_WORDS[partnerCount] ?? String(partnerCount));
	const partnersBody = $derived(
		partnerCount === 0
			? `We will introduce you to a vetted lawyer, broker or currency specialist working in ${inProse}.`
			: partnerCount === 1
				? `We work with one independent firm covering ${inProse}, vetted by us. The introduction comes from us; the choice stays yours.`
				: `We work with ${countWord} independent firms covering ${inProse}, each vetted by us. The introduction comes from us; the choice stays yours.`
	);
</script>

<aside class="routes" aria-labelledby={labelId}>
	<h2 class="routes__label" id={labelId}>Buying in {inProse}</h2>
	<div class="routes__grid">
		<div class="routes__route">
			{#if routes.guide}
				<h3 class="routes__heading">Read the guide</h3>
				<p class="routes__body">
					The process, the costs, the tax and the financing in {inProse}, set out plainly.
				</p>
				<a class="routes__action" href={routes.guide.href}>Read the guide</a>
			{:else}
				<h3 class="routes__heading">How buying works here</h3>
				<p class="routes__body">
					No written guide to buying in {inProse} yet — we will talk you through the process, the costs
					and the order it happens in.
				</p>
				<a class="routes__action" href={guideAskHref}>Ask how it works</a>
			{/if}
		</div>

		<div class="routes__route">
			<h3 class="routes__heading">Meet the specialists</h3>
			<p class="routes__body">{partnersBody}</p>
			{#if partnerCount > 0}
				<a class="routes__action" href={partnersPath(countrySlug)}>See who we work with</a>
			{:else}
				<a class="routes__action" href={introHref}>Request an introduction</a>
			{/if}
		</div>
	</div>
</aside>

<style>
	.routes {
		--routes-rule: color-mix(in oklch, var(--green) 14%, transparent);
		margin-block: clamp(2rem, 5vw, 3rem);
		padding: clamp(1.25rem, 3vw, 1.75rem) clamp(1.5rem, 4vw, 2rem);
		border: 1px solid var(--border);
		border-block-start: 1px solid var(--gold);
		background: var(--surface-tint);
	}

	.routes p {
		margin: 0;
	}

	/* Header row: it names the set, so it is ruled off from the routes rather than floating
	   as a caption above the first heading. Semantically the panel's h2 (the routes are h3s
	   beneath it); visually the InsightRoutes header row, so the idiom stays one object. */
	.routes .routes__label {
		margin: 0 0 var(--space-md);
		line-height: 1;
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--routes-rule);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		/* Green, not gold: gold on white/tint measures ~1.6:1. DESIGN.md Gold-as-Accent. */
		color: var(--green);
	}

	/* Row gap has to beat every interval inside a route; the column gap only holds the two
	   columns apart. */
	.routes__grid {
		display: grid;
		row-gap: var(--space-xl);
		column-gap: var(--space-lg);
	}

	.routes__route {
		min-width: 0;
	}

	.routes__heading {
		margin: 0 0 var(--space-xs);
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h4);
		line-height: 1.25;
		color: var(--green);
		text-wrap: balance;
	}

	.routes__body {
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.6;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	/* Outline tier, not the filled green: the two routes rank equally, and the page's filled
	   button belongs to the enquiry. A white bed lifts each action off the tint as a solid
	   key rather than a line drawn on the surface. */
	.routes .routes__action {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		max-inline-size: 24rem;
		margin-top: var(--space-sm);
		padding: 0.7rem 1.25rem;
		background: var(--white);
		color: var(--green);
		border: 1px solid var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-align: center;
		text-decoration: none;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.routes .routes__action:hover,
	.routes .routes__action:focus-visible {
		background: var(--green);
		color: var(--white);
	}

	.routes .routes__action:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	@media (min-width: 40rem) {
		.routes__grid {
			grid-template-columns: 1fr 1fr;
		}

		.routes .routes__action {
			max-inline-size: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.routes .routes__action {
			transition: none;
		}
	}
</style>
