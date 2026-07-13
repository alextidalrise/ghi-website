<script lang="ts">
	import { shouldShowAggregate } from '$lib/reviews/gates';
	import type { ReviewsData } from '$lib/reviews';
	import GoogleMark from './GoogleMark.svelte';
	import ReviewPanel from './ReviewPanel.svelte';
	import Stars from './Stars.svelte';

	type Props = {
		data: ReviewsData | null;
		heading?: string;
		deck?: string;
		/**
		 * Set when the band sits directly beneath another full-bleed band (on the homepage,
		 * the green Frontline band). Per the Emphasis Ladder's stacking rule, full-bleed
		 * bands butt flush — the band above already has its own padding, and its bottom edge
		 * is the divider, so this band drops both the page's section-gap and its own now
		 * redundant top rule. Without it you get a stray hairline marooned in dead white.
		 */
		flushTop?: boolean;
	};

	let {
		data,
		heading = 'From keys-in-hand buyers',
		deck = "Real reviews from people who've bought golf property with us in Spain and Portugal.",
		flushTop = false
	}: Props = $props();

	const showAggregate = $derived(data ? shouldShowAggregate(data) : false);

	/**
	 * The hero quote is chosen for *fit*, not just order. Set at display scale, a six-word
	 * review looks thin and a four-thousand-character one truncates mid-sentence — and we
	 * can't edit either, so the layout has to choose rather than crop. This picks the
	 * highest-rated review whose length sits nearest a comfortable pull-quote, which is a
	 * display decision, not an edit: the text is untouched and every other review still
	 * shows in the rail.
	 *
	 * The target is deliberately short. A good pull quote is one or two sentences; at ~200
	 * characters the hero ran to six lines on a phone and clipped mid-word, which is the one
	 * place truncation is unforgivable. ~150 fits whole at every width.
	 */
	const HERO_IDEAL = 150;
	const HERO_MAX = 280;

	const featured = $derived.by(() => {
		if (!data?.reviews.length) return null;
		const fits = data.reviews.filter((r) => r.text.length <= HERO_MAX && r.rating >= 4);
		const pool = fits.length ? fits : data.reviews;
		return pool.reduce((best, r) =>
			Math.abs(r.text.length - HERO_IDEAL) < Math.abs(best.text.length - HERO_IDEAL) ? r : best
		);
	});

	/** Everything the hero didn't take. The hero is never repeated in the rail. */
	const rest = $derived(data ? data.reviews.filter((r) => r.id !== featured?.id) : []);

	const heroWhen = $derived.by(() => {
		const d = new Date(featured?.publishedAt ?? '');
		return Number.isNaN(d.getTime())
			? ''
			: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
	});

	const heroInitial = $derived(featured?.authorName.trim().charAt(0).toUpperCase() ?? '?');

	let railEl = $state<HTMLDivElement>();
	/** Controls stay hidden until we know the rail actually overflows — so three reviews on
	    a wide screen don't get a pair of permanently-dead arrows. Also means no-JS gets a
	    natively-scrollable rail and no broken furniture. */
	let overflowing = $state(false);
	let atStart = $state(true);
	let atEnd = $state(false);
	let active = $state(0);
	/**
	 * Scroll *positions*, not reviews. The rail advances one panel at a time but shows
	 * several, so nine reviews across three visible panels is seven stops, not nine — one
	 * tick per review would strand ticks that can never become active. Derived from the
	 * measured scroll range, because how many panels fit changes with the breakpoint.
	 */
	let pages = $state(1);

	/** One panel plus one gap: the distance the arrows advance and the unit the position
	    ticks count in. Measured from the DOM so it stays correct across every breakpoint
	    without duplicating the clamp() column widths in JS. */
	function step(): number {
		const list = railEl?.firstElementChild as HTMLElement | null;
		const first = list?.firstElementChild as HTMLElement | null;
		if (!list || !first) return 0;
		const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0;
		return first.offsetWidth + gap;
	}

	function measure() {
		if (!railEl) return;
		const max = railEl.scrollWidth - railEl.clientWidth;
		overflowing = max > 4;
		atStart = railEl.scrollLeft <= 4;
		atEnd = railEl.scrollLeft >= max - 4;

		const s = step();
		// Both counts round the same way, so the final stop always lands on the final tick
		// even when the scroll range isn't a whole number of panels.
		pages = s ? Math.round(max / s) + 1 : 1;
		active = s ? Math.min(Math.round(railEl.scrollLeft / s), pages - 1) : 0;
	}

	function page(direction: 1 | -1) {
		if (!railEl) return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		railEl.scrollBy({
			left: direction * (step() || railEl.clientWidth),
			behavior: reduced ? 'auto' : 'smooth'
		});
	}

	$effect(() => {
		if (!railEl) return;
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(railEl);
		return () => observer.disconnect();
	});
