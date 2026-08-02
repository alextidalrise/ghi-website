<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import { buildImageSrcset, buildPublicImageUrl, getImagePlaceholder } from '$lib/sanity/image';
	import type { InsightPortraitBlock } from '$lib/insights/types';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightPortraitBlock> } = $props();

	const value = $derived(portableText.value);
	const image = $derived(value.image ?? null);
	// Square render at up to 2× the largest display size (200px desktop), so the portrait stays
	// crisp on retina without shipping the full 800px asset.
	const src = $derived(buildPublicImageUrl(image, { width: 440, height: 440, fit: 'crop', quality: 82 }));
	const srcset = $derived(
		buildImageSrcset(image, [180, 220, 360, 440], { height: 440, width: 440, fit: 'crop', quality: 82 })
	);
	const lqip = $derived(getImagePlaceholder(image));
	const alt = $derived(image?.altText?.trim() ?? '');
	const name = $derived(value.name?.trim() || null);
	// A role never shows on its own — it labels a name, so without one it has nothing to attach to.
	const role = $derived(name ? value.role?.trim() || null : null);
</script>

{#if src}
	<figure class="insight-portrait">
		<div class="insight-portrait__frame" style:background-image={lqip ? `url(${lqip})` : undefined}>
			<img
				{src}
				srcset={srcset || undefined}
				sizes="(min-width: 60rem) 200px, 160px"
				{alt}
				width="440"
				height="440"
				loading="lazy"
				decoding="async"
			/>
		</div>
		{#if name}
			<figcaption class="insight-portrait__label">
				<span class="insight-portrait__name">{name}</span>{#if role}<span
						class="insight-portrait__sep"
						aria-hidden="true">&nbsp;·&nbsp;</span
					><span class="insight-portrait__role">{role}</span>{/if}
			</figcaption>
		{/if}
	</figure>
{/if}

<style>
	/*
	 * A compact, square personal-service portrait — deliberately not the article's full-width
	 * 16:9 `insight-figure` plate. Stacked and left-aligned by default (tablet / mobile), so the
	 * face sits above the paragraph it introduces and the prose never squeezes into a narrow
	 * column beside it. On desktop it floats to the inline-end and the introduction wraps around
	 * it — the `.insight-body--has-portrait` wrapper is a flow-root, so the float is contained to
	 * this section and never bleeds under the next heading.
	 */
	.insight-portrait {
		margin: var(--space-md) 0 var(--space-lg);
		width: 10rem; /* 160px — within the tested mobile range */
		max-width: 100%;
	}

	.insight-portrait__frame {
		aspect-ratio: 1 / 1;
		overflow: hidden;
		border: 1px solid var(--border);
		background-color: var(--white);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.insight-portrait__frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.insight-portrait__label {
		margin-top: 0.6rem;
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.35;
		text-wrap: balance;
	}

	.insight-portrait__name {
		font-weight: 500;
		color: var(--green);
	}

	.insight-portrait__sep {
		color: var(--muted);
	}

	.insight-portrait__role {
		color: var(--muted);
	}

	/* Desktop: float beside the introduction. 200px sits inside the 180–220px brief; the left
	   and lower margins keep the wrapping copy off the frame. Kept below 60rem so the 768px
	   tablet checkpoint stays stacked. */
	@media (min-width: 60rem) {
		.insight-portrait {
			float: inline-end;
			width: 12.5rem; /* 200px */
			margin: 0.35rem 0 var(--space-md) var(--space-xl);
		}
	}
</style>
