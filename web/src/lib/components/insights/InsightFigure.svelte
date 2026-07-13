<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '$lib/sanity/image';
	import type { InsightFigureBlock } from '$lib/insights/types';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightFigureBlock> } = $props();

	const value = $derived(portableText.value);
	const image = $derived(value.image ?? null);
	const src = $derived(buildPublicImageUrl(image, { width: 1400, fit: 'max', quality: 82 }));
	const srcset = $derived(
		buildImageSrcset(image, [640, 900, 1200, 1400], { fit: 'max', quality: 82 })
	);
	const lqip = $derived(getImagePlaceholder(image));
	const alt = $derived(image?.altText?.trim() ?? '');
	const caption = $derived(value.caption?.trim() || null);
</script>

{#if src}
	<figure class="insight-figure">
		<div class="insight-figure__frame" style:background-image={lqip ? `url(${lqip})` : undefined}>
			<img
				{src}
				srcset={srcset || undefined}
				sizes="(max-width: 56rem) 100vw, 44rem"
				{alt}
				loading="lazy"
				decoding="async"
			/>
		</div>
		{#if caption}
			<figcaption class="insight-figure__caption">{caption}</figcaption>
		{/if}
	</figure>
{/if}

<style>
	/* The same matted plate as the article hero: one frame around the photograph and its
	   label. Asymmetric margin — more air above than below, so the figure reads as belonging
	   to the prose that follows it rather than floating between two paragraphs. */
	.insight-figure {
		margin: var(--space-xl) 0 var(--space-lg);
		border: 1px solid var(--border);
		background: var(--white);
	}

	/* A fixed, letterbox-ish ratio rather than the image's own: nine sections of prose need
	   the figures to feel like a consistent beat, and a stray portrait crop would tower. */
	.insight-figure__frame {
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.insight-figure__frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.insight-figure__caption {
		padding: 0.75rem 0.875rem;
		border-block-start: 1px solid var(--border);
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.5;
		color: var(--muted);
	}
</style>
