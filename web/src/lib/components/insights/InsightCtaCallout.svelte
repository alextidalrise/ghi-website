<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightCtaCalloutBlock } from '$lib/insights/types';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightCtaCalloutBlock> } = $props();

	const value = $derived(portableText.value);
	const heading = $derived(value.heading?.trim() || null);
	const body = $derived(value.body?.trim() || null);
	const label = $derived(value.buttonLabel?.trim() || 'Speak to GHI');
	const href = $derived(value.buttonHref?.trim() || '/contact');
	const external = $derived(/^https?:\/\//.test(href));
</script>

{#if heading}
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

	@media (prefers-reduced-motion: reduce) {
		.inline-cta .inline-cta__button {
			transition: none;
		}
	}
</style>
