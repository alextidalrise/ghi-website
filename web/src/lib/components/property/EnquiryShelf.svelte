<script lang="ts">
	/**
	 * The enquiry shelf — the quiet half of the listing aside.
	 *
	 * It sits directly beneath the green EnquiryRail panel, inside the same `<aside>`, and
	 * exists for the reader who is not ready to enquire and would otherwise leave: it hands
	 * them the buying guide for this country and the specialists behind the purchase, and
	 * both lead back to a conversation.
	 *
	 * Two structural decisions, both load-bearing:
	 *
	 *  - It lives in the aside, NOT inside the green panel and NOT in the fixed mobile
	 *    console. That single placement is what gives it a sticky rail above 880px and an
	 *    inline strip below it, with no breakpoint-specific markup: the aside is just a grid
	 *    cell, so it linearises on its own. The mobile console stays two actions (WhatsApp,
	 *    email) — contact is persistent because contact is urgent; a buying guide is not.
	 *
	 *  - Hierarchy is carried by SURFACE, not by size. The panel is filled, gold-framed and
	 *    shadowed; the shelf is white, hairline-bracketed and flat. Emphasis Ladder tier 2
	 *    against the panel's tier 4, so the shelf can never be mistaken for the enquiry.
	 *
	 * The logos are deliberately inert. They are evidence ("these are the people"), not a
	 * fourth and fifth call to action in a subordinate block — each item gets exactly one.
	 */
	import type { EnquiryShelf } from '$lib/listing/enquiryShelf';

	type Props = {
		shelf?: EnquiryShelf | null;
	};

	let { shelf = null }: Props = $props();

	const guide = $derived(shelf?.guide ?? null);
	const partners = $derived(shelf?.partners ?? []);
</script>

{#snippet arrow()}
	<svg class="shelf__arrow" width="18" height="9" viewBox="0 0 18 9" fill="none" aria-hidden="true">
		<path d="M0 4.5h15.5M12 1l4 3.5-4 3.5" stroke="currentColor" stroke-width="1.25" />
	</svg>
{/snippet}

{#if guide || partners.length > 0}
	<div class="shelf">
		{#if guide}
			<section class="shelf__item" aria-labelledby="shelf-guide-heading">
				<h2 id="shelf-guide-heading" class="shelf__heading">Before you buy</h2>
				<!-- Fixed copy, deliberately not the guide's own tagline: the tagline is card
				     copy written for a wide grid, and it wraps to three lines in a 300px rail.
				     Fixed copy also gives the shelf a predictable height, which is what keeps
				     the whole aside inside the sticky window on a short laptop viewport. -->
				<p class="shelf__deck">The process, the costs and the tax, set out plainly.</p>
				<a class="shelf__cta" href={guide.href}>
					Read the guide
					{@render arrow()}
				</a>
			</section>
		{/if}

		{#if partners.length > 0}
			<section class="shelf__item" aria-labelledby="shelf-partners-heading">
				<h2 id="shelf-partners-heading" class="shelf__heading">The specialists</h2>

				<!-- No deck line here: the three captions below already read Mortgage, Currency
				     Exchange, Legal & Tax, so a sentence saying "the mortgage, currency and legal
				     advisers we work with" is the heading restated. The logos are inert by design
				     — they say who, and the single CTA says what to do. Presentational because the
				     caption carries the meaning; a bare logo adds nothing for a screen reader. -->
				<ul class="shelf__partners">
					{#each partners as partner (partner.slug)}
						<li class="shelf__partner">
							{#if partner.logo}
								<img
									class="shelf__logo"
									src={partner.logo.url}
									srcset={partner.logo.srcset}
									sizes="96px"
									alt=""
									loading="lazy"
									decoding="async"
								/>
							{:else}
								<span class="shelf__partner-name">{partner.name}</span>
							{/if}
							{#if partner.category}
								<span class="shelf__partner-category">{partner.category}</span>
							{/if}
						</li>
					{/each}
				</ul>

				<a class="shelf__cta" href="/contact">
					Request an introduction
					{@render arrow()}
				</a>
			</section>
		{/if}
	</div>
{/if}

<style>
	/*
	 * Bracketed top and bottom by the same hairline, with a rule between the two items —
	 * tier 2 on the Emphasis Ladder. No fill, no frame, no card: the green panel above is
	 * the only object in this column that gets weight, and the gap is what separates them.
	 */
	.shelf {
		margin-top: var(--space-lg);
		border-block: 1px solid var(--border);
	}

	.shelf__item {
		padding-block: var(--space-md);
	}

	.shelf__item + .shelf__item {
		border-top: 1px solid var(--border);
	}

	/* Serif, but a step below the panel's heading: the shelf is subordinate and the type
	   scale says so before the reader has read a word. */
	.shelf__heading {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h4);
		line-height: 1.2;
		color: var(--green);
	}

	.shelf__deck {
		margin-top: 0.4rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.5;
		color: var(--muted);
		text-wrap: pretty;
	}

	/* The house text-link idiom (BuyerGuides, TrustedPartners): green resolving to gold,
	   arrow sliding on hover. A filled button here would compete with the panel. */
	.shelf__cta {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		/* Comfortable tap target without bulking the quiet link. */
		min-height: 2.75rem;
		margin-top: 0.35rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.shelf__arrow {
		transition: transform var(--duration-hover) var(--ease);
	}

	.shelf__cta:hover,
	.shelf__cta:focus-visible {
		color: var(--gold);
	}

	.shelf__cta:hover .shelf__arrow,
	.shelf__cta:focus-visible .shelf__arrow {
		transform: translateX(4px);
	}

	.shelf__cta:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/*
	 * Three disciplines across, in a column that can be as narrow as 20rem. Each cell takes
	 * an equal third with `minmax(0, 1fr)` so a wide logo cannot steal width from its
	 * neighbours, and the row holds its shape whether it carries two specialists or three.
	 */
	.shelf__partners {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-sm);
		margin: var(--space-sm) 0 0;
		padding: 0;
		list-style: none;
	}

	.shelf__partner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		min-width: 0;
		text-align: center;
	}

	/* Muted at rest, exactly as the TrustedPartners wall reads. They do not resolve on
	   hover here because they are not interactive: nothing about them should invite a click. */
	.shelf__logo {
		max-width: 100%;
		max-height: 1.75rem;
		width: auto;
		height: auto;
		object-fit: contain;
		filter: grayscale(1);
		opacity: 0.75;
	}

	/* Stand-in when no logo has been uploaded, matching the partner wall's placeholder. */
	.shelf__partner-name {
		font-family: var(--sans);
		font-size: var(--text-small);
		font-weight: 500;
		line-height: 1.25;
		color: var(--charcoal);
	}

	/* The caption is the point: it turns three marks into three disciplines. */
	.shelf__partner-category {
		font-family: var(--sans);
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		line-height: 1.15;
		color: var(--muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.shelf__cta,
		.shelf__arrow {
			transition: none;
		}

		.shelf__cta:hover .shelf__arrow,
		.shelf__cta:focus-visible .shelf__arrow {
			transform: none;
		}
	}
</style>
