export type GeoPoint = {
	lat: number;
	lng: number;
};

export type MapPrivacyLevel = 'exact' | 'approximate' | 'area_only' | 'hidden';

export type LocationTaxonomyRef = {
	_id?: string;
	name?: string | null;
	slug?: string | null;
	type?: string | null;
	breadcrumbLabel?: string | null;
};

export type LocationMapInput = {
	country?: LocationTaxonomyRef | null;
	location?: LocationTaxonomyRef | null;
	community?: LocationTaxonomyRef | null;
	mapPrivacyLevel?: MapPrivacyLevel | string | null;
	mapDisplayApproved?: boolean | null;
	coordinates?: GeoPoint | null;
	addressDisplay?: string | null;
};

export type PublicMapPayload = {
	level: MapPrivacyLevel | 'none';
	coordinates: GeoPoint | null;
	label: string | null;
};

const APPROXIMATE_JITTER_METRES = 400;
const AREA_ONLY_JITTER_METRES = 2500;

/** Deterministic pseudo-random offset in metres so jitter is stable per coordinate. */
function jitterCoordinates(point: GeoPoint, metres: number, salt: string): GeoPoint {
	const seed = Math.sin(point.lat * 12.9898 + point.lng * 78.233 + hashString(salt)) * 43758.5453;
	const fraction = seed - Math.floor(seed);
	const bearing = fraction * 2 * Math.PI;
	const latOffset = (metres * Math.cos(bearing)) / 111_320;
	const lngOffset =
		(metres * Math.sin(bearing)) / (111_320 * Math.cos((point.lat * Math.PI) / 180));

	return {
		lat: roundCoord(point.lat + latOffset),
		lng: roundCoord(point.lng + lngOffset)
	};
}

function hashString(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash << 5) - hash + value.charCodeAt(i);
		hash |= 0;
	}
	return hash;
}

function roundCoord(value: number): number {
	return Math.round(value * 1_000_000) / 1_000_000;
}

/**
 * Transform raw location map fields into a public-safe map payload.
 * Raw coordinates never leave this function on the response object.
 */
export function transformMapPrivacy(location: LocationMapInput | null | undefined): PublicMapPayload {
	if (!location) {
		return { level: 'none', coordinates: null, label: null };
	}

	const level = (location.mapPrivacyLevel ?? 'hidden') as MapPrivacyLevel;
	const label = location.addressDisplay ?? location.location?.name ?? null;
	const raw = location.coordinates;

	if (level === 'hidden' || !raw?.lat || !raw?.lng) {
		return { level: level === 'hidden' ? 'hidden' : 'none', coordinates: null, label };
	}

	if (level === 'exact') {
		if (!location.mapDisplayApproved) {
			return { level: 'hidden', coordinates: null, label };
		}
		return {
			level: 'exact',
			coordinates: { lat: raw.lat, lng: raw.lng },
			label
		};
	}

	if (level === 'approximate') {
		return {
			level: 'approximate',
			coordinates: jitterCoordinates(raw, APPROXIMATE_JITTER_METRES, `${raw.lat},${raw.lng}`),
			label
		};
	}

	if (level === 'area_only') {
		return {
			level: 'area_only',
			coordinates: jitterCoordinates(raw, AREA_ONLY_JITTER_METRES, `area:${location.location?.slug ?? 'x'}`),
			label: location.location?.name ?? label
		};
	}

	return { level: 'none', coordinates: null, label };
}

/** Remove private map governance fields from a location object for the public payload. */
export function stripInternalLocationFields<T extends LocationMapInput>(
	location: T | null | undefined
): Omit<T, 'coordinates' | 'mapDisplayApproved' | 'mapPrivacyLevel'> & { map: PublicMapPayload } | null {
	if (!location) {
		return null;
	}

	const map = transformMapPrivacy(location);
	const { coordinates: _coords, mapDisplayApproved: _approved, mapPrivacyLevel: _level, ...rest } = location;

	return { ...rest, map };
}
