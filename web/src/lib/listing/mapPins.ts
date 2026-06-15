import type { GeoPoint } from '$lib/sanity/transforms/mapPrivacy';
import { buildGolfCourseRefHref, type PublicGolf } from '$lib/sanity/transforms';

/** A single golf course rendered as an exact pin on the area map. */
export type GolfPin = {
	name: string;
	href: string | null;
	coordinates: GeoPoint;
	/** Distance label, only known for the primary course. */
	distance: string | null;
	isPrimary: boolean;
};

function hasCoords(value: GeoPoint | null | undefined): value is GeoPoint {
	return Boolean(value && Number.isFinite(value.lat) && Number.isFinite(value.lng));
}

/**
 * Collect the golf courses linked to a listing that carry coordinates, as map
 * pins. The primary course leads (and is the only one with a distance label);
 * linked courses follow. Courses without coordinates are skipped — they still
 * appear in the paired legend, just without a pin. De-duped by course id so a
 * course listed as both primary and linked pins once.
 */
export function buildGolfPins(golf: PublicGolf | null | undefined): GolfPin[] {
	if (!golf) return [];

	const pins: GolfPin[] = [];
	const seen = new Set<string>();

	const primary = golf.primaryGolfCourse;
	if (primary?.name && hasCoords(primary.coordinates)) {
		seen.add(primary._id ?? primary.name);
		pins.push({
			name: primary.name,
			href: buildGolfCourseRefHref(primary),
			coordinates: primary.coordinates,
			distance: golf.distanceToPrimaryGolfCourse ?? null,
			isPrimary: true
		});
	}

	for (const course of golf.linkedGolfCourses ?? []) {
		const key = course?._id ?? course?.name;
		if (!course?.name || !key || seen.has(key) || !hasCoords(course.coordinates)) {
			continue;
		}
		seen.add(key);
		pins.push({
			name: course.name,
			href: buildGolfCourseRefHref(course),
			coordinates: course.coordinates,
			distance: null,
			isPrimary: false
		});
	}

	return pins;
}
