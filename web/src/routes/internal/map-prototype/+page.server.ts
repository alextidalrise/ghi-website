import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PublicMapPayload } from '$lib/sanity/transforms/mapPrivacy';
import type { PublicGolf } from '$lib/sanity/transforms';
import type { PortableTextBlock } from '@portabletext/types';
import type { PageServerLoad } from './$types';

export const prerender = false;

/** Same gate as the design-system showcase: dev/preview only, never production. */
function canView(): boolean {
	return env.ENABLE_DESIGN_SYSTEM === 'true' || env.VERCEL_ENV !== 'production';
}

/**
 * Seeded sample for the listing-page area map, set in Marbella's "Golf Valley"
 * (Nueva Andalucía): the community pin plus three real nearby courses with
 * approximate coordinates. The live dev dataset carries neither community nor
 * golf coordinates yet, so this route lets the map be reviewed before any
 * Sanity seeding. Coordinates here are illustrative, not authoritative.
 */
const COMMUNITY = { lat: 36.5099, lng: -4.954 };

const map: PublicMapPayload = {
	level: 'area_only',
	coordinates: COMMUNITY,
	label: 'Nueva Andalucía, Marbella'
};

const golf: PublicGolf = {
	golfRelevance: 'focal',
	distanceToPrimaryGolfCourse: '450 m',
	golfView: true,
	buggyAccess: true,
	golfMembershipInfo: null,
	primaryGolfCourse: {
		_id: 'demo-los-naranjos',
		name: 'Los Naranjos Golf Club',
		slug: 'los-naranjos',
		shortDescription:
			'A Robert Trent Jones Sr. parkland course threading orange groves at the heart of the Golf Valley.',
		coordinates: { lat: 36.5036, lng: -4.9606 },
		countrySlug: 'spain',
		locationSlug: 'costa-del-sol',
		communitySlug: 'nueva-andalucia'
	},
	linkedGolfCourses: [
		{
			_id: 'demo-aloha',
			name: 'Aloha Golf Club',
			slug: 'aloha',
			shortDescription: 'A mature championship layout, regular host of the Andalucía tour events.',
			coordinates: { lat: 36.5083, lng: -4.9686 },
			countrySlug: 'spain',
			locationSlug: 'costa-del-sol',
			communitySlug: 'nueva-andalucia'
		},
		{
			_id: 'demo-las-brisas',
			name: 'Real Club de Golf Las Brisas',
			slug: 'las-brisas',
			shortDescription: 'A storied Trent Jones design with fast greens and water in play across the back nine.',
			coordinates: { lat: 36.4995, lng: -4.9669 },
			countrySlug: 'spain',
			locationSlug: 'costa-del-sol',
			communitySlug: 'nueva-andalucia'
		}
	]
};

const description: PortableTextBlock[] = [
	{
		_type: 'block',
		_key: 'loc1',
		style: 'normal',
		markDefs: [],
		children: [
			{
				_type: 'span',
				_key: 'loc1s1',
				marks: [],
				text:
					"Nueva Andalucía sits in the natural amphitheatre behind Puerto Banús, its valley floor given over almost entirely to golf. Three of the Costa del Sol's most established courses lie within a few minutes' drive, with the Sierra Blanca as a backdrop."
			}
		]
	}
];

export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({ 'X-Robots-Tag': 'noindex, nofollow, noarchive' });
	if (!canView()) {
		error(404, 'Not found');
	}
	return {
		location: {
			description,
			address: 'Nueva Andalucía, Marbella, Costa del Sol',
			map,
			golf
		}
	};
};
