<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightCtaCalloutBlock } from '$lib/insights/types';
	import { isInternalHref, withoutCampaignParams } from '$lib/sanity/href';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightCtaCalloutBlock> } = $props();

	const value = $derived(portableText.value);
	const linkBand = $derived(value.variant === 'linkBand');
	const eyebrow = $derived(value.eyebrow?.trim() || null);
	const heading = $derived(value.heading?.trim() || null);
	const body = $derived(value.body?.trim() || null);
	const label = $derived(value.buttonLabel?.trim() || 'Speak to GHI');
	// This CTA points at /contact on almost every insight, which makes it the most likely
	// place for someone to tag an internal link for attribution. See `$lib/sanity/href` for
	// why that silently damages GA4 rather than measuring anything.
	const href = $derived(withoutCampaignParams(value.buttonHref?.trim() || '/contact'));
	const external = $derived(/^https?:\/\//.test(href) && !isInternalHref(href));
</script>

{#if heading && linkBand}
	<!-- Link-band variant: a quiet ruled cross-link. Heading + one line on the left, a trailing
	     text link (no filled button) on the right — for pointing at another surface mid-article. -->
	<aside class="inline-cta inline-cta--band">
		<div class="inline-cta__text">
			{#if eyebrow}
				<p class="inline-cta__eyebrow">{eyebrow}</p>
			{/if}
			<p class="inline-cta__heading">{heading}</p>
			{#if body}
				<p class="inline-cta__body">{body}</p>
			{/if}
		</div>
		<a
			class="inline-cta__link"
			{href}
			target={external ? '_blank' : undefined}
			rel={external ? 'noopener noreferrer' : undefined}
		>
			{label}
			<svg class="inline-cta__arrow" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
				<path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" fill="none" />
			</svg>
		</a>
	</aside>
{:else if heading}
	<aside class="inline-cta">
		<div class="inline-cta__text">
			<p class="inline-cta__heading">{heading}</p>
			{#if body}
				<p class="inline-cta__body">{body}</p>
			{/if}
		</div>
		<a
			class="inline-cta__button"
			{href}
			target={external ? '_blank' : undefined}
			rel={external ? 'noopener noreferrer' : undefined}
		>
			{label}
		</a>
	</aside>
{/if}

<style>
	.inline-cta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md) var(--space-lg);
		margin-block: clamp(2rem, 5vw, 3rem);
		padding: clamp(1.25rem, 3vw, 1.75rem) clamp(1.5rem, 4vw, 2rem);
		border: 1px solid var(--border);
		border-block-start: 1px solid var(--gold);
		background: var(--white);
	}

	.inline-cta__text {
		min-width: 0;
	}

	/* Own our paragraph margins rather than inheriting the body's prose reset. */
	.inline-cta p {
		margin: 0;
	}

	.inline-cta__heading {
		font-family: var(--serif);
		font-size: var(--text-h4);
		color: var(--green);
	}

	.inline-cta__body {
		margin-top: var(--space-xs);
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.6;
		color: var(--muted);
		max-width: 52ch;
	}

	/* Scope with the container class so these win over the article body's
	   `.insight-body :global(a)` prose-link rule (0,2,1), which would otherwise
	   paint the label green-on-green and add an underline. */
	.inline-cta .inline-cta__button {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.8rem 1.75rem;
		background: var(--green);
		color: var(--white);
		border: 1px solid var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.inline-cta .inline-cta__button:hover,
	.inline-cta .inline-cta__button:focus-visible {
		background: var(--charcoal);
		border-color: var(--charcoal);
	}

	/* The site's gold focus ring (used by the routes block, the closing band and ~15 other
	   components). The hover/focus background shift alone is green→charcoal — too close to read
	   as a focus indicator, so a keyboard user had no clear one here. */
	.inline-cta .inline-cta__button:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* Phones: stack the prompt and let the button take the full width. Side-by-side it is
	   `flex-shrink: 0` with a long label ("Enquire about Portugal property"), which overflows a
	   narrow viewport rather than wrapping. Stacked + stretched, the label always fits and the
	   button reads as the section's action. Matches v15's advisory-prompt mobile behaviour. */
	@media (max-width: 30rem) {
		.inline-cta {
			flex-direction: column;
			align-items: stretch;
		}

		.inline-cta .inline-cta__button {
			align-self: stretch;
		}
	}

	/*
	 * Link-band variant — a quiet cross-link, not an enquiry prompt. Ruled top and bottom on the
	 * page ground (no fill, no button), a serif heading with a trailing text link. The gold top
	 * rule keeps it kin to the button variant; everything else steps the emphasis down.
	 */
	.inline-cta--band {
		align-items: baseline;
		padding-inline: 0;
		padding-block: clamp(1.25rem, 3vw, 1.5rem);
		border: 0;
		border-block: 1px solid var(--border);
		border-block-start-color: var(--gold);
		background: none;
	}

	.inline-cta--band .inline-cta__eyebrow {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: var(--space-xs);
	}

	.inline-cta--band .inline-cta__heading {
		font-size: var(--text-h3);
	}

	/* Scope with the container class so this wins over the body's prose-link rule (0,2,1). */
	.inline-cta--band .inline-cta__link {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--green);
		text-decoration: none;
	}

	.inline-cta--band .inline-cta__arrow {
		transition: transform var(--duration-hover) var(--ease);
	}

	.inline-cta--band .inline-cta__link:hover,
	.inline-cta--band .inline-cta__link:focus-visible {
		color: var(--green);
	}

	.inline-cta--band .inline-cta__link:hover .inline-cta__arrow,
	.inline-cta--band .inline-cta__link:focus-visible .inline-cta__arrow {
		transform: translateX(3px);
	}

	.inline-cta--band .inline-cta__link:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		.inline-cta .inline-cta__button,
		.inline-cta--band .inline-cta__arrow {
			transition: none;
		}
	}
</style>
