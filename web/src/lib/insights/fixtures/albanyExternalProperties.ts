import type { InsightExternalPropertyGridBlock } from '$lib/insights/types';

/**
 * The canonical four-card Albany Global Property fixture for the launch article
 * "Meet Albany Global Property: Private Rental Stays in Spain and Portugal".
 *
 * This is the PROJECTED (post-GROQ) shape — internal approval fields (`sourceNote`, `checkedAt`)
 * are stripped at query time and are absent here by construction. The facts, from-prices, CTA label
 * and locked card order match the editorial pack; the card copy and alt text below are
 * representative stand-ins for the pack's approved text (the real copy is authored in Sanity).
 *
 * Note: Villa Margarita's partner URL still reads `villa-serena` — the public page was renamed but
 * the slug was not. The href is intentionally kept as the partner serves it.
 */
export const albanyExternalPropertyGrid: InsightExternalPropertyGridBlock = {
	_type: 'insightExternalPropertyGrid',
	_key: 'albany-rentals',
	heading: 'Four Albany Global Property rentals',
	priceNote: 'Prices and availability are provided by Albany Global Property and may change.',
	items: [
		{
			_key: 'herdade-do-sol',
			name: 'Herdade do Sol',
			location: 'Comporta, Portugal',
			guests: 12,
			bedrooms: 6,
			fromPrice: '€2,250 per night',
			description:
				'A low-slung estate house set among the rice paddies and umbrella pines of Comporta, with a long saltwater pool, shaded terraces and easy access to the wild Atlantic beaches. Room for a large family or two, minutes from the village.',
			features: ['Private pool', 'Beach nearby', 'Sleeps 12'],
			image: {
				asset: { _type: 'image', asset: { _ref: 'image-herdade-do-sol' } },
				altText: 'Whitewashed Comporta estate house with a long pool framed by pines'
			},
			linkLabel: 'View on Albany Global Property',
			linkHref: 'https://albany-global.com/properties/herdade-do-sol/'
		},
		{
			_key: 'villa-margarita',
			name: 'Villa Margarita',
			location: 'Marbella, Spain',
			guests: 10,
			bedrooms: 5,
			fromPrice: '€2,200 per night',
			description:
				'A contemporary villa on the Golden Mile, walking distance to the beach and Puerto Banús. Floor-to-ceiling glass opens the living space onto a heated pool and manicured garden, with a home cinema and gym below.',
			features: ['Golden Mile', 'Heated pool', 'Home cinema'],
			image: {
				asset: { _type: 'image', asset: { _ref: 'image-villa-margarita' } },
				altText: 'Modern Marbella villa lit at dusk beside a heated pool'
			},
			linkLabel: 'View on Albany Global Property',
			linkHref: 'https://albany-global.com/properties/villa-serena/'
		},
		{
			_key: 'villa-golfe-norte',
			name: 'Villa Golfe Norte',
			location: 'Algarve, Portugal',
			guests: 10,
			bedrooms: 5,
			fromPrice: '€1,500 per night',
			description:
				'A golf-front villa in the western Algarve, overlooking the fairways from a broad sun terrace. Five en-suite bedrooms, an infinity pool and a short drive to the beaches and marinas of the Vilamoura coast.',
			features: ['Golf front', 'Infinity pool', 'En-suite rooms'],
			image: {
				asset: { _type: 'image', asset: { _ref: 'image-villa-golfe-norte' } },
				altText: 'Algarve villa with an infinity pool above a golf course'
			},
			linkLabel: 'View on Albany Global Property',
			linkHref: 'https://albany-global.com/properties/villa-golfe-norte/'
		},
		{
			_key: 'ocaso-penthouse',
			name: 'Ocaso Penthouse',
			location: 'Marbella, Spain',
			guests: 6,
			bedrooms: 3,
			fromPrice: '€300 per night',
			description:
				'A bright three-bedroom penthouse with a wraparound terrace and sea views over Marbella. A shared resort pool, a covered dining terrace and a short walk to the old town make it an easy base for a smaller party.',
			features: ['Sea views', 'Roof terrace', 'Resort pool'],
			image: {
				asset: { _type: 'image', asset: { _ref: 'image-ocaso-penthouse' } },
				altText: 'Marbella penthouse terrace with sea views at sunset'
			},
			linkLabel: 'View on Albany Global Property',
			linkHref: 'https://albany-global.com/properties/ocaso-penthouse/'
		}
	]
};
