import type { GeoPoint } from '$lib/sanity/transforms/mapPrivacy';

/** Half-width of the bounding box drawn around the community pin, in degrees. */
const BBOX_DELTA = 0.04;

/** Embeddable OpenStreetMap iframe URL centred on the community pin. */
export function buildOsmEmbedUrl(coords: GeoPoint | null | undefined): string | null {
	if (!coords) return null;
	const left = coords.lng - BBOX_DELTA;
	const right = coords.lng + BBOX_DELTA;
	const top = coords.lat + BBOX_DELTA;
	const bottom = coords.lat - BBOX_DELTA;
	return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`;
}

/** Full OpenStreetMap page URL for the same pin, for an "open in new tab" link. */
export function buildOsmExternalUrl(coords: GeoPoint | null | undefined): string | null {
	if (!coords) return null;
	return `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=14/${coords.lat}/${coords.lng}`;
}
