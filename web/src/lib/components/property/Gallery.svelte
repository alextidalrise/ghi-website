<script lang="ts">
	import { buildPublicImageUrl } from '$lib/sanity/image';
	import type { PublicMediaBundle } from '$lib/sanity/transforms/mediaFilter';

	type GalleryItem = {
		url: string;
		alt: string;
		caption: string | null;
		key: string;
	};

	type Props = {
		media: PublicMediaBundle | null | undefined;
		title: string;
	};

	let { media, title }: Props = $props();

	let activeIndex = $state(0);

	const items = $derived.by((): GalleryItem[] => {
		if (!media) return [];

		const collected: GalleryItem[] = [];

		const pushAsset = (
			asset: NonNullable<PublicMediaBundle['gallery']>[number] | null | undefined,
			key: string
		) => {
			const url = buildPublicImageUrl(asset, { width: 1400, height: 900, fit: 'crop', quality: 82 });
			if (!url) return;
			collected.push({
				url,
				alt: asset?.altText ?? title,
				caption: asset?.caption ?? null,
				key
			});
		};

		pushAsset(media.heroImage, 'hero');

		for (const image of media.gallery ?? []) {
			pushAsset(image, image.asset?._ref ?? `gallery-${collected.length}`);
		}

		for (const group of media.galleryGroups ?? []) {
			for (const image of group.images ?? []) {
				pushAsset(image, image.asset?._ref ?? `group-${collected.length}`);
			}
		}

		const seen = new Set<string>();
		return collected.filter((item) => {
			if (seen.has(item.url)) return false;
			seen.add(item.url);
			return true;
		});
	});

	const active = $derived(items[activeIndex] ?? null);

	function select(index: number) {
		activeIndex = index;
	}

	function prev() {
		if (items.length === 0) return;
		activeIndex = (activeIndex - 1 + items.length) % items.length;
	}

	function next() {
		if (items.length === 0) return;
		activeIndex = (activeIndex + 1) % items.length;
	}
</script>

{#if items.length > 0}
	<section class="gallery content-wrap" aria-label="Property gallery">
		<div class="gallery__stage">
			{#if active}
				<img
					class="gallery__main"
					src={active.url}
					alt={active.alt}
					width="1400"
					height="900"
					loading="lazy"
					decoding="async"
				/>
				{#if active.caption}
					<p class="gallery__caption">{active.caption}</p>
				{/if}
			{/if}

			{#if items.length > 1}
				<button type="button" class="gallery__nav gallery__nav--prev" onclick={prev} aria-label="Previous image">
					<span aria-hidden="true">‹</span>
				</button>
				<button type="button" class="gallery__nav gallery__nav--next" onclick={next} aria-label="Next image">
					<span aria-hidden="true">›</span>
				</button>
			{/if}
		</div>

		{#if items.length > 1}
			<div class="gallery__thumbs" role="tablist" aria-label="Gallery thumbnails">
				{#each items as item, index (item.key)}
					<button
						type="button"
						class="gallery__thumb"
						class:gallery__thumb--active={index === activeIndex}
						role="tab"
						aria-selected={index === activeIndex}
						aria-label={`Show image ${index + 1} of ${items.length}`}
						onclick={() => select(index)}
					>
						<img src={item.url} alt="" width="120" height="80" loading="lazy" />
					</button>
				{/each}
			</div>
		{/if}
	</section>
{/if}

<style>
	.gallery {
		padding-block: var(--space-xl);
	}

	.gallery__stage {
		position: relative;
		border: 1px solid var(--border);
		background: var(--linen);
		overflow: hidden;
	}

	.gallery__main {
		width: 100%;
		aspect-ratio: 16 / 10;
		object-fit: cover;
	}

	.gallery__caption {
		padding: 0.85rem 1.25rem;
		font-size: var(--text-small);
		color: var(--muted);
		border-top: 1px solid var(--border);
		background: var(--white);
	}

	.gallery__nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 2.75rem;
		height: 2.75rem;
		border: 1px solid rgba(255, 255, 255, 0.35);
		border-radius: 50%;
		background: rgba(31, 61, 52, 0.72);
		color: var(--white);
		font-size: 1.75rem;
		line-height: 1;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background var(--duration-hover) var(--ease);
	}

	.gallery__nav:hover,
	.gallery__nav:focus-visible {
		background: var(--green);
	}

	.gallery__nav--prev {
		left: 1rem;
	}

	.gallery__nav--next {
		right: 1rem;
	}

	.gallery__thumbs {
		display: flex;
		gap: 0.65rem;
		margin-top: 0.85rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
	}

	.gallery__thumb {
		flex: 0 0 5.5rem;
		border: 2px solid transparent;
		padding: 0;
		cursor: pointer;
		background: none;
		opacity: 0.72;
		transition:
			opacity var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.gallery__thumb img {
		width: 100%;
		aspect-ratio: 3 / 2;
		object-fit: cover;
		display: block;
	}

	.gallery__thumb--active,
	.gallery__thumb:hover,
	.gallery__thumb:focus-visible {
		opacity: 1;
		border-color: var(--green);
	}
</style>