</script>

{#if data}
	<!-- Emphasis Ladder, tier 2: a full-bleed white band, ruled. The homepage has already
	     spent its one green band (Frontline) and its one --surface-tint wash (the buyer-guide
	     signpost), so this band can't buy attention with a new surface — it has to earn it
	     with composition. Hence the shape: a broadsheet, not a card grid. One buyer's
	     sentence set large enough to stop a scroll, the score as a statement rather than a
	     corner stat, and the remaining proof browsable underneath. No frames anywhere; the
	     hairlines do all the dividing. -->
	<section class="reviews" class:reviews--flush-top={flushTop} aria-labelledby="reviews-heading">
		<div class="reviews__inner">
			<div class="reviews__head">
				<div class="reviews__intro">
					<h2 id="reviews-heading" class="reviews__title">{heading}</h2>
					<p class="reviews__deck">{deck}</p>
				</div>

				{#if showAggregate}
					<!-- The score and the Google mark are one object. Attribution is the trust
					     signal here, not a compliance footnote, so it gets the anchor position and
					     real scale rather than being tucked under the rail in grey 11px type. -->
					<div class="reviews__score">
						<p class="reviews__average">
							{data.averageRating.toFixed(1)}<span class="reviews__outof">/ 5</span>
						</p>
						<Stars rating={data.averageRating} size="lg" label="{data.averageRating} out of 5" />
						<p class="reviews__count">
							<GoogleMark size={15} />
							{data.totalCount} reviews on Google
						</p>
					</div>
				{/if}
			</div>

			{#if featured}
				<!-- The focal point. A single buyer's sentence at display scale is the one thing
				     in this band that can stop a scroll; three 17px cards never could. -->
				<figure class="reviews__hero">
					<Stars rating={featured.rating} size="lg" label="{featured.rating} out of 5" />

					<blockquote class="reviews__hero-quote">
						<p>{featured.text}</p>
					</blockquote>

					<figcaption class="reviews__hero-by">
						{#if featured.authorPhotoUrl}
							<img
								class="reviews__hero-avatar"
								src={featured.authorPhotoUrl}
								alt=""
								width="48"
								height="48"
								loading="lazy"
								decoding="async"
								referrerpolicy="no-referrer"
							/>
						{:else}
							<span class="reviews__hero-avatar reviews__hero-avatar--monogram" aria-hidden="true"
								>{heroInitial}</span
							>
						{/if}
						<span class="reviews__hero-who">
							<cite class="reviews__hero-name">{featured.authorName}</cite>
							{#if heroWhen}
								<span class="reviews__hero-when">{heroWhen}</span>
							{/if}
						</span>
					</figcaption>
				</figure>
			{/if}

			<!-- The scroll container is a labelled, focusable region wrapping the list. The
			     panels contain no links, so without a focus stop here a keyboard user could
			     never reach review four — the arrows alone don't help someone driving the
			     page from the keyboard mid-rail.

			     The a11y rule below is wrong in this specific case and is suppressed
			     deliberately: WCAG 2.1.1 requires a scrollable region to be reachable by
			     keyboard, and tabindex="0" on a role="region" with an accessible name is the
			     prescribed remedy. Obeying the linter here would fail the success criterion. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				class="reviews__viewport"
				bind:this={railEl}
				onscroll={measure}
				tabindex="0"
				role="region"
				aria-label="Reviews, scrollable"
			>
				<ul class="reviews__rail">
					{#each rest as review, i (review.id)}
						<li class="reviews__item" style="--reveal-delay: {i * 70}ms">
							<!-- Frameless. A boxed panel here would be a card grid competing with the
							     hero quote above it; a hairline in the gutter divides them instead. -->
							<ReviewPanel {review} bare lines={5} />
						</li>
					{/each}
				</ul>
			</div>

			<div class="reviews__foot" class:reviews__foot--bare={!overflowing}>
				{#if overflowing}
					<div class="reviews__nav">
						<button
							type="button"
							class="reviews__arrow"
							onclick={() => page(-1)}
							disabled={atStart}
							aria-label="Previous reviews"
						>
							<svg width="17" height="10" viewBox="0 0 17 10" fill="none" aria-hidden="true">
								<path d="M17 5H1.5M5 1L1 5l4 4" stroke="currentColor" stroke-width="1.25" />
							</svg>
						</button>
						<button
							type="button"
							class="reviews__arrow"
							onclick={() => page(1)}
							disabled={atEnd}
							aria-label="More reviews"
						>
							<svg width="17" height="10" viewBox="0 0 17 10" fill="none" aria-hidden="true">
								<path d="M0 5h15.5M12 1l4 4-4 4" stroke="currentColor" stroke-width="1.25" />
							</svg>
						</button>
					</div>

					<!-- Position, not a control. Duplicating the arrows as extra tab stops would
					     clutter the keyboard path for no gain. -->
					<ol class="reviews__ticks" aria-hidden="true">
						{#each { length: pages } as _, i (i)}
							<li class="reviews__tick" class:is-active={i === active}></li>
						{/each}
					</ol>
				{/if}

				{#if data.reviewsUrl}
					<a
						class="reviews__all"
						href={data.reviewsUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						Read all reviews
						<svg width="18" height="9" viewBox="0 0 18 9" fill="none" aria-hidden="true">
							<path d="M0 4.5h15.5M12 1l4 3.5-4 3.5" stroke="currentColor" stroke-width="1.25" />
						</svg>
					</a>
				{/if}
			</div>
		</div>
	</section>
{/if}

<style>
	/* Full-bleed to the viewport edges; .site-main's overflow-x: clip absorbs the scrollbar
	   gutter (the same technique Frontline and the buyer-guide band use). */
	/* Generous vertical padding is doing real work here, not decoration: with no surface
	   change available, air is the only thing that tells the eye a new movement has begun. */
	.reviews {
		/* Frameless columns need a wider gutter than boxed cards did: the hairline sits in
		   the middle of it, and the text either side needs to clear the rule comfortably. */
		--rail-gap: clamp(1.75rem, 1rem + 2vw, 3rem);

		width: 100vw;
		margin-inline: calc(50% - 50vw);
		padding-block: clamp(3.25rem, 2rem + 4vw, 5.5rem);
		border-block: 1px solid var(--border);
		background: var(--white);
	}

	/* The band owns its own rules; the *page* owns the rhythm between bands (and says so —
	   `.home-content > * { margin-block: 0 }` deliberately outranks any band's margin). So
	   this drops the redundant rule only, and the homepage closes the gap on its side. */
	.reviews--flush-top {
		border-top: none;
	}

	.reviews__inner {
		max-width: var(--content-max);
		margin-inline: auto;
		padding-inline: var(--content-padding);
	}

	.reviews__head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: clamp(1.5rem, 1rem + 3vw, 3.5rem);
		margin-bottom: var(--space-lg);
	}

	.reviews__title {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h2);
		color: var(--green);
		line-height: 1.1;
	}

	.reviews__deck {
		margin-top: var(--space-xs);
		max-width: 46ch;
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.5;
		color: var(--muted);
	}

	/* No box, no fill, no radius — and no rule either. At display scale the number holds its
	   own corner on whitespace alone; a divider beside it only added fuss. The rule below the
	   header already separates the masthead from the quote, so this one was doing nothing. */
	.reviews__score {
		flex: none;
		display: grid;
		justify-items: end;
		gap: 0.4rem;
		text-align: right;
	}

	/* The single most persuasive number on the page. It gets display scale, not stat-box
	   scale — but it stays typographic (no fill, no box, no radius), so it reads as a
	   statement rather than the SaaS hero-metric tile. */
	.reviews__average {
		font-family: var(--serif);
		font-weight: 600;
		font-size: clamp(2.75rem, 2rem + 2.4vw, 4rem);
		line-height: 1;
		color: var(--green);
		font-feature-settings: 'tnum';
	}

	.reviews__outof {
		margin-left: 0.15em;
		font-weight: 400;
		font-size: 0.45em;
		color: var(--muted);
	}

	.reviews__count {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--muted);
		font-feature-settings: 'tnum';
	}

	/* Same scroll-snap idiom as ListingRail, retuned for text panels: wider columns, equal
	   heights. It owns its own rail rather than reusing that component because the arrows
	   and the position ticks need a handle on the scroll container. */
	/* ── The hero quote ─────────────────────────────────────────────────────────────────
	   Separated from the header by a full-width rule, so the band reads as a broadsheet:
	   masthead, then the lead. */
	.reviews__hero {
		margin: 0;
		margin-top: clamp(2rem, 1.5rem + 1.5vw, 3rem);
		padding-top: clamp(2rem, 1.5rem + 1.5vw, 3rem);
		border-top: 1px solid var(--border);
	}

	.reviews__hero-quote {
		margin: var(--space-md) 0 0 -0.4em;
	}

	/* The whole point of the redesign. Playfair at display scale, on a deliberately narrow
	   measure (~40ch) so the line breaks read as a pull quote rather than a paragraph. The
	   featured review is picked to fit this at full length; the clamp is only a backstop for
	   a profile where every review happens to be enormous. */
	.reviews__hero-quote p {
		max-width: 40ch;
		padding-left: 0.4em;
		text-indent: -0.4em;
		font-family: var(--serif);
		font-weight: 400;
		font-size: clamp(1.375rem, 1rem + 1.6vw, 2.125rem);
		line-height: 1.35;
		color: var(--green);
		text-wrap: pretty;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 6;
		line-clamp: 6;
		overflow: hidden;
	}

	.reviews__hero-quote p::before {
		content: '\201C';
	}

	.reviews__hero-quote p::after {
		content: '\201D';
	}

	.reviews__hero-by {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-top: var(--space-lg);
	}

	.reviews__hero-avatar {
		flex: none;
		width: 48px;
		height: 48px;
		border: 1px solid var(--border);
		background: var(--white);
		object-fit: cover;
	}

	.reviews__hero-avatar--monogram {
		display: grid;
		place-items: center;
		font-family: var(--serif);
		font-size: 1.375rem;
		color: var(--green);
	}

	.reviews__hero-who {
		display: grid;
		min-width: 0;
	}

	.reviews__hero-name {
		font-family: var(--sans);
		font-size: 1rem;
		font-weight: 400;
		font-style: normal;
		color: var(--green);
	}

	.reviews__hero-when {
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--muted);
	}

	/* ── The supporting rail ────────────────────────────────────────────────────────────
	   A second rule sets the browsable proof apart from the lead.

	   No max-width. It's a block element, so it already fills its column and can't be blown
	   out by the max-content grid inside it — and a max-width:100% would fight the negative
	   margins below, clamping the rail back inside the gutter and killing the peek that
	   tells a phone user there's more to swipe. */
	.reviews__viewport {
		min-width: 0;
		margin-top: clamp(2rem, 1.5rem + 1.5vw, 3rem);
		border-top: 1px solid var(--border);
		overflow-x: auto;
		overflow-y: hidden;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior-x: contain;
		scrollbar-width: none;
		/* Top: the rule's breathing room. Bottom: room for the focus ring, which the
		   overflow would otherwise crop. */
		padding-block: clamp(1.75rem, 1.25rem + 1.5vw, 2.5rem) 0.25rem;
	}

	.reviews__viewport::-webkit-scrollbar {
		display: none;
	}

	.reviews__viewport:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 4px;
	}

	.reviews__rail {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: clamp(15rem, 23vw, 19rem);
		gap: var(--rail-gap);
		margin: 0;
		padding: 0;
		list-style: none;
		width: max-content;
	}

	.reviews__item {
		position: relative;
		min-width: 0;
		scroll-snap-align: start;
	}

	/* The divider lives in the gutter, as a pseudo-element centred in the gap — not as a
	   border on the item. A border would hug one column and leave every item a different
	   width, which would quietly break the arrow/tick step measurement. */
	.reviews__item + .reviews__item::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: calc(-0.5 * var(--rail-gap));
		width: 1px;
		background: var(--border);
	}

	.reviews__foot {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-top: var(--space-lg);
	}

	/* With nothing to scroll, the link is the only thing left — send it to the right rather
	   than leaving it stranded under the first panel. */
	.reviews__foot--bare {
		justify-content: flex-end;
	}

	.reviews__nav {
		display: flex;
		gap: var(--space-xs);
	}

	/* Square, hairline, generous hit area — the demographic is older and PRODUCT.md asks
	   for touch targets sized for comfort rather than for minimum compliance. */
	.reviews__arrow {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		border: 1px solid var(--border);
		background: var(--white);
		color: var(--green);
		cursor: pointer;
		transition:
			border-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.reviews__arrow:hover:not(:disabled),
	.reviews__arrow:focus-visible {
		border-color: var(--green);
	}

	.reviews__arrow:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.reviews__arrow:disabled {
		color: var(--border);
		cursor: default;
	}

	.reviews__ticks {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.reviews__tick {
		width: 1.25rem;
		height: 2px;
		background: var(--border);
		transition: background var(--duration-hover) var(--ease);
	}

	.reviews__tick.is-active {
		background: var(--gold);
	}

	.reviews__all {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		flex: none;
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

	.reviews__all svg {
		transition: transform var(--duration-hover) var(--ease);
	}

	.reviews__all:hover,
	.reviews__all:focus-visible {
		color: var(--gold);
	}

	.reviews__all:hover svg,
	.reviews__all:focus-visible svg {
		transform: translateX(4px);
	}

	@media (max-width: 860px) {
		.reviews__head {
			flex-direction: column;
			gap: var(--space-md);
		}

		/* Stacked, the score simply reads left under the heading — no rule between them. They
		   are one masthead, and a hairline there split it into two things that looked
		   unrelated. The head's own gap is the separation. */
		.reviews__score {
			justify-items: start;
			text-align: left;
			width: 100%;
		}
	}

	/* Phones: a full-width panel with the next one peeking, matching the listing rails. The
	   viewport bleeds into the page gutter so a whole panel is usable at 390px.

	   The band also gets deliberately tighter here. With the hero quote added it had become
	   the tallest section on the homepage — taller than the flagship listing rail — which is
	   the wrong weight for a supporting trust band on a phone. The rules keep their job but
	   stop hoarding space, and both quotes give back a line. */
	@media (max-width: 767px) {
		.reviews {
			padding-block: 2.75rem;
		}

		.reviews__hero {
			margin-top: 1.5rem;
			padding-top: 1.5rem;
		}

		/* Roomy enough that a well-chosen hero never clips — this is the one quote on the
		   page that must be read whole. The clamp survives only as a backstop against a
		   profile where every single review is enormous. */
		.reviews__hero-quote p {
			-webkit-line-clamp: 7;
			line-clamp: 7;
		}

		.reviews__hero-by {
			margin-top: var(--space-md);
		}

		.reviews__viewport {
			margin-top: 1.5rem;
			padding-block: 1.5rem 0.25rem;
			margin-inline: calc(-1 * var(--content-padding));
			padding-inline: var(--content-padding);
			scroll-padding-inline-start: var(--content-padding);
		}

		.reviews__rail {
			grid-auto-columns: clamp(15rem, 78vw, 19rem);
		}

		.reviews__foot {
			margin-top: var(--space-md);
		}

		.reviews__ticks {
			display: none;
		}

		.reviews__all {
			letter-spacing: 0.02em;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.reviews__item {
			opacity: 0;
			transform: translateY(16px);
			animation: review-reveal 0.6s var(--ease) forwards;
			animation-delay: var(--reveal-delay, 0ms);
		}

		@keyframes review-reveal {
			to {
				opacity: 1;
				transform: none;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reviews__all:hover svg,
		.reviews__all:focus-visible svg {
			transform: none;
		}
	}
</style>
