<script lang="ts">
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '$lib/sanity/image';
	import { insightKickerLabel } from '$lib/insights/categories';
	import {
		formatInsightDate,
		insightDateISO,
		readingLabel,
		splitTitleEmphasis
	} from '$lib/insights/format';
	import type { InsightDetail } from '$lib/insights/types';
	import InsightKicker from './InsightKicker.svelte';
	import InsightMeta from './InsightMeta.svelte';

	let {
		insight,
		breadcrumbs
	}: { insight: InsightDetail; breadcrumbs: BreadcrumbItem[] } = $props();

	const kicker = $derived(insightKickerLabel(insight.insightCategory));
	const titleParts = $derived(splitTitleEmphasis(insight.title, insight.titleEmphasis));

	// The opt-in launch treatment: headline and a square photograph in equal columns, the caption
	// overlaid on the image. The standard hero (narrow leading rail, 4:3 plate, caption below) stays
	// the default and is untouched. See the `heroLayout` field on the insight document.
	const isSplit = $derived(insight.heroLayout === 'splitSquare');
	// The partner-introduction treatment: the standfirst leads, then a full-width band runs a green
	// partner brand plate beside a landscape photograph. Distinct from both above.
	const isCoBrand = $derived(insight.heroLayout === 'coBrand');

	// Passing BOTH width and height fixes the crop ratio for every srcset candidate — with height
	// alone the builder emits a ragged, drifting set. Standard is 4:3 (1200×900); the split plate is
	// square (1200×1200); the co-brand photo is landscape (1200×750, 16:10) — it fills a wide cell
	// beside the brand plate. Candidates run to 1920w because the plate reaches ~850px on a wide
	// desktop and doubles on a 2× display; the source is 4096px, so these are real resolution.
	const cropHeight = $derived(isSplit ? 1200 : isCoBrand ? 750 : 900);
	const image = $derived(
		buildPublicImageUrl(insight.heroImage, { width: 1200, height: cropHeight, fit: 'crop', quality: 74 })
	);
	const srcset = $derived(
		buildImageSrcset(insight.heroImage, [480, 640, 800, 1024, 1280, 1600, 1920], {
			width: 1200,
			height: cropHeight,
			fit: 'crop',
			quality: 74
		})
	);
	// The plate's rendered width, mirrored for the browser's candidate pick and the preload. Stacked
	// it is the full viewport. Standard two-column: the rail (≤28rem), spilling into the gutter past
	// the content measure. Split two-column: one of two equal columns of the content measure, ≈ 33rem
	// at the 1060px cap. Understating this makes a small candidate stretch across the plate and go soft.
	const HERO_SIZES = $derived(
		isCoBrand
			? '(max-width: 57.99rem) 100vw, min(40rem, 60vw)'
			: isSplit
				? '(max-width: 57.99rem) 100vw, min(33rem, 46vw)'
				: '(max-width: 57.99rem) 100vw, (max-width: 66.99rem) 28rem, calc(210px + 25vw)'
	);
	const lqip = $derived(getImagePlaceholder(insight.heroImage));
	const alt = $derived(insight.heroImage?.altText?.trim() || insight.title || 'Insight');
	const caption = $derived(insight.heroCaption?.trim() || null);
	// The thesis note belongs to the standard hero's rail. The split hero has no room beneath a
	// square, full-column plate, and its launch design carries the point in the standfirst instead.
	const note = $derived(
		!isSplit && insight.heroNote?.heading?.trim() && insight.heroNote?.body?.trim()
			? { heading: insight.heroNote.heading.trim(), body: insight.heroNote.body.trim() }
			: null
	);
	const hasRail = $derived(Boolean(image || note));

	// Co-brand plate: the partner's name and logo (read live from the referenced partner), plus the
	// label under the name and the optional sub-label under the headline. Two plate treatments,
	// chosen by `heroPartnerPlate`:
	//   • green (default) — the partner's `logoAlt` (the light, reversed mark made for dark surfaces)
	//     shown as-is on the brand-green plate.
	//   • light — the partner's normal dark `logo` (the wall wordmark) on a light plate, for a partner
	//     whose approved logo is dark and needs a light ground to stay legible (e.g. Franke & de la
	//     Fuente). The light plate centres the dark logo above the name and label.
	// If the chosen logo is absent the plate runs name-only; if no partner is set at all the band
	// runs photo-only.
	const coBrandPlateLight = $derived(insight.heroPartnerPlate === 'light');
	const coBrandPartnerName = $derived(insight.heroPartner?.name?.trim() || null);
	const coBrandPartnerLabel = $derived(insight.heroPartnerLabel?.trim() || 'GHI Partner');
	// The green plate's reversed mark is compact (roughly square), so a 220-box fits it. The light
	// plate carries the partner's full wordmark, which is typically wide (Franke's is ~6.3:1) — fetch
	// it by width alone (no square box) so the source is crisp across the plate; `fit: 'max'` never
	// crops, and the CSS below sizes it at its natural aspect ratio.
	const coBrandLogo = $derived(
		buildPublicImageUrl(
			coBrandPlateLight ? insight.heroPartner?.logo : insight.heroPartner?.logoAlt,
			coBrandPlateLight
				? { width: 640, fit: 'max', quality: 90 }
				: { width: 220, height: 220, fit: 'max', quality: 90 }
		)
	);
	const coBrandLogoAlt = $derived(coBrandPartnerName ? `${coBrandPartnerName} logo` : '');
	const coBrandSublabel = $derived(insight.heroSublabel?.trim() || null);
	const hasCoBrandPlate = $derived(isCoBrand && Boolean(coBrandPartnerName || coBrandLogo));

	const dateLabel = $derived(formatInsightDate(insight.publishedAt, 'long'));
	const dateISO = $derived(insightDateISO(insight.publishedAt));
	const reading = $derived(readingLabel(insight));
