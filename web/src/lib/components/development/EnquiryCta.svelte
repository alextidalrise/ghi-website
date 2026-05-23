<script lang="ts">
	import type { PublicDevelopment } from '$lib/sanity/transforms';
	import { effectiveBrochureVisibility } from '$lib/listing/developmentDisplay';

	type Props = {
		development: PublicDevelopment;
	};

	let { development }: Props = $props();

	const ctas = $derived(development.ctas);
	const primaryLabel = $derived(ctas?.primaryCtaLabel ?? 'Enquire now');
	const secondaryLabel = $derived(ctas?.secondaryCtaLabel);
	const brochureVisibility = $derived(effectiveBrochureVisibility(development));
	const brochureAsset = $derived(development.media?.brochure);
	const showBrochureDownload = $derived(
		ctas?.brochureCtaEnabled &&
			brochureVisibility === 'public_approved' &&
			Boolean(brochureAsset)
	);
	const showBrochureRequest = $derived(
		ctas?.brochureCtaEnabled &&
			brochureVisibility === 'request_only' &&
			Boolean(ctas?.brochureCtaText)
	);
</script>

<section class="enquiry" aria-labelledby="development-enquiry-heading" id="enquire">
	<div class="content-wrap enquiry__inner">
		<div class="enquiry__copy">
			<p class="enquiry__overline text-overline">Enquire</p>
			<h2 id="development-enquiry-heading">{primaryLabel}</h2>
			{#if ctas?.formIntroText}
				<p class="enquiry__intro">{ctas.formIntroText}</p>
			{/if}
			{#if ctas?.responseTimeText}
				<p class="enquiry__response">{ctas.responseTimeText}</p>
			{/if}
		</div>

		<div class="enquiry__actions">
			<a class="enquiry__button enquiry__button--primary" href="#enquire-form">
				{primaryLabel}
			</a>
			{#if secondaryLabel}
				<a class="enquiry__button enquiry__button--secondary" href="#enquire-form">
					{secondaryLabel}
				</a>
			{/if}
			{#if showBrochureDownload && ctas?.brochureCtaText}
				<p class="enquiry__brochure">{ctas.brochureCtaText}</p>
			{:else if showBrochureRequest}
				<p class="enquiry__brochure">{ctas?.brochureCtaText}</p>
			{/if}
			{#if ctas?.whatsAppEnabled}
				<p class="enquiry__whatsapp">WhatsApp enquiries available — contact us to connect.</p>
			{/if}
		</div>

		<form class="enquiry__form" id="enquire-form" action="#" method="post">
			<p class="enquiry__form-note">
				Enquiry form wiring is out of scope for v1. Reference: {development.ghiListingId}
			</p>
			<label>
				<span>Name</span>
				<input type="text" name="name" autocomplete="name" required />
			</label>
			<label>
				<span>Email</span>
				<input type="email" name="email" autocomplete="email" required />
			</label>
			<label>
				<span>Message</span>
				<textarea name="message" rows="4" required></textarea>
			</label>
			<button type="submit" class="enquiry__button enquiry__button--primary">{primaryLabel}</button>
		</form>
	</div>
</section>

<style>
	.enquiry {
		background: var(--green);
		color: var(--white);
		padding-block: var(--space-2xl);
	}

	.enquiry__inner {
		display: grid;
		gap: var(--space-lg);
	}

	@media (min-width: 900px) {
		.enquiry__inner {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}

		.enquiry__form {
			grid-column: 1 / -1;
		}
	}

	.enquiry__overline {
		color: var(--gold);
		margin-bottom: 0.5rem;
	}

	.enquiry h2 {
		color: var(--white);
		margin-bottom: var(--space-sm);
	}

	.enquiry__intro,
	.enquiry__response,
	.enquiry__brochure,
	.enquiry__whatsapp {
		font-size: var(--text-ui);
		color: rgba(255, 255, 255, 0.82);
		margin-top: 0.5rem;
	}

	.enquiry__actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.enquiry__button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.85rem 1.5rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		border: 1px solid transparent;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.enquiry__button--primary {
		background: var(--gold);
		color: var(--green);
	}

	.enquiry__button--primary:hover,
	.enquiry__button--primary:focus-visible {
		background: var(--white);
	}

	.enquiry__button--secondary {
		background: transparent;
		color: var(--white);
		border-color: rgba(255, 255, 255, 0.45);
	}

	.enquiry__button--secondary:hover,
	.enquiry__button--secondary:focus-visible {
		border-color: var(--gold);
		color: var(--gold);
	}

	.enquiry__form {
		display: grid;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.enquiry__form-note {
		font-size: var(--text-small);
		color: rgba(255, 255, 255, 0.65);
		margin-bottom: 0.25rem;
	}

	.enquiry__form label {
		display: grid;
		gap: 0.35rem;
		font-size: var(--text-small);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
	}

	.enquiry__form input,
	.enquiry__form textarea {
		font: inherit;
		padding: 0.65rem 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.25);
		background: rgba(255, 255, 255, 0.95);
		color: var(--charcoal);
	}

	.enquiry__form input:focus-visible,
	.enquiry__form textarea:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}
</style>
