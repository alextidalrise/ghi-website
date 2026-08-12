<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightReferenceCardBlock } from '$lib/insights/types';
	import { buildPublicImageUrl, buildImageSrcset, getImagePlaceholder } from '$lib/sanity/image';
	import { isInternalHref, withoutCampaignParams } from '$lib/sanity/href';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightReferenceCardBlock> } =
		$props();

	const value = $derived(portableText.value);
	const eyebrow = $derived(value.eyebrow?.trim() || null);
	const heading = $derived(value.heading?.trim() || null);
	const description = $derived(value.description?.trim() || null);
	const label = $derived(value.linkLabel?.trim() || 'Read more');
	const href = $derived(withoutCampaignParams(value.linkHref?.trim() || ''));
	const external = $derived(/^https?:\/\//.test(href) && !isInternalHref(href));

	const image = $derived(
		buildPublicImageUrl(value.image, { width: 480, height: 300, fit: 'crop', quality: 78 })
	);
	const srcset = $derived(
		buildImageSrcset(value.image, [240, 320, 480, 640], {
			width: 480,
			height: 300,
			fit: 'crop',
			quality: 78
		})
	);
	const lqip = $derived(getImagePlaceholder(value.image));
	const alt = $derived(value.image?.altText?.trim() || '');
</script>

{#if heading && href}
	<a
		class="ref-card"
		{href}
		target={external ? '_blank' : undefined}
		rel={external ? 'noopener noreferrer' : undefined}
	>
		{#if image}
			<span class="ref-card__media" style:background-image={lqip ? `url(${lqip})` : undefined}>
				<img
					src={image}
					srcset={srcset || undefined}
					sizes="(max-width: 40rem) 100vw, 15rem"
					{alt}
					width="480"
					height="300"
					loading="lazy"
					decoding="async"
				/>
			</span>
		{/if}
		<span class="ref-card__text">
			{#if eyebrow}
				<span class="ref-card__eyebrow">{eyebrow}</span>
			{/if}
			<span class="ref-card__heading">{heading}</span>
			{#if description}
				<span class="ref-card__desc">{description}</span>
			{/if}
			<span class="ref-card__cta">
				{label}
				<svg class="ref-card__arrow" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
					<path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" fill="none" />
				</svg>
			</span>
		</span>
	</a>
{/if}

<style>
	/* Scope every rule with `.ref-card` so it beats the body's `.insight-body :global(a)` prose-link
	   styling (0,2,1) — otherwise the whole card would take the green underline. */
	.ref-card {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
		gap: clamp(1.25rem, 4vw, 2rem);
		align-items: center;
		margin-block: clamp(2rem, 5vw, 3rem);
		padding: clamp(1.25rem, 3vw, 1.5rem);
		border: 1px solid var(--border);
		background: var(--surface-tint);
		text-decoration: none;
		color: inherit;
		transition: border-color var(--duration-hover) var(--ease);
	}

	.ref-card:hover,
	.ref-card:focus-visible {
		border-color: var(--gold);
	}

	.ref-card:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.ref-card__media {
		display: block;
		aspect-ratio: 16 / 10;
		overflow: hidden;
		background: var(--green);
		background-size: cover;
		background-position: center;
	}

	.ref-card__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.ref-card__text {
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.ref-card__eyebrow {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: var(--space-xs);
	}

	.ref-card__heading {
		font-family: var(--serif);
		font-size: var(--text-h3);
		font-weight: 400;
		line-height: 1.2;
		color: var(--green);
		text-wrap: balance;
	}

	.ref-card__desc {
		margin-top: var(--space-xs);
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.6;
		color: var(--muted);
		max-width: 52ch;
	}

	.ref-card__cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: var(--space-md);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--green);
	}

	.ref-card__arrow {
		transition: transform var(--duration-hover) var(--ease);
	}

	.ref-card:hover .ref-card__arrow,
	.ref-card:focus-visible .ref-card__arrow {
		transform: translateX(3px);
	}

	@media (max-width: 40rem) {
		.ref-card {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ref-card,
		.ref-card__arrow {
			transition: none;
		}
	}
</style>
