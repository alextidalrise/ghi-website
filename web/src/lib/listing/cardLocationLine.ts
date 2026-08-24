/** The location fields a listing card carries, narrowed to what the line needs. */
export type CardLocationLike =
	| {
			location?: { name: string } | null;
			community?: { name: string } | null;
			addressDisplay?: string | null;
	  }
	| null
	| undefined;

/**
 * The single location line shown beneath a listing card's title.
 *
 * Prefers the community name, then the wider area, then the full address —
 * skipping any segment that just echoes the title. Some Murcia/Alicante
 * listings have no unique title and borrow their community name as the title,
 * so without the echo check the community renders twice (once as the heading,
 * again on the line beneath). The earlier fix returned `null` in that case,
 * which dropped the wider area (e.g. Murcia) along with the duplicate; falling
 * through to the next non-echo segment keeps a location on the card.
 */
export function resolveCardLocationLine(
	location: CardLocationLike,
	title: string | null | undefined
): string | null {
	const normalizedTitle = title?.trim().toLowerCase() ?? '';
	const isEcho = (value?: string | null) =>
		!!value && value.trim().toLowerCase() === normalizedTitle;

	const candidates = [location?.community?.name, location?.location?.name, location?.addressDisplay];
	for (const candidate of candidates) {
		if (candidate && !isEcho(candidate)) return candidate;
	}
	return null;
}
