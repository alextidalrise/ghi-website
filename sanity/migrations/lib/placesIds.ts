/** Stable, anonymous-API-visible place taxonomy IDs (no dots). */
export function stablePlacesId(type: string, slug: string): string {
	return `places-${type}-${slug}`;
}

const DOTTED_LEVELS = ['country', 'location', 'community'] as const;

/** Parse places.country.spain / location.location.marbella dotted taxonomy IDs. */
export function parseDottedPlacesId(id: string): { type: string; slug: string } | null {
	for (const namespace of ['places', 'location'] as const) {
		for (const level of DOTTED_LEVELS) {
			const prefix = `${namespace}.${level}.`;
			if (id.startsWith(prefix)) {
				return { type: level, slug: id.slice(prefix.length) };
			}
		}
	}

	// Legacy dotted shapes from earlier hierarchy migrations.
	if (id.startsWith('location.municipality.')) {
		return { type: 'location', slug: id.slice('location.municipality.'.length) };
	}
	if (id.startsWith('location.area.')) {
		return { type: 'location', slug: id.slice('location.area.'.length) };
	}
	if (id.startsWith('location.subarea.')) {
		return { type: 'community', slug: id.slice('location.subarea.'.length) };
	}

	return null;
}

export function legacyRefToStablePlacesId(refId: string): string | null {
	const parsed = parseDottedPlacesId(refId);
	return parsed ? stablePlacesId(parsed.type, parsed.slug) : null;
}
