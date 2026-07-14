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
	 * The specialists are set as type, not as logos. Three third-party logos in a 300px rail
	 * import three foreign typefaces, three optical weights and their own embedded
	 * sub-lockups ("FINANCE & LEGAL" beneath a firm this shelf labels "Mortgage") into a
	 * system built on two fonts and a hairline — which is precisely why the row read as
	 * noise. The logo wall keeps its place on /partners and /contact, where it has the room
	 * to be one. Here the names are the evidence and the disciplines are the information.
	 *
	 * Both items carry exactly one action. Nothing else in this block is clickable.
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

				<!-- A typeset index, not a logo wall. The discipline is what the buyer needs; the
				     firm is the evidence behind it. A definition list says exactly that, and it is
				     the same shape KeyFacts uses for a label and its value. -->
				<dl class="shelf__specialists">
					{#each partners as partner (partner.slug)}
						{#if partner.discipline}
							<dt class="shelf__discipline">{partner.discipline}</dt>
						{/if}
						<dd class="shelf__firm" class:shelf__firm--full={!partner.discipline}>
							{partner.name}
						</dd>
					{/each}
				</dl>

				<!-- To the network, not straight to an enquiry. Three of the specialists are named
				     above; /partners is where the rest of them are, each with its own introduction
				     request. "Request an introduction" is that page's CTA (and the form's heading on
				     /contact) — reusing it here would put the same label on both ends of one funnel
				     and promise a form that isn't at the other end of the click. -->
				<a class="shelf__cta" href="/partners">
					See the full network
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

	/* Compact on purpose. The shelf shares a sticky window with the enquiry panel above it,
	   and every pixel spent here is a pixel of the second item's link pushed below the fold
	   on a short laptop. Tight also reads as an index rather than a section. */
	.shelf__item {
		padding-block: var(--space-sm);
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

	/* One rhythm for both items: heading, a beat, the substance, the link. The deck line and
	   the specialist index are the same rung of the same ladder, so they sit the same
	   distance below their heading. */
	.shelf__deck {
		margin-top: var(--space-xs);
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.5;
		color: var(--muted);
		text-wrap: pretty;
	}

	/* The house text-link idiom (BuyerGuides, TrustedPartners): green resolving to gold,
	   arrow sliding on hover. A filled button here would compete with the panel. */
	/*
	 * The 2.75rem box is the tap target, and its own half-leading is the gap: the link text
	 * sits centred with ~12px of clear space above it, which is the beat this block wants.
	 * A margin on top of that just double-counts and pushes the link toward the fold.
	 */
	.shelf__cta {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		min-height: 2.75rem;
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
	 * The specialist index. Two columns on one implicit grid, so the discipline column takes
	 * its width from the longest label and every firm name starts on the same axis — the
	 * alignment is structural, not a number someone has to keep in sync.
	 *
	 * `align-items: baseline` sits the 11px label on the same baseline as the 14px name, so
	 * each row reads as one line rather than two things that happen to be adjacent.
	 */
	.shelf__specialists {
		display: grid;
		grid-template-columns: auto 1fr;
		column-gap: var(--space-sm);
		row-gap: var(--space-xs);
		align-items: baseline;
		/*
		 * --space-xs plus a 4px optical correction, not a fourth step on the scale. The deck
		 * line above is 14px prose at line-height 1.5, which carries 3.5px of half-leading
		 * above its first glyph; this row is an 11px label at 1.2, which carries barely 1px.
		 * Matched box margins therefore render as unmatched ink gaps, and the firm name — the
		 * line the eye actually lands on — sat a pixel tighter under its heading than the deck
		 * did. This equalises the ink and gives the block the extra beat three rows need.
		 */
		margin: 0.75rem 0 0;
	}

	/* The discipline is the information: it is what the buyer is actually looking for, and
	   it uses the same micro-label the listing's key facts use. */
	.shelf__discipline {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		line-height: 1.2;
		color: var(--muted);
	}

	/* The firm is the evidence. Charcoal, not green: green is this column's link colour and
	   these names are not links. */
	.shelf__firm {
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		/* Regular, not the body's Light 300: --text-ui is documented as Regular 400, and a
		   name is data, not prose. It gives the firms just enough presence to be the evidence
		   the block is offering, without ever approaching the panel above. */
		font-weight: 400;
		line-height: 1.35;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	/* A specialist whose category never resolved still gets named; it just spans the grid
	   rather than leaving an empty label cell. */
	.shelf__firm--full {
		grid-column: 1 / -1;
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
