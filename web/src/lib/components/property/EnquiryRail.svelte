<script lang="ts">
	import type { PublicPropertyListing } from '$lib/sanity/transforms';

	type Props = {
		listing: PublicPropertyListing;
	};

	let { listing }: Props = $props();

	const ctas = $derived(listing.ctas);
	const primaryLabel = $derived(ctas?.primaryCtaLabel ?? 'Send enquiry');
	const intro = $derived(ctas?.formIntroText ?? null);
	const responseLine = $derived(
		ctas?.responseTimeText ?? 'Sent direct to our team · reply within 24 hours'
	);
	const whatsApp = $derived(ctas?.whatsAppEnabled ?? false);
</script>

<section class="rail on-dark" aria-labelledby="enquire-heading" id="enquire">
	<h2 id="enquire-heading" class="rail__heading">Enquire about this property</h2>
	{#if intro}
		<p class="rail__intro">{intro}</p>
	{/if}

	<!-- Visual-only in v1: submission wiring is out of scope, so the form posts
	     nowhere. The listing reference rides along as a hidden field for when it
	     is wired. -->
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

		<button type="submit" class="rail__button rail__button--primary">{primaryLabel}</button>
		{#if whatsApp}
			<button type="button" class="rail__button rail__button--secondary">Enquire on WhatsApp</button>
		{/if}
	</form>

	<p class="rail__response">{responseLine}</p>
</section>

<!-- Persistent reach on phones, where the rail sits inline mid-page. -->
<a class="enquire-bar" href="#enquire-form">{primaryLabel}</a>

<style>
	.rail {
		background: var(--green);
		color: var(--on-green);
		padding: var(--space-lg);
	}

	.rail__heading {
		color: var(--on-green);
		font-size: var(--text-h4);
	}

	.rail__intro {
		margin-top: var(--space-sm);
		font-size: var(--text-ui);
		color: rgba(245, 241, 232, 0.82);
	}

	.rail__form {
		display: grid;
		gap: var(--space-sm);
		margin-top: var(--space-md);
	}

	.rail__field {
		display: grid;
		gap: 0.35rem;
		font-size: var(--text-small);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: rgba(245, 241, 232, 0.9);
	}

	.rail__field em {
		font-style: normal;
		text-transform: none;
		letter-spacing: 0;
		color: rgba(245, 241, 232, 0.6);
	}

	.rail__field input,
	.rail__field textarea {
		font: inherit;
		font-size: var(--text-ui);
		text-transform: none;
		letter-spacing: normal;
		padding: 0.65rem 0.75rem;
		border: 1px solid rgba(245, 241, 232, 0.25);
		background: rgba(245, 241, 232, 0.96);
		color: var(--charcoal);
	}

	.rail__field textarea {
		resize: vertical;
	}

	.rail__field input:focus-visible,
	.rail__field textarea:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}

	.rail__button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.85rem 1.5rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		border: 1px solid transparent;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.rail__button--primary {
		background: var(--gold);
		color: var(--green);
	}

	.rail__button--primary:hover,
	.rail__button--primary:focus-visible {
		background: var(--white);
	}

	.rail__button--secondary {
		background: transparent;
		color: var(--on-green);
		border-color: rgba(245, 241, 232, 0.45);
	}

	.rail__button--secondary:hover,
	.rail__button--secondary:focus-visible {
		border-color: var(--gold);
		color: var(--gold);
	}

	.rail__response {
		margin-top: var(--space-md);
		font-size: var(--text-small);
		color: rgba(245, 241, 232, 0.7);
	}

	/* Mobile sticky CTA: hidden by default, revealed only on phones. Sits above
	   page content but below the fixed site nav. */
	.enquire-bar {
		display: none;
	}

	@media (max-width: 760px) {
		.enquire-bar {
			position: fixed;
			inset-inline: 0;
			bottom: 0;
			z-index: 30;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0.95rem 1.5rem;
			background: var(--gold);
			color: var(--green);
			font-family: var(--sans);
			font-size: var(--text-ui);
			font-weight: 500;
			letter-spacing: var(--tracking-wide);
			text-transform: uppercase;
			text-decoration: none;
			box-shadow: 0 -1px 12px rgba(14, 20, 16, 0.18);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rail__button {
			transition: none;
		}
	}
</style>
