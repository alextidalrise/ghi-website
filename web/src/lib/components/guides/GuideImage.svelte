<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '$lib/sanity/image';
	import type { GuideImageBlock } from '$lib/guides/types';

	let { portableText }: { portableText: CustomBlockComponentProps<GuideImageBlock> } = $props();

	const value = $derived(portableText.value);
	const src = $derived(buildPublicImageUrl(value, { width: 1280, fit: 'max', quality: 82 }));
	const srcset = $derived(
		buildImageSrcset(value, [640, 960, 1280, 1600], { fit: 'max', quality: 82 })
	);
	const lqip = $derived(getImagePlaceholder(value));
	const alt = $derived(value.altText?.trim() ?? '');
	const width = $derived(value.dimensions?.width ?? undefined);
	const height = $derived(value.dimensions?.height ?? undefined);
</script>

{#if src}
	<figure class="guide-image">
		<img
			{src}
			srcset={srcset || undefined}
			sizes="(max-width: 56rem) 100vw, 680px"
			{alt}
			{width}
			{height}
			loading="lazy"
			decoding="async"
			style:background-image={lqip ? `url(${lqip})` : undefined}
		/>
	</figure>
{/if}

<style>
	.guide-image {
		margin-block: var(--space-lg);
	}

	.guide-image img {
		width: 100%;
		height: auto;
		/* Blurred LQIP shows through until the photo paints over it. */
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}
</style>
