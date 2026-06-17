import type { GeoPoint } from '$lib/sanity/transforms/mapPrivacy';
import { buildGolfCourseRefHref, type PublicGolf } from '$lib/sanity/transforms';

/** A single golf course rendered as an exact pin on the area map. */
export type GolfPin = {
	name: string;
	href: string | null;
	coordinates: GeoPoint;
};

function hasCoords(value: GeoPoint | null | undefined): value is GeoPoint {
	return Boolean(value && Number.isFinite(value.lat) && Number.isFinite(value.lng));
}

/**
 * Collect the golf courses linked to a listing that carry coordinates, as map
 * pins. Courses without coordinates are skipped — they still appear in the
 * paired legend, just without a pin. De-duped by course id.
 */
export function buildGolfPins(golf: PublicGolf | null | undefined): GolfPin[] {
	if (!golf) return [];

	const pins: GolfPin[] = [];
	const seen = new Set<string>();

	for (const course of golf.linkedGolfCourses ?? []) {
		const key = course?._id ?? course?.name;
		if (!course?.name || !key || seen.has(key) || !hasCoords(course.coordinates)) {
			continue;
		}
		seen.add(key);
		pins.push({
			name: course.name,
			href: buildGolfCourseRefHref(course),
			coordinates: course.coordinates
		});
	}

	return pins;
}
