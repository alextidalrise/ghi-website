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

	let imageBuilder = builder.image(asset.asset as SanityImageSource);

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

export { builder as publicImageBuilder };
