<script lang="ts">
	/**
	 * The closing green band — the site's one landing point at the foot of a page.
	 *
	 * Built for the About page and lifted here so Insights (and whatever closes next)
	 * uses the same object rather than a lookalike. Two things make it the strong close
	 * and both are structural, not decorative:
	 *
	 *  - Three actions with real weighting (gold lead, outline alternative, WhatsApp),
	 *    so a reader who isn't ready to enquire still has somewhere to go.
	 *  - The gradient settles to exactly `--green`, which is the footer's green, so the
	 *    band flows into the footer as one dark mass with no seam. That is why it wants
	 *    to be the LAST thing on the page, and why it carries no bottom rule.
	 *
	 * Emphasis Ladder: this is a page's single green band. Never two.
	 */
	import { GENERAL_WHATSAPP_MESSAGE, whatsAppHref } from '$lib/contact/contact';
	import { trackContactClicked } from '$lib/analytics';

	type Action = { label: string; href: string };

	type Props = {
		heading?: string;
		body?: string;
		primary?: Action;
		/** The "not ready to enquire" escape. Pass null to close on the primary alone. */
		secondary?: Action | null;
	};

	let {
		heading = 'Talk to us',
		body = 'No pressure and no obligation. Whether you are ready to view or just starting to think about it, we are happy to help.',
		primary = { label: 'Get in touch', href: '/contact' },
		secondary = { label: 'Browse properties', href: '/front-line-collection' }
	}: Props = $props();

	const whatsApp = whatsAppHref(GENERAL_WHATSAPP_MESSAGE);
</script>

