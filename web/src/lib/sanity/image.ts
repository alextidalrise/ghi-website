import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { SANITY_PROJECT_ID } from './constants';
import { env as publicEnv } from '$env/dynamic/public';
import { isPublicMediaAsset, type MediaAssetInput } from './transforms/mediaFilter';

const builder = imageUrlBuilder({
	projectId: publicEnv.PUBLIC_SANITY_PROJECT_ID ?? SANITY_PROJECT_ID,
	dataset: publicEnv.PUBLIC_SANITY_DATASET ?? 'production'
});

export type ImageBuilderOptions = {
	width?: number;
	height?: number;
	quality?: number;
	fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min';
};

/**
 * Build a CDN image URL only when the asset passes the public media gate.
 * Returns null for blocked or missing assets.
 */
export function buildPublicImageUrl(
	asset: MediaAssetInput | null | undefined,
	options: ImageBuilderOptions = {}
): string | null {
	if (!isPublicMediaAsset(asset) || !asset?.asset) {
		return null;
	}

	// auto('format') lets the Sanity CDN negotiate AVIF/WebP per request,
	// so every consumer of this helper ships modern formats without opting in.
	let imageBuilder = builder.image(asset.asset as SanityImageSource).auto('format');

	if (options.width) {
		imageBuilder = imageBuilder.width(options.width);
	}
	if (options.height) {
		imageBuilder = imageBuilder.height(options.height);
	}
	if (options.quality) {
		imageBuilder = imageBuilder.quality(options.quality);
	}
	if (options.fit) {
		imageBuilder = imageBuilder.fit(options.fit);
	}

	return imageBuilder.url();
}

/** Build a responsive srcset string from a public media asset. */
export function buildImageSrcset(
	asset: MediaAssetInput | null | undefined,
	widths: number[],
	options: ImageBuilderOptions = {}
): string {
	if (!isPublicMediaAsset(asset) || !asset?.asset) {
		return '';
	}

	const parts: string[] = [];
	for (const width of widths) {
		const height =
			options.height && options.width
				? Math.round((width / options.width) * options.height)
				: options.height;
		const url = buildPublicImageUrl(asset, {
			...options,
			width,
			height
		});
		if (url) parts.push(`${url} ${width}w`);
	}

	return parts.join(', ');
}

/**
 * Base64 LQIP data URI for a blur-up placeholder, or null.
 * Requires the GROQ projection to deref `asset.asset->metadata.lqip`.
 * Note: OG-image builders must NOT use this — they emit meta tags, not visual <img>.
 */
export function getImagePlaceholder(asset: MediaAssetInput | null | undefined): string | null {
	if (!isPublicMediaAsset(asset)) return null;
	return asset?.lqip ?? null;
}

/**
 * Intrinsic source dimensions for width/height (CLS) hardening, or null.
 * Requires the GROQ projection to deref `asset.asset->metadata.dimensions`.
 * Use for un-cropped images; for cropped renders prefer the crop box dimensions.
 */
export function getImageDimensions(
	asset: MediaAssetInput | null | undefined
): { width: number; height: number } | null {
	const d = asset?.dimensions;
	if (!d?.width || !d?.height) return null;
	return { width: d.width, height: d.height };
}

export { builder as publicImageBuilder };
