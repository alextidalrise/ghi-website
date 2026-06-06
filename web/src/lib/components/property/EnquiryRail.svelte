<script lang="ts">
	import { onMount } from 'svelte';

	/** Minimal structural shape — satisfied by both property listings and developments,
	    so the rail can serve either without coupling to a specific document type. */
	type Enquirable = {
		ghiListingId?: string | null;
		ctas?: {
			primaryCtaLabel?: string | null;
			formIntroText?: string | null;
			responseTimeText?: string | null;
		} | null;
	};

	type Props = {
		listing: Enquirable;
		heading?: string;
	};

	let { listing, heading = 'Enquire about this property' }: Props = $props();

	// The mobile sticky bar is fixed, so the page must reserve room for it or it
	// covers the footer's last row. Flag the body only while this rail is mounted
	// (property pages); removed on navigate-away so the padding never leaks elsewhere.
	onMount(() => {
		document.body.classList.add('has-enquire-bar');
		return () => document.body.classList.remove('has-enquire-bar');
	});

	const ctas = $derived(listing.ctas);
	const primaryLabel = $derived(ctas?.primaryCtaLabel ?? 'Send enquiry');
	const intro = $derived(ctas?.formIntroText ?? null);
	const responseLine = $derived(
		ctas?.responseTimeText ?? 'Sent direct to our team · reply within 24 hours'
	);

	// TODO(whatsapp): point this at the GHI WhatsApp deep link once the number is
	// confirmed, e.g. `https://wa.me/<number>?text=${encodeURIComponent(message)}`
	// with the listing reference from `listing.ghiListingId`. While null, the
	// WhatsApp buttons render fully styled but inert (placeholder).
	const whatsAppHref: string | null = null;

	// Email form is collapsed by default and disclosed on request. The markup stays
	// in the DOM (clipped, not removed) so it is crawlable; it is made `inert` while
	// closed so it leaves the tab order and is hidden from assistive tech.
	let emailOpen = $state(false);

	function toggleEmail() {
		emailOpen = !emailOpen;
	}

	function prefersReducedMotion() {
		return (
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	function launchWhatsApp() {
		// Placeholder until a destination is wired (see whatsAppHref above).
		if (whatsAppHref) window.open(whatsAppHref, '_blank', 'noopener');
	}

	// Mobile sticky bar: reveal the form, then bring it into view ready to type.
	function revealEmail() {
		emailOpen = true;
		requestAnimationFrame(() => {
			document.getElementById('enquire-form')?.scrollIntoView({
				behavior: prefersReducedMotion() ? 'auto' : 'smooth',
				block: 'center'
			});
		});
	}
</script>

<section class="rail on-dark" aria-labelledby="enquire-heading" id="enquire">
	<h2 id="enquire-heading" class="rail__heading">{heading}</h2>
	{#if intro}
		<p class="rail__intro">{intro}</p>
	{/if}

	<div class="rail__primary">
		<button type="button" class="rail__whatsapp" onclick={launchWhatsApp}>
			<svg class="rail__whatsapp-glyph" viewBox="0 0 32 32" aria-hidden="true">
				<path
					d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.44 1.64 6.3L3 29l6.86-1.8A12.9 12.9 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-2.04 0-3.94-.58-5.55-1.58l-.4-.24-4.07 1.07 1.08-3.97-.26-.41A10.74 10.74 0 0 1 5.2 16C5.2 10.04 10.04 5.2 16 5.2S26.8 10.04 26.8 16 21.96 26.8 16 26.8z"
				/>
				<path
					d="M21.6 18.86c-.3-.16-1.78-.92-2.06-1.02-.28-.1-.48-.16-.68.15-.2.3-.78.96-.96 1.16-.18.2-.36.22-.66.07-.3-.15-1.27-.49-2.41-1.55-.89-.83-1.49-1.85-1.66-2.16-.18-.3-.02-.47.13-.62.14-.14.3-.36.46-.54.15-.18.2-.3.3-.51.1-.2.05-.38-.02-.54-.07-.15-.68-1.7-.93-2.32-.24-.6-.49-.52-.68-.53l-.58-.01c-.2 0-.53.08-.81.38-.28.3-1.06 1.06-1.06 2.58s1.09 3 1.24 3.2c.15.21 2.13 3.4 5.18 4.77.72.32 1.29.51 1.73.65.73.24 1.39.2 1.91.12.58-.09 1.78-.74 2.04-1.46.25-.71.25-1.32.18-1.45-.07-.13-.27-.21-.57-.36z"
				/>
			</svg>
			<span>Message us on WhatsApp</span>
		</button>
		<p class="rail__primary-note">{responseLine}</p>
	</div>

	<button
		type="button"
		class="rail__disclosure"
		aria-expanded={emailOpen}
		aria-controls="enquire-form-region"
		onclick={toggleEmail}
	>
		<span>Prefer email?</span>
		<svg class="rail__chevron" class:is-open={emailOpen} viewBox="0 0 14 9" aria-hidden="true">
			<path d="M1 1.5 7 7l6-5.5" stroke="currentColor" stroke-width="1.5" fill="none" />
		</svg>
	</button>

	<!-- Visual-only in v1: submission wiring is out of scope, so the form posts
	     nowhere. The listing reference rides along as a hidden field for when it
	     is wired. The form stays collapsed behind "Prefer email?" until requested. -->
	<div id="enquire-form-region" class="rail__reveal" class:is-open={emailOpen}>
		<div class="rail__reveal-inner" inert={!emailOpen}>
			<form class="rail__form" id="enquire-form" action="#" method="post">
				<input type="hidden" name="listing" value={listing.ghiListingId ?? ''} />
				<label class="rail__field">
					<span>Name</span>
					<input type="text" name="name" autocomplete="name" required />
				</label>
				<label class="rail__field">
					<span>Email</span>
					<input type="email" name="email" autocomplete="email" required />
				</label>
				<label class="rail__field">
					<span>Phone <em>(optional)</em></span>
					<input type="tel" name="phone" autocomplete="tel" />
				</label>
				<label class="rail__field">
					<span>Message</span>
					<textarea name="message" rows="4" required></textarea>
				</label>

				<button type="submit" class="rail__submit">
					<span>{primaryLabel}</span>
					<svg viewBox="0 0 26 12" fill="none" aria-hidden="true">
						<path d="M0 6h23M19 1.5 24 6l-5 4.5" stroke="currentColor" stroke-width="1.5" />
					</svg>
				</button>
			</form>
		</div>
	</div>
</section>

<!-- Persistent reach on phones: WhatsApp one tap away, email scrolls to the rail
     with the form already expanded. -->
<div class="enquire-bar">
	<button type="button" class="enquire-bar__action enquire-bar__action--whatsapp" onclick={launchWhatsApp}>
		<svg viewBox="0 0 32 32" aria-hidden="true">
			<path
				d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.44 1.64 6.3L3 29l6.86-1.8A12.9 12.9 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-2.04 0-3.94-.58-5.55-1.58l-.4-.24-4.07 1.07 1.08-3.97-.26-.41A10.74 10.74 0 0 1 5.2 16C5.2 10.04 10.04 5.2 16 5.2S26.8 10.04 26.8 16 21.96 26.8 16 26.8z"
			/>
			<path
				d="M21.6 18.86c-.3-.16-1.78-.92-2.06-1.02-.28-.1-.48-.16-.68.15-.2.3-.78.96-.96 1.16-.18.2-.36.22-.66.07-.3-.15-1.27-.49-2.41-1.55-.89-.83-1.49-1.85-1.66-2.16-.18-.3-.02-.47.13-.62.14-.14.3-.36.46-.54.15-.18.2-.3.3-.51.1-.2.05-.38-.02-.54-.07-.15-.68-1.7-.93-2.32-.24-.6-.49-.52-.68-.53l-.58-.01c-.2 0-.53.08-.81.38-.28.3-1.06 1.06-1.06 2.58s1.09 3 1.24 3.2c.15.21 2.13 3.4 5.18 4.77.72.32 1.29.51 1.73.65.73.24 1.39.2 1.91.12.58-.09 1.78-.74 2.04-1.46.25-.71.25-1.32.18-1.45-.07-.13-.27-.21-.57-.36z"
			/>
		</svg>
		<span>WhatsApp</span>
	</button>
	<button type="button" class="enquire-bar__action enquire-bar__action--email" onclick={revealEmail}>
		Email us
	</button>
</div>

<style>
	.rail {
		/* Borrows the homepage concierge panel: a soft light gathers at top-left and
		   settles into a deeper green at the base, framed by a 1px gold hairline. */
		background:
			radial-gradient(135% 75% at 8% -8%, oklch(0.37 0.05 165) 0%, transparent 56%),
			linear-gradient(165deg, oklch(0.31 0.035 165) 0%, oklch(0.23 0.03 165) 100%);
		color: var(--on-green);
		padding: var(--space-lg);
		border: 1px solid var(--gold);
		/* A restrained lift to seat the green panel on the white page. Softer than the
		   homepage concierge band, which has a photo seam to bridge; this one doesn't. */
		box-shadow: 0 20px 44px -30px oklch(0.08 0.02 165 / 0.75);
	}

	.rail__heading {
		color: var(--on-green);
		font-family: var(--serif);
		font-weight: 600;
		font-size: var(--text-h3);
		line-height: 1.1;
		text-wrap: balance;
	}

	.rail__intro {
		margin-top: var(--space-sm);
		font-size: var(--text-ui);
		color: rgba(245, 241, 232, 0.82);
	}

	/* WhatsApp — the primary path. */
	.rail__primary {
		margin-top: var(--space-md);
	}

	.rail__whatsapp {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.7rem;
		width: 100%;
		min-height: 3.5rem;
		padding: 0 1.5rem;
		border: 1px solid var(--gold);
		background: var(--gold);
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			transform var(--duration-hover) var(--ease);
	}

	.rail__whatsapp-glyph {
		width: 1.4rem;
		height: 1.4rem;
		fill: currentColor;
		flex-shrink: 0;
	}

	.rail__whatsapp:hover,
	.rail__whatsapp:focus-visible {
		background: transparent;
		color: var(--gold);
	}

	.rail__whatsapp:active {
		transform: translateY(1px);
	}

	.rail__whatsapp:focus-visible {
		outline: 2px solid var(--on-green);
		outline-offset: 4px;
	}

	.rail__primary-note {
		margin-top: 0.75rem;
		font-size: var(--text-small);
		line-height: 1.5;
		color: rgba(245, 241, 232, 0.72);
		text-wrap: pretty;
	}

	/* "Prefer email?" disclosure trigger — quiet, secondary. */
	.rail__disclosure {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: var(--space-md);
		/* Comfortable tap target (≥44px) without visually bulking the quiet link. */
		min-height: 2.75rem;
		padding: 0.35rem 0;
		border: 0;
		background: transparent;
		color: var(--gold);
		font-family: var(--serif);
		font-style: italic;
		font-size: 1.15rem;
		line-height: 1;
		cursor: pointer;
		transition: color var(--duration-hover) var(--ease);
	}

	.rail__disclosure span {
		border-bottom: 1px solid transparent;
		transition: border-color var(--duration-hover) var(--ease);
	}

	.rail__disclosure:hover span,
	.rail__disclosure:focus-visible span {
		border-bottom-color: var(--gold);
	}

	.rail__disclosure:focus-visible {
		outline: 2px solid var(--on-green);
		outline-offset: 3px;
	}

	.rail__chevron {
		width: 0.8rem;
		height: 0.55rem;
		transition: transform var(--duration-hover) var(--ease);
	}

	.rail__chevron.is-open {
		transform: rotate(180deg);
	}

	/* Disclosure reveal: animate the row track so the form expands in place while
	   staying in the DOM. */
	.rail__reveal {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--duration-lift) var(--ease);
	}

	.rail__reveal.is-open {
		grid-template-rows: 1fr;
	}

	.rail__reveal-inner {
		overflow: hidden;
		min-height: 0;
	}

	.rail__form {
		display: grid;
		gap: var(--space-sm);
		padding-top: var(--space-md);
	}

	.rail__field {
		display: grid;
		gap: 0.4rem;
		font-size: var(--text-small);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: rgba(245, 241, 232, 0.85);
	}

	.rail__field em {
		font-style: normal;
		text-transform: none;
		letter-spacing: 0;
		color: rgba(245, 241, 232, 0.55);
	}

	/* Concierge-style fields: transparent with a gold underline that brightens on
	   focus. Typed text is light ink for contrast on the green panel. */
	.rail__field input,
	.rail__field textarea {
		font: inherit;
		font-size: var(--text-ui);
		text-transform: none;
		letter-spacing: normal;
		padding: 0.5rem 0;
		border: 0;
		border-bottom: 1px solid rgba(214, 195, 163, 0.55);
		border-radius: 0;
		background: transparent;
		color: var(--on-green);
		transition: border-color var(--duration-hover) var(--ease);
	}

	.rail__field textarea {
		resize: vertical;
		min-height: 4.5rem;
	}

	.rail__field input::placeholder,
	.rail__field textarea::placeholder {
		color: rgba(245, 241, 232, 0.45);
	}

	.rail__field input:hover,
	.rail__field textarea:hover {
		border-bottom-color: rgba(214, 195, 163, 0.85);
	}

	.rail__field input:focus-visible,
	.rail__field textarea:focus-visible {
		outline: none;
		border-bottom-color: var(--gold);
	}

	/* Send enquiry — gold arrow CTA echoing the concierge "View properties" button. */
	.rail__submit {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		min-height: 3.25rem;
		margin-top: var(--space-xs);
		padding: 0 1.75rem;
		border: 1px solid var(--gold);
		background: var(--gold);
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			transform var(--duration-hover) var(--ease);
	}

	.rail__submit svg {
		transition: transform var(--duration-hover) var(--ease);
	}

	.rail__submit:hover,
	.rail__submit:focus-visible {
		background: transparent;
		color: var(--gold);
	}

	.rail__submit:active {
		transform: translateY(1px);
	}

	.rail__submit:hover svg,
	.rail__submit:focus-visible svg {
		transform: translateX(5px);
	}

	.rail__submit:focus-visible {
		outline: 2px solid var(--on-green);
		outline-offset: 4px;
	}

	/* Mobile sticky bar: hidden by default, revealed only on phones. */
	.enquire-bar {
		display: none;
	}

	@media (max-width: 760px) {
		/* Reserve room so the fixed console never sits over the footer's last row, and
		   clear the iOS home indicator. The class is toggled by onMount, so the
		   padding applies only on pages that render the rail. */
		:global(body.has-enquire-bar) {
			padding-bottom: calc(4.25rem + env(safe-area-inset-bottom));
		}

		/* A white console the page rests on, not an edge-to-edge colour strip. A crisp
		   hairline and a soft upward lift separate it from the white page above; the two
		   brand-coloured CTAs sit inset within it as objects, with room to breathe. */
		.enquire-bar {
			position: fixed;
			inset-inline: 0;
			bottom: 0;
			z-index: 30;
			display: grid;
			/* Asymmetric split: WhatsApp leads, email is the considered second option. */
			grid-template-columns: 1.5fr 1fr;
			gap: 0.55rem;
			padding: 0.6rem 0.75rem calc(0.6rem + env(safe-area-inset-bottom));
			background: var(--white);
			border-top: 1px solid rgba(31, 61, 52, 0.16);
			box-shadow: 0 -12px 32px -20px oklch(0.2 0.03 165 / 0.55);
		}

		.enquire-bar__action {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.55rem;
			min-height: 3rem;
			padding: 0 1rem;
			border: 1px solid transparent;
			font-family: var(--sans);
			font-size: var(--text-ui);
			font-weight: 500;
			letter-spacing: var(--tracking-wide);
			text-transform: uppercase;
			text-decoration: none;
			cursor: pointer;
			transition:
				background var(--duration-hover) var(--ease),
				color var(--duration-hover) var(--ease),
				border-color var(--duration-hover) var(--ease);
		}

		.enquire-bar__action:focus-visible {
			outline: 2px solid var(--green);
			outline-offset: 2px;
		}

		/* WhatsApp — the gold primary, matching the in-rail button. */
		.enquire-bar__action--whatsapp {
			background: var(--gold);
			color: var(--green);
			border-color: var(--gold);
		}

		.enquire-bar__action--whatsapp svg {
			width: 1.2rem;
			height: 1.2rem;
			fill: currentColor;
		}

		.enquire-bar__action--whatsapp:active {
			background: var(--green);
			color: var(--white);
			border-color: var(--green);
		}

		/* Email — the deep-green secondary. */
		.enquire-bar__action--email {
			background: var(--green);
			color: var(--on-green);
			border-color: var(--green);
		}

		.enquire-bar__action--email:active {
			background: var(--charcoal);
			border-color: var(--charcoal);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rail__whatsapp,
		.rail__disclosure,
		.rail__chevron,
		.rail__reveal,
		.rail__field input,
		.rail__field textarea,
		.rail__submit,
		.rail__submit svg {
			transition: none;
		}
	}
</style>