<section class="talk on-dark" aria-labelledby="talk-heading">
	<div class="talk__inner content-wrap">
		<div class="talk__copy">
			<h2 id="talk-heading" class="talk__heading">{heading}</h2>
			<p class="talk__body">{body}</p>
		</div>
		<!--
		  Order is the two ways of REACHING us (enquire, WhatsApp), then the way of
		  putting it off (browse). It is also the mobile visual order, deliberately:
		  reordering these with CSS `order` would leave a keyboard user tabbing
		  top-left → bottom → top-right, so the DOM carries the order instead.
		-->
		<div class="talk__actions">
			<a class="talk__btn talk__btn--primary" href={primary.href}>{primary.label}</a>
			<a
				class="talk__btn talk__btn--whatsapp"
				href={whatsApp}
				target="_blank"
				rel="noopener"
				onclick={() => trackContactClicked({ method: 'whatsapp', placement: 'talk_to_us_band' })}
			>
				<svg viewBox="0 0 32 32" aria-hidden="true">
					<path
						d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.44 1.64 6.3L3 29l6.86-1.8A12.9 12.9 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-2.04 0-3.94-.58-5.55-1.58l-.4-.24-4.07 1.07 1.08-3.97-.26-.41A10.74 10.74 0 0 1 5.2 16C5.2 10.04 10.04 5.2 16 5.2S26.8 10.04 26.8 16 21.96 26.8 16 26.8z"
					/>
					<path
						d="M21.6 18.86c-.3-.16-1.78-.92-2.06-1.02-.28-.1-.48-.16-.68.15-.2.3-.78.96-.96 1.16-.18.2-.36.22-.66.07-.3-.15-1.27-.49-2.41-1.55-.89-.83-1.49-1.85-1.66-2.16-.18-.3-.02-.47.13-.62.14-.14.3-.36.46-.54.15-.18.2-.3.3-.51.1-.2.05-.38-.02-.54-.07-.15-.68-1.7-.93-2.32-.24-.6-.49-.52-.68-.53l-.58-.01c-.2 0-.53.08-.81.38-.28.3-1.06 1.06-1.06 2.58s1.09 3 1.24 3.2c.15.21 2.13 3.4 5.18 4.77.72.32 1.29.51 1.73.65.73.24 1.39.2 1.91.12.58-.09 1.78-.74 2.04-1.46.25-.71.25-1.32.18-1.45-.07-.13-.27-.21-.57-.36z"
					/>
				</svg>
				<span>WhatsApp</span>
			</a>
			{#if secondary}
				<a class="talk__btn talk__btn--outline" href={secondary.href}>{secondary.label}</a>
			{/if}
		</div>
	</div>
</section>

<style>
	.talk {
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		/* The band owns its own clearance: it is a closing statement, and it should never
		   sit tight against the content it closes, whoever mounts it. */
		margin-top: var(--section-gap);
		padding-block: clamp(3rem, 4.5vw, 4.25rem) clamp(3.5rem, 5vw, 5rem);
		/* Gradient settles to the footer's exact green, so the band and the footer read as
		   one dark mass; the radial glow keeps the CTA distinct up top. `background-color`
		   under it is not redundant: the gradient's positioning area is the padding box, so
		   a fractionally-tall band (the padding is vw-based, so its height lands on a
		   subpixel) can leave a rounding row at the edge. Against a green backstop that row
		   is invisible; against nothing it wrapped to the gradient's light start colour and
		   showed as a stray 1px line at some widths and not others. */
		background-color: var(--green);
		background-image:
			radial-gradient(120% 90% at 14% -20%, oklch(0.37 0.05 165) 0%, transparent 52%),
			linear-gradient(180deg, oklch(0.31 0.035 165) 0%, var(--green) 100%);
		background-repeat: no-repeat;
		/* Bracketed top and bottom by the same gold hairline. The bottom rule is doing real
		   work despite green meeting green: without it the CTA dissolves into the footer and
		   stops reading as its own object. Deliberate and identical at every width — it
		   replaces a subpixel seam that only appeared at some viewport sizes. */
		border-block: 1px solid oklch(0.82 0.05 85 / 0.28);
	}

	.talk__inner {
		display: grid;
		gap: var(--space-xl);
		align-items: end;
	}

	/* Balanced and measured: "Talk to us" is three words, but an authored heading
	   ("Looking for a home beside the fairways?") needs a measure or it runs the full
	   width of the column and stops reading as a headline. */
	.talk__heading {
		color: var(--on-green);
		max-width: 20ch;
		text-wrap: balance;
	}

	.talk__body {
		margin-top: var(--space-md);
		font-family: var(--sans);
		font-size: var(--text-body);
		color: var(--on-green);
		max-width: 46ch;
	}

	.talk__actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.talk__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
		padding: 0.9rem 1.85rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		cursor: pointer;
		border: 1px solid transparent;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.talk__btn:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* Gold primary — the lead action, matching the EnquiryRail WhatsApp weighting. */
	.talk__btn--primary {
		background: var(--gold);
		color: var(--green);
		border-color: var(--gold);
	}

	.talk__btn--primary:hover,
	.talk__btn--primary:focus-visible {
		background: transparent;
		color: var(--on-green);
		border-color: rgba(245, 241, 232, 0.65);
	}

	.talk__btn--outline {
		background: transparent;
		color: var(--on-green);
		border-color: rgba(245, 241, 232, 0.4);
	}

	.talk__btn--outline:hover,
	.talk__btn--outline:focus-visible {
		background: var(--on-green);
		color: var(--green);
		border-color: var(--on-green);
	}

	.talk__btn--whatsapp {
		background: transparent;
		color: var(--on-green);
		border-color: rgba(245, 241, 232, 0.4);
	}

	.talk__btn--whatsapp svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: currentColor;
	}

	.talk__btn--whatsapp:hover,
	.talk__btn--whatsapp:focus-visible {
		background: var(--on-green);
		color: var(--green);
		border-color: var(--on-green);
	}

	/*
	 * Mobile: the two ways of reaching us share row one; the browse escape takes the full
	 * width beneath them. Buttons fill their cell rather than their label, so the group
	 * reads as a single block instead of a ragged stack of three different widths — and
	 * the hierarchy survives, because the gold primary still leads.
	 *
	 * Capped, because the cell keeps growing with the viewport: without it, a 700px screen
	 * gets a 660px-wide "Browse properties" slab. The group stops at a sane width and stays
	 * left-aligned under the copy.
	 */
	@media (max-width: 759px) {
		.talk__actions {
			display: grid;
			/* `minmax(0, 1fr)`, not `1fr`: a bare `1fr` floors at min-content, so on a narrow
			   phone the WhatsApp button (icon + label) outgrows its half and steals width from
			   "Get in touch". The two are meant to be equal, so the floor has to go. */
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			max-width: 27rem;
		}

		/* A full-cell button doesn't need generous side padding to read as a button, and
		   two-up on a 390px screen there is no room for it: 1.85rem each side would leave
		   "Get in touch" nothing to sit in. */
		.talk__btn {
			padding-inline: var(--space-xs);
		}

		.talk__btn--outline {
			grid-column: 1 / -1;
		}
	}

	@media (min-width: 760px) {
		.talk__inner {
			grid-template-columns: 1fr auto;
			gap: var(--space-2xl);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.talk__btn {
			transition: none;
		}
	}
</style>
