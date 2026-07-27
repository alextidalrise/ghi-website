/**
 * Sanity CDN image URLs for email.
 *
 * This deliberately does NOT reuse `web/src/lib/sanity/image.ts`. That helper
 * bakes in `.auto('format')`, which lets the CDN negotiate AVIF then WebP then
 * JPEG from the request's Accept header. That is correct for browsers and wrong
 * for email: classic Outlook for Windows renders neither AVIF nor WebP, and
 * Gmail's image proxy does not always forward a useful Accept header. An email
 * that negotiates formats ships broken images to a real slice of the audience.
 *
 * So: the format is always pinned. See docs/01-technical-standard.md.
 *
 * Dependency-free by design. The future agent needs to construct these URLs
 * without loading the SvelteKit app or the Sanity client.
 */

import { image as imageTokens } from './tokens.mjs';

export const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || 's88o8sjb';
export const SANITY_DATASET = process.env.SANITY_DATASET || 'development';

const CDN_HOST = 'https://cdn.sanity.io';

/** `image-<assetId>-<width>x<height>-<ext>` */
const REF_PATTERN = /^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/;

/**
 * Parse a Sanity asset reference into its parts.
 * @param {string} ref
 */
export function parseAssetRef(ref) {
	const match = REF_PATTERN.exec(ref);

	if (!match) {
		throw new Error(
			`Not a Sanity image reference: "${ref}". ` +
				`Expected the shape image-<id>-<w>x<h>-<ext>.`
		);
	}

	const [, id, width, height, extension] = match;
	return { id, width: Number(width), height: Number(height), extension };
}

/**
 * Build an email-safe Sanity CDN URL.
 *
 * @param {string|{asset?: {_ref?: string}, _ref?: string}} source
 *   A Sanity asset reference string, or an image object carrying one.
 * @param {object} [options]
 * @param {number} [options.w]        Source width in px. Serve 2x the display slot.
 * @param {number} [options.h]        Source height in px.
 * @param {'jpg'|'png'|'gif'} [options.fm]  Pinned format. Defaults by content:
 *   photography is jpg, anything needing transparency is png.
 * @param {number} [options.q]        Quality, 1-100.
 * @param {'crop'|'clip'|'fill'|'max'|'min'|'scale'} [options.fit]
 * @param {boolean} [options.transparent] Shorthand: forces png.
 * @returns {string}
 */
export function buildEmailImageUrl(source, options = {}) {
	const ref = typeof source === 'string' ? source : (source?.asset?._ref ?? source?._ref);

	if (!ref) {
		throw new Error('buildEmailImageUrl: no asset reference found on the source.');
	}

	const { id, width, height, extension } = parseAssetRef(ref);

	const format = options.fm ?? (options.transparent ? imageTokens.graphicFormat : inferFormat(extension));

	if (!imageTokens.allowedFormats.includes(format)) {
		throw new Error(
			`Format "${format}" is not email-safe. Allowed: ${imageTokens.allowedFormats.join(', ')}. ` +
				`SVG, WebP and AVIF do not render across the client matrix.`
		);
	}

	const params = new URLSearchParams();

	if (options.w) params.set('w', String(options.w));
	if (options.h) params.set('h', String(options.h));
	if (options.fit) params.set('fit', options.fit);

	params.set('fm', format);
	params.set('q', String(options.q ?? imageTokens.defaultQuality));

	// GIF must not be re-encoded to a still frame.
	if (format === 'gif') params.delete('q');

	const file = `${id}-${width}x${height}.${extension}`;

	return `${CDN_HOST}/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${file}?${params.toString()}`;
}

/**
 * A full-bleed image sized for the 600px column at 2x.
 * @param {*} source
 * @param {object} [options]
 */
export function fullWidthImage(source, options = {}) {
	const slot = options.slot ?? imageTokens.fullWidthSlot;
	const ratio = options.ratio ?? 2 / 3; // height / width, the site's 3:2 card ratio

	return {
		src: buildEmailImageUrl(source, {
			w: slot * 2,
			h: Math.round(slot * 2 * ratio),
			fit: 'crop',
			fm: options.fm,
			q: options.q
		}),
		// Attribute dimensions describe the DISPLAY slot, not the source file, so
		// clients that honour width/height reserve the right box.
		width: slot,
		height: Math.round(slot * ratio)
	};
}

/**
 * The display dimensions for a source constrained to a slot, preserving aspect.
 * @param {string} ref
 * @param {number} slot
 */
export function displayDimensions(ref, slot) {
	const { width, height } = parseAssetRef(ref);
	const scale = slot / width;

	return { width: slot, height: Math.round(height * scale) };
}

function inferFormat(extension) {
	if (extension === 'gif') return 'gif';
	if (extension === 'png') return imageTokens.graphicFormat;
	return imageTokens.photoFormat;
}
