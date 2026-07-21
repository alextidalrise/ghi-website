<script lang="ts">
	import type { CountryFeatureCard } from '$lib/sanity/transforms/taxonomyHero';

	type Props = {
		/** Country cards from the homepage load — used only for their flag SVGs, so the
		    signpost's flags stay identical to the "Destinations by country" index below. */
		countries?: CountryFeatureCard[];
		heading?: string;
		deck?: string;
		cta?: string;
	};

	let {
		countries = [],
		heading = 'Everything to know before you buy',
		deck = 'The process, the costs, the tax and the mortgage — set out plainly for non-resident buyers in Spain and Portugal.',
		cta = "Read the buyer's guides"
	}: Props = $props();

	const GUIDES_HREF = '/guides';

	/** Country slug from the card href (`/spain` → `spain`). */
	function slugOf(href: string): string {
		return href.replace(/^\//, '').split('/')[0];
	}

	type Stamp = { slug: 'spain' | 'portugal'; flagUrl: string | null };

	// The signpost always carries Spain + Portugal. Prefer the same Sanity-uploaded
	// flag the country index uses (matched by slug); fall back to null so the built-in
	// stamp renders until an editor uploads the flag — identical to DestinationsByCountry.
	const stamps = $derived<Stamp[]>(
		(['spain', 'portugal'] as const).map((slug) => ({
			slug,
			flagUrl: countries.find((c) => slugOf(c.href) === slug)?.flagUrl ?? null
		}))
	);
</script>

<!-- Flag stamp: prefer the SVG linked in Sanity; fall back to a hand-drawn stamp
     (matching DestinationsByCountry and the old buyer-guide cards). Decorative — the
     heading and deck carry the Spain/Portugal meaning, so the flags are aria-hidden. -->
{#snippet flag(stamp: Stamp)}
	{#if stamp.flagUrl}
		<img src={stamp.flagUrl} alt="" width="34" height="23" loading="lazy" decoding="async" />
	{:else if stamp.slug === 'spain'}
		<svg viewBox="0 0 30 20" aria-hidden="true">
			<rect width="30" height="20" fill="#AA151B" />
			<rect y="5" width="30" height="10" fill="#F1BF00" />
		</svg>
	{:else}
		<svg viewBox="0 0 30 20" aria-hidden="true">
			<rect width="30" height="20" fill="#DA291C" />
			<rect width="12" height="20" fill="#046A38" />
			<circle cx="12" cy="10" r="3.1" fill="#FFE12C" stroke="#046A38" stroke-width="0.7" />
		</svg>
	{/if}
{/snippet}

<!-- A compact signpost: a full-bleed band washed in a faint brand-green tint
     (--surface-tint), no hairline rules. The wash is what sets it apart from the white
     editorial default; deep green stays the page's one punctuation band (Frontline). It
     no longer captures email inline — the lead-capture forms live on /guides; this band
     just points there, keeping the fold short so Destinations and listings come up
     sooner. -->
<section class="guides" aria-labelledby="guides-heading">
	<div class="guides__inner">
		<div class="guides__text">
			<span class="guides__flags" aria-hidden="true">
				{#each stamps as stamp (stamp.slug)}
					<span class="guides__flag">{@render flag(stamp)}</span>
				{/each}
			</span>
			<h2 id="guides-heading" class="guides__title">{heading}</h2>
			<p class="guides__deck">{deck}</p>
		</div>

		<a class="guides__cta" href={GUIDES_HREF}>
			{cta}
			<svg width="20" height="10" viewBox="0 0 20 10" fill="none" aria-hidden="true">
				<path d="M0 5h18M14 1l4 4-4 4" stroke="currentColor" stroke-width="1.25" />
			</svg>
		</a>
	</div>
</section>

<style>
	/* Full-bleed: escape the content column to the viewport edges. The page-level
	   overflow-x: clip on .site-main absorbs the scrollbar gutter (same technique as
	   the Frontline band). The faint green wash is what separates the band from the
	   white editorial default — no hairline rules — while the saturated green band stays
	   rationed to one per page (Frontline). */
	.guides {
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		padding-block: clamp(2rem, 1.25rem + 2.5vw, 3rem);
		background: var(--surface-tint);
	}

	.guides__inner {
		max-width: var(--content-max);
		margin-inline: auto;
		padding-inline: var(--content-padding);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: clamp(1.5rem, 1rem + 3vw, 3rem);
	}

	/* Flags sit above the heading at every width — a passport/luggage-tag motif that
	   reads the same on desktop, tablet and phone. A slight gap separates the two
	   stamps so they read as a pair (Spain + Portugal). */
	.guides__flags {
		display: inline-flex;
		gap: 0.375rem;
		margin-bottom: var(--space-sm);
	}

	/* 1px-framed emblem, matching the country index. White fill keeps the stamp crisp
	   against the tinted band. */
	.guides__flag {
		width: 34px;
		height: 23px;
		display: inline-flex;
		border: 1px solid var(--border);
		background: var(--white);
		overflow: hidden;
	}

	.guides__flag :global(svg),
	.guides__flag img {
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
	}

	.guides__title {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h3);
		color: var(--green);
		line-height: 1.15;
	}

	.guides__deck {
		margin-top: 0.5rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.5;
		color: var(--muted);
		max-width: 52ch;
	}

	/* Text-link CTA (not a filled button): a strong-but-quiet pull that keeps the band
	   light. Arrow slides on hover; colour shifts green → gold. */
	.guides__cta {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		text-decoration: none;
		white-space: nowrap;
		transition: color var(--duration-hover) var(--ease);
	}

	.guides__cta svg {
		transition: transform var(--duration-hover) var(--ease);
	}

	.guides__cta:hover,
	.guides__cta:focus-visible {
		color: var(--gold);
	}

	.guides__cta:hover svg,
	.guides__cta:focus-visible svg {
		transform: translateX(4px);
	}

	@media (prefers-reduced-motion: reduce) {
		.guides__cta:hover svg,
		.guides__cta:focus-visible svg {
			transform: none;
		}
	}

	/* Stack on phones/tablets: flags → heading → deck → CTA. The CTA drops below the
	   text rather than crowding it. */
	@media (max-width: 720px) {
		.guides__inner {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-md);
		}
	}
</style>