</script>

<!-- Preload the hero so it stays a clean LCP: full width above the fold on mobile, and the leading
     plate on desktop. imagesizes mirrors the <img> sizes exactly so the preload fetches the same
     candidate the layout will use. -->
<svelte:head>
	{#if image && srcset}
		<link
			rel="preload"
			as="image"
			imagesrcset={srcset}
			imagesizes={HERO_SIZES}
			fetchpriority="high"
		/>
	{/if}
</svelte:head>

{#if isCoBrand}
	<!--
	  Co-brand hero — the partner-introduction treatment. The text column leads with the standfirst
	  (a step up from the standard deck), then a full-width band runs a green partner brand plate
	  beside a landscape photograph, with the caption below. No leading rail; the composition is the
	  band. Only engages when heroLayout === 'coBrand'.
	-->
	<header class="article-hero article-hero--cobrand">
		<div class="article-hero__text">
			{#if breadcrumbs.length > 0}
				<Breadcrumbs items={breadcrumbs} inline hideCurrent />
			{/if}

			<div class="article-hero__kicker"><InsightKicker label={kicker} /></div>

			{#if insight.subhead}
				<!-- Standfirst leads in the co-brand hero: a serif thesis line above the headline. -->
				<p class="article-hero__standfirst">{insight.subhead}</p>
			{/if}

			<h1 class="article-hero__title article-hero__title--cobrand">
				<!-- prettier-ignore -->
				{#each titleParts as part (part.text)}{#if part.emphasis}<em>{part.text}</em>{:else}{part.text}{/if}{/each}
			</h1>

			{#if coBrandSublabel}
				<p class="article-hero__sublabel">{coBrandSublabel}</p>
			{/if}

			<div class="article-hero__byline">
				<InsightMeta author={insight.author} {dateISO} {dateLabel} {reading} withAvatar />
			</div>
		</div>

		<div class="cobrand-band" class:cobrand-band--plated={hasCoBrandPlate}>
			{#if hasCoBrandPlate}
				<div class="cobrand-plate" class:cobrand-plate--light={coBrandPlateLight}>
					{#if coBrandLogo}
						<img
							class="cobrand-plate__logo"
							src={coBrandLogo}
							alt={coBrandLogoAlt}
							loading="eager"
							decoding="async"
						/>
					{/if}
					{#if coBrandPartnerName}
						<span class="cobrand-plate__name">{coBrandPartnerName}</span>
					{/if}
					<span class="cobrand-plate__label">{coBrandPartnerLabel}</span>
				</div>
			{/if}

			{#if image}
				<figure class="cobrand-figure">
					<div
						class="cobrand-figure__frame"
						style:background-image={lqip ? `url(${lqip})` : undefined}
					>
						<img
							src={image}
							srcset={srcset || undefined}
							sizes={HERO_SIZES}
							{alt}
							width="1200"
							height={cropHeight}
							loading="eager"
							fetchpriority="high"
							decoding="async"
						/>
					</div>
				</figure>
			{/if}
		</div>

		{#if caption}
			<p class="cobrand-caption">{caption}</p>
		{/if}
	</header>
{:else}
<div
	class="article-hero-band"
	class:article-hero-band--with-rail={hasRail}
	class:article-hero-band--split={isSplit}
>
<header
	class="article-hero"
	class:article-hero--with-rail={hasRail}
	class:article-hero--split={isSplit}
>
	<div class="article-hero__text">
		{#if breadcrumbs.length > 0}
			<Breadcrumbs items={breadcrumbs} inline hideCurrent />
		{/if}

		<div class="article-hero__kicker"><InsightKicker label={kicker} /></div>

		<h1 class="article-hero__title">
			<!-- prettier-ignore -->
			{#each titleParts as part (part.text)}{#if part.emphasis}<em>{part.text}</em>{:else}{part.text}{/if}{/each}
		</h1>

		{#if insight.subhead}
			<p class="article-hero__deck">{insight.subhead}</p>
		{/if}

		<div class="article-hero__byline">
			<InsightMeta author={insight.author} {dateISO} {dateLabel} {reading} withAvatar />
		</div>
	</div>

	{#if hasRail}
		<aside class="article-hero__rail">
			{#if image}
				<!-- Standard: a matted plate — the frame holds the photograph AND its caption below,
				     so the image reads as placed on the page. Split: a square plate with the caption
				     overlaid bottom-left in green, the launch-article treatment. -->
				<figure class="article-hero__media" class:article-hero__media--overlay={isSplit}>
					<div
						class="article-hero__frame"
						style:background-image={lqip ? `url(${lqip})` : undefined}
					>
						<img
							src={image}
							srcset={srcset || undefined}
							sizes={HERO_SIZES}
							{alt}
							width="1200"
							height={cropHeight}
							loading="eager"
							fetchpriority="high"
							decoding="async"
						/>
					</div>
					{#if caption && isSplit}
						<!-- Overlay caption: a direct child of the figure (a11y), positioned against it.
						     In the split the frame fills the figure, so the figure's bottom-left is the
						     image's bottom-left. -->
						<figcaption class="article-hero__caption article-hero__caption--overlay">
							{caption}
						</figcaption>
					{:else if caption}
						<figcaption class="article-hero__caption">{caption}</figcaption>
					{/if}
				</figure>
			{/if}

			{#if note}
				<!-- The article's thesis, stated before the reader scrolls. Styled as a display
				     line, not a heading: the section h2s own the document outline. -->
				<div class="article-hero__note">
					<p class="article-hero__note-heading">{note.heading}</p>
					<p class="article-hero__note-body">{note.body}</p>
				</div>
			{/if}
		</aside>
	{/if}
</header>
</div>
{/if}

<style>
	/*
	 * The band exists to carry the ground under the rail, full-bleed to the right edge.
	 * Without it the rail's white plates float on white and the composition has no
	 * architecture — the photograph reads as dropped in rather than placed.
	 *
	 * The wash is --surface-tint (the brand-green whisper), NOT the warm cream that was
	 * removed on 2026-06-01. Per the Emphasis Ladder this is the article page's one tint
	 * band (tier 2); the green CTA at the foot is still the page's one green (tier 4).
	 *
	 * The split is computed, not a magic percentage: it lands exactly halfway across the
	 * grid gap, on the rail's side. Everything is a % of the band, so there is no 100vw
	 * and no scrollbar-width overflow.
	 */
	.article-hero-band {
		/* The property plate leads the opening, so it earns real width on the desktop the brief is
		   about: 21rem where the two-column layout first appears (58rem, so the display headline is
		   never squeezed) growing to 28rem by ~1280px, where the old 21rem plate "sat small inside a
		   large pale panel". Linear between the two — the coefficient is exactly (28−21)rem across the
		   (80−58)rem span — so the image gains authority precisely as the viewport gives it room, and
		   the tint band (whose split is derived from this) widens with it. */
		--hero-rail: clamp(21rem, calc(21rem + (100vw - 58rem) * 0.318), 28rem);
		--hero-gap: clamp(2rem, 5vw, 4.5rem);
		--hero-split: calc(
			50% + min(var(--content-max), 100%) / 2 - var(--content-padding) - var(--hero-rail) -
				var(--hero-gap) / 2
		);
		border-block-end: 1px solid var(--border);
	}

	/* Was `.content-wrap`; inlined here so the two-column variant can break its right edge out of
	   the content measure (see the rail-extension rule below) while the stacked/no-rail hero stays
	   centred on the shared 1060px measure exactly like every section beneath it. */
	.article-hero {
		max-width: var(--content-max);
		margin-inline: auto;
		padding-inline: var(--content-padding);
		padding-block: var(--space-xl) var(--space-2xl);
		display: grid;
		gap: var(--hero-gap);
		align-items: start;
	}

	.article-hero__text {
		min-width: 0;
	}

	/* Rhythm, not a uniform stack: the kicker sits close to the headline it labels, the deck
	   gets air, and the byline is ruled off so the column closes on a line instead of
	   trailing away. */
	.article-hero__kicker {
		margin-top: var(--space-lg);
	}

	.article-hero__title {
		margin: var(--space-sm) 0 0;
		line-height: 1.04;
		letter-spacing: var(--tracking-display);
	}

	/* The one italic moment on the page. A step back in weight and colour as well as a
	   change of cut — it should read as the sentence turning, not as a second headline. */
	.article-hero__title em {
		font-style: italic;
		font-weight: 400;
		color: var(--green-soft);
	}

	/* The deck is set in the serif, not the body sans: it belongs to the headline. */
	.article-hero__deck {
		margin: var(--space-md) 0 0;
		font-family: var(--serif);
		font-size: clamp(1.25rem, 0.95rem + 1vw, 1.6rem);
		font-weight: 400;
		line-height: 1.32;
		color: var(--green);
		max-width: 40ch;
		text-wrap: pretty;
	}

	.article-hero__byline {
		margin-top: var(--space-lg);
		padding-top: var(--space-md);
		border-block-start: 1px solid var(--border);
	}

	.article-hero__rail {
		min-width: 0;
	}

	.article-hero__media {
		margin: 0;
		border: 1px solid var(--border);
		background: var(--white);
	}

	.article-hero__frame {
		aspect-ratio: 4 / 3;
		overflow: hidden;
		background: var(--green);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.article-hero__frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Inside the frame, under a hairline — a plate and its label. Set at the UI size (14px), not
	   the 12px fine-print size, so it stays comfortably readable at 390px without zoom while
	   remaining an understated editorial caption. --muted clears AA (~5.3:1) on the white plate. */
	.article-hero__caption {
		padding: 0.8rem 0.9rem;
		border-block-start: 1px solid var(--border);
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.55;
		color: var(--muted);
	}

	.article-hero__note {
		margin-top: var(--space-md);
		padding: var(--space-lg);
		border: 1px solid var(--border);
		background: var(--white);
	}

	.article-hero__note-heading {
		margin: 0 0 var(--space-xs);
		font-family: var(--serif);
		font-size: var(--text-h3);
		font-weight: 400;
		line-height: 1.16;
		color: var(--green);
		text-wrap: balance;
	}

	.article-hero__note-body {
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.6;
		color: var(--muted);
	}

	/* Stacked: the photograph goes wide and shallow so the headline and deck still clear the
	   fold. A 4:3 plate at full width would push the byline off the first screen. */
	@media (max-width: 57.99rem) {
		.article-hero__frame {
			aspect-ratio: 16 / 10;
		}
	}

	/* The text column leads and the rail supports: the headline needs the room, and a rail
	   wider than its own content just floats. Hence a fixed rail, not a fraction — and a
	   two-column threshold high enough that a 21rem rail never squeezes the display type
	   (at 52rem the column fell to 373px and the headline started stacking word by word).
	   Stacked, there is no rail to ground, so the wash stays off and the hero is all white. */
	@media (min-width: 58rem) {
		.article-hero--with-rail:not(.article-hero--split) {
			grid-template-columns: minmax(0, 1fr) var(--hero-rail);
		}

		.article-hero-band--with-rail:not(.article-hero-band--split) {
			background: linear-gradient(
				90deg,
				var(--white) 0 var(--hero-split),
				var(--surface-tint) var(--hero-split) 100%
			);
		}
	}

	/*
	 * Once the viewport clears the 1060px content measure there is a real gutter, and the property
	 * plate spills into the right side of it while everything else stays on the measure.
	 *
	 * `--hero-gutter` is the whitespace to the right of the plate today: the outer margin between
	 * the content box and the viewport edge (`--edge`) plus the content padding. We fill
	 * `--hero-gutter-fill` of it — the right padding keeps the rest, so the grid's right edge lands
	 * that far into the gutter.
	 *
	 * The text column is pinned to the width it has on the content measure
	 * (content-max − 2·padding − gap − rail; all fixed lengths here since padding is capped at this
	 * width), and the rail is the flexible column, so the whole extension is absorbed by the plate:
	 * the text column doesn't move and the rail's LEFT edge is unchanged, which keeps the tint split
	 * (computed from the same measure) meeting the gap exactly. `--edge` is only ever read inside
	 * padding here — never inside `grid-template-columns` — because a `%` in a track resolves against
	 * the grid box, not the viewport, which would mis-size the rail.
	 *
	 * Tune the reach with `--hero-gutter-fill` (0 = today, 1 = plate meets the viewport edge).
	 */
	@media (min-width: 67rem) {
		.article-hero--with-rail:not(.article-hero--split) {
			--hero-gutter-fill: 0.5;
			--edge: max(0px, calc((100% - var(--content-max)) / 2));
			--hero-gutter: calc(var(--edge) + var(--content-padding));
			max-width: none;
			margin-inline: 0;
			padding-left: var(--hero-gutter);
			padding-right: calc(var(--hero-gutter) * (1 - var(--hero-gutter-fill)));
			grid-template-columns:
				calc(
					var(--content-max) - 2 * var(--content-padding) - var(--hero-gap) - var(--hero-rail)
				)
				minmax(0, 1fr);
		}
	}

	/*
	 * Split-square hero — the opt-in launch treatment. The headline and a square photograph share
	 * two equal columns; the caption overlays the image bottom-left in green; the tint band stays
	 * off (white ground, hairline foot only). The standard hero above is untouched by default: this
	 * whole block only engages when `heroLayout === 'splitSquare'`.
	 */
	.article-hero--split {
		align-items: center;
	}

	/* No mat and no border in the split — the plate is the composition, with only its overlay
	   caption on it. */
	.article-hero--split .article-hero__media {
		border: 0;
		background: none;
	}

	/* Square at every width; v15 keeps the plate 1:1 on mobile too. The class-pair specificity
	   (0,2,0) beats the stacked 16/10 element+class override above regardless of source order. */
	.article-hero--split .article-hero__frame {
		aspect-ratio: 1 / 1;
	}

	/* The launch headline turns onto its own line for the italic phrase — "…in Portugal:" then
	   a dropped, italic "Golf Property Across the Algarve" beneath it. Scoped to the split hero so
	   the standard hero keeps its inline mid-sentence emphasis. A touch smaller than the roman line
	   so it reads as the sentence continuing, not a second headline (matches v15's `h1 em`). */
	.article-hero--split .article-hero__title em {
		display: block;
		font-size: 0.92em;
		margin-top: 0.08em;
	}

	.article-hero__media--overlay {
		position: relative;
	}

	/* Bottom-left green overlay caption. Later in source than `.article-hero__caption` (same
	   specificity), so it overrides the standard below-frame padding/border/colour. */
	.article-hero__caption--overlay {
		position: absolute;
		left: 0;
		bottom: 0;
		margin: 0;
		padding: 0.6rem 0.85rem;
		border: 0;
		background: var(--green);
		color: var(--on-green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.4;
	}

	@media (min-width: 58rem) {
		.article-hero--split {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}

	/*
	 * Co-brand hero — a single stacked column: the standfirst-led text block, then a full-width
	 * band of the brand plate beside the photograph, then the caption. No tint band and no leading
	 * rail; the plate is the one green object up here (the closing enquiry band remains the page's
	 * green punctuation — this plate is a brand lockup, not a CTA).
	 */
	.article-hero--cobrand {
		display: block;
		max-width: var(--content-max);
		margin-inline: auto;
		padding-inline: var(--content-padding);
		padding-block: var(--space-xl) var(--space-2xl);
	}

	/* The standfirst sits above the headline here and reads a step larger than the standard deck —
	   it is doing the deck's job of stating the piece, but leading rather than trailing. */
	.article-hero__standfirst {
		margin: var(--space-md) 0 0;
		font-family: var(--serif);
		font-size: clamp(1.35rem, 1rem + 1.3vw, 1.85rem);
		font-weight: 400;
		line-height: 1.3;
		color: var(--green);
		max-width: 34ch;
		text-wrap: pretty;
	}

	.article-hero__title--cobrand {
		margin-top: var(--space-md);
	}

	/* The partner-insight marker under the headline. */
	.article-hero__sublabel {
		margin: var(--space-md) 0 0;
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	/* The brand band: on desktop the plate and photo share a row, the plate a fixed square-ish
	   column and the photo filling the rest at equal height. Stacked on mobile (plate over photo). */
	.cobrand-band {
		margin-top: var(--space-xl);
		display: grid;
		gap: 0;
	}

	.cobrand-plate {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		padding: clamp(1.75rem, 5vw, 3rem);
		min-height: 14rem;
		background: var(--green);
		color: var(--on-green);
		text-align: center;
	}

	/* The reversed partner mark (`logoAlt`) is already light, so it sits on the green plate as-is —
	   no knock-out filter. Sized generously; the mark is the plate's focal object. */
	.cobrand-plate__logo {
		width: auto;
		height: clamp(3.5rem, 9vw, 5.5rem);
		max-width: 78%;
		object-fit: contain;
	}

	.cobrand-plate__name {
		font-family: var(--serif);
		font-size: var(--text-h3);
		line-height: 1.15;
		color: var(--on-green);
	}

	.cobrand-plate__label {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--gold);
	}

	/* Light plate: the partner's normal dark logo on a white plate with a hairline frame, so a dark
	   approved logo (e.g. Franke & de la Fuente) reads at full contrast instead of being lost on the
	   brand green. The logo is dark already, so it is shown as-is — no knock-out. Name in green and
	   label in --muted (clears AA on white); --gold would fail contrast here. */
	.cobrand-plate--light {
		background: var(--white);
		border: 1px solid var(--border);
		color: var(--charcoal);
	}

	.cobrand-plate--light .cobrand-plate__name {
		color: var(--green);
	}

	.cobrand-plate--light .cobrand-plate__label {
		color: var(--muted);
	}

	/* The light plate carries a wide wordmark (Franke's lockup is ~6.3:1), not the green plate's
	   compact reversed mark. Size it by WIDTH at its natural aspect ratio — spanning the plate with a
	   capped height — rather than the fixed-height, square-ish sizing above, which boxes a wide logo
	   into a cropped-looking sliver. `height: auto` + the two maxes let the image keep its own ratio. */
	.cobrand-plate--light .cobrand-plate__logo {
		width: auto;
		height: auto;
		max-width: min(90%, 20rem);
		max-height: 4.25rem;
	}

	.cobrand-figure {
		margin: 0;
	}

	.cobrand-figure__frame {
		aspect-ratio: 16 / 10;
		overflow: hidden;
		background: var(--green);
		background-size: cover;
		background-position: center;
	}

	.cobrand-figure__frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.cobrand-caption {
		margin: var(--space-md) 0 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.55;
		color: var(--muted);
	}

	/* Desktop: plate + photo share a row at equal height. `align-items: stretch` (grid default)
	   lets the plate match the photo's height, so the band reads as one object. */
	@media (min-width: 46rem) {
		.cobrand-band--plated {
			grid-template-columns: minmax(0, 22rem) minmax(0, 1fr);
		}

		/* When the plate stretches to the photo's height its own min-height is irrelevant. */
		.cobrand-band--plated .cobrand-plate {
			min-height: 0;
		}

		/* The photo defines the row height; the plate stretches to it. */
		.cobrand-band--plated .cobrand-figure {
			display: flex;
		}

		.cobrand-band--plated .cobrand-figure__frame {
			flex: 1;
			aspect-ratio: auto;
		}
	}
</style>
