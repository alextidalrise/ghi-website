export type GeoPoint = {
	lat: number;
	lng: number;
};

export type MapDisplayLevel = 'area_only' | 'none';

export type LocationTaxonomyRef = {
	_id?: string;
	name?: string | null;
	slug?: string | null;
	type?: string | null;
	breadcrumbLabel?: string | null;
	coordinates?: GeoPoint | null;
};

export type LocationMapInput = {
	country?: LocationTaxonomyRef | null;
	location?: LocationTaxonomyRef | null;
	community?: LocationTaxonomyRef | null;
	addressDisplay?: string | null;
};

export type PublicMapPayload = {
	level: MapDisplayLevel;
	coordinates: GeoPoint | null;
	label: string | null;
};

/**
 * Build a public map payload from community taxonomy coordinates.
 * Listings never carry their own coordinates — the community pin is shared.
 */
export function transformMapPrivacy(location: LocationMapInput | null | undefined): PublicMapPayload {
	if (!location) {
		return { level: 'none', coordinates: null, label: null };
	}

	const label = location.addressDisplay ?? location.community?.name ?? location.location?.name ?? null;
	const raw = location.community?.coordinates;

	if (!raw?.lat || !raw?.lng) {
		return { level: 'none', coordinates: null, label };
	}

	return {
		level: 'area_only',
		coordinates: { lat: raw.lat, lng: raw.lng },
		label
	};
}

/** Attach derived map payload to a location object for the public response. */
export function stripInternalLocationFields<T extends LocationMapInput>(
	location: T | null | undefined
): (T & { map: PublicMapPayload }) | null {
	if (!location) {
		return null;
	}

	const map = transformMapPrivacy(location);
	return { ...location, map };
}
