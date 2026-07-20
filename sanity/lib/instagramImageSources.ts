/**
 * Resolves every image reachable from a listing, for the Instagram post picker.
 *
 * NOTE: this is deliberately a *union* across the unit → unit type → development
 * chain, which is NOT how the public website resolves a unit's gallery.
 * `toPublicUnitListing` (web/src/lib/sanity/transforms/index.ts) uses exclusive
 * fallback: a unit with one override image renders that image and none of its
 * type's. That is correct for the website and wrong here — marketing wants the
 * widest possible pool to choose from. Do not collapse the two.
 *
 * Kept free of React and of the Sanity client so it stays unit-testable.
 */

export type MediaAssetLike = {
	_key?: string;
	_type?: string;
	altText?: string;
	asset?: {
		_type?: string;
		asset?: { _ref?: string; _type?: string };
	};
};

export type ImageSourceGroup = {
	/** Human label shown above the group in the Studio, e.g. "Development: Epic Golden Mile". */
	label: string;
	/** Provenance path stored alongside the selection, e.g. "media.gallery". */
	path: string;
	images: MediaAssetLike[];
};

export type ParentDocs = {
	unitType?: Record<string, unknown> | null;
	development?: Record<string, unknown> | null;
};

/** An entry with no uploaded asset has nothing to show and nothing to post. */
export function hasUploadedAsset(item: unknown): item is MediaAssetLike {
	if (!item || typeof item !== 'object') return false;
	const ref = (item as MediaAssetLike).asset?.asset?._ref;
	return typeof ref === 'string' && ref.length > 0;
}

function imagesAt(doc: Record<string, unknown> | null | undefined, path: string): MediaAssetLike[] {
	if (!doc) return [];
	const value = path.split('.').reduce<unknown>((acc, segment) => {
		if (!acc || typeof acc !== 'object') return undefined;
		return (acc as Record<string, unknown>)[segment];
	}, doc);
	return Array.isArray(value) ? value.filter(hasUploadedAsset) : [];
}

function group(
	label: string,
	path: string,
	doc: Record<string, unknown> | null | undefined,
	/** Path prefix recorded in provenance when the images come from a parent document. */
	provenancePrefix = ''
): ImageSourceGroup[] {
	const images = imagesAt(doc, path);
	if (images.length === 0) return [];
	return [{ label, path: `${provenancePrefix}${path}`, images }];
}

/** Development images: shared gallery, then the media gallery, then each named group. */
function developmentGroups(
	dev: Record<string, unknown> | null | undefined,
	labelPrefix: string,
	provenancePrefix: string
): ImageSourceGroup[] {
	if (!dev) return [];
	const groups: ImageSourceGroup[] = [
		...group(`${labelPrefix}shared gallery`, 'sharedGallery', dev, provenancePrefix),
		...group(`${labelPrefix}gallery`, 'media.gallery', dev, provenancePrefix)
	];

	const galleryGroups = (dev as { media?: { galleryGroups?: unknown } }).media?.galleryGroups;
	if (Array.isArray(galleryGroups)) {
		galleryGroups.forEach((entry, index) => {
			if (!entry || typeof entry !== 'object') return;
			const { title, images } = entry as { title?: string; images?: unknown };
			const usable = Array.isArray(images) ? images.filter(hasUploadedAsset) : [];
			if (usable.length === 0) return;
			groups.push({
				label: `${labelPrefix}${title || `group ${index + 1}`}`,
				path: `${provenancePrefix}media.galleryGroups[${index}].images`,
				images: usable
			});
		});
	}

	return groups;
}

function titleOf(doc: Record<string, unknown> | null | undefined, ...keys: string[]): string {
	if (!doc) return '';
	for (const key of keys) {
		const value = doc[key];
		if (typeof value === 'string' && value.trim()) return value.trim();
	}
	return '';
}

/**
 * Returns labelled image groups for the given document, widest pool first.
 * `parents` must already be fetched — this function performs no I/O.
 */
export function resolveImageSources(
	doc: Record<string, unknown> | null | undefined,
	parents: ParentDocs = {}
): ImageSourceGroup[] {
	if (!doc) return [];
	const type = doc._type;

	switch (type) {
		case 'propertyListing':
			return group('This listing', 'media.gallery', doc);

		case 'development':
			return developmentGroups(doc, '', '');

		case 'unitType': {
			const devTitle = titleOf(parents.development, 'title', 'developmentName');
			return [
				...group('This unit type', 'gallery', doc),
				...developmentGroups(
					parents.development,
					devTitle ? `Development (${devTitle}) — ` : 'Development — ',
					'parentDevelopment.'
				)
			];
		}

		case 'unit': {
			const typeTitle = titleOf(parents.unitType, 'unitTypeName', 'title');
			const devTitle = titleOf(parents.development, 'title', 'developmentName');
			return [
				...group('This unit', 'unitGallery', doc),
				...group(
					typeTitle ? `Unit type (${typeTitle})` : 'Unit type',
					'gallery',
					parents.unitType,
					'parentUnitType.'
				),
				...developmentGroups(
					parents.development,
					devTitle ? `Development (${devTitle}) — ` : 'Development — ',
					'parentDevelopment.'
				)
			];
		}

		default:
			return [];
	}
}

/** Total usable images across all groups. */
export function countImages(groups: ImageSourceGroup[]): number {
	return groups.reduce((total, entry) => total + entry.images.length, 0);
}
