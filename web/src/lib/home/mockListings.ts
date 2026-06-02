/**
 * DEV-ONLY mock listing cards for designing the homepage Featured / Frontline
 * sections without a live Sanity connection (local Studio returns 403).
 *
 * TO REMOVE: delete this file and restore the real fetches in
 * `src/routes/+page.server.ts` (see the DEV MOCK block there).
 */
import type { PublicPropertyCard } from '$lib/sanity/transforms/propertyCard';

const LOC = '/design-system/assets/locations';

type Place = {
	country: [name: string, slug: string];
	location: [name: string, slug: string];
	community: [name: string, slug: string];
	address: string;
};

function mockCard(
	id: number,
	title: string,
	image: string,
	place: Place,
	propertyType: PublicPropertyCard['propertyType'],
	bedrooms: number,
	bathrooms: number,
	price: number
): PublicPropertyCard {
	return {
		_id: `mock-${id}`,
		ghiListingId: `GHI-MOCK-${id}`,
		publicTitle: title,
		slug: `mock-listing-${id}`,
		listingKind: 'property',
		propertyType,
		transactionType: 'sale',
		location: {
			country: { name: place.country[0], slug: place.country[1] },
			location: { name: place.location[0], slug: place.location[1] },
			community: { name: place.community[0], slug: place.community[1] },
			addressDisplay: place.address
		},
		pricing: { price, currency: 'EUR' },
		specs: { bedrooms, bathrooms, builtArea: null, builtAreaUnit: null },
		heroImageUrl: image,
		heroImageAlt: title
	};
}

const marbella: Place = {
	country: ['Spain', 'spain'],
	location: ['Marbella', 'marbella'],
	community: ['Los Naranjos', 'los-naranjos'],
	address: 'Marbella, Spain'
};
const sotogrande: Place = {
	country: ['Spain', 'spain'],
	location: ['Sotogrande', 'sotogrande'],
	community: ['Valderrama', 'valderrama'],
	address: 'Sotogrande, Spain'
};
const estepona: Place = {
	country: ['Spain', 'spain'],
	location: ['Estepona', 'estepona'],
	community: ['El Paraíso', 'el-paraiso'],
	address: 'Estepona, Spain'
};
const algarve: Place = {
	country: ['Portugal', 'portugal'],
	location: ['Algarve', 'algarve'],
	community: ['Vilamoura', 'vilamoura'],
	address: 'Vilamoura, Portugal'
};
const comporta: Place = {
	country: ['Portugal', 'portugal'],
	location: ['Comporta', 'comporta'],
	community: ['Quinta do Lago', 'quinta-do-lago'],
	address: 'Quinta do Lago, Portugal'
};
const cascais: Place = {
	country: ['Portugal', 'portugal'],
	location: ['Cascais', 'cascais'],
	community: ['Quinta da Marinha', 'quinta-da-marinha'],
	address: 'Cascais, Portugal'
};

export const MOCK_FEATURED_CARDS: PublicPropertyCard[] = [
	mockCard(1, 'Villa Los Naranjos', `${LOC}/loc-marbella.jpg`, marbella, 'villa', 4, 5, 2150000),
	mockCard(2, 'Vilamoura Apartment', `${LOC}/loc-algarve.jpg`, algarve, 'apartment', 3, 2, 895000),
	mockCard(3, 'Casa Valderrama', `${LOC}/loc-sotogrande.jpg`, sotogrande, 'villa', 5, 6, 4250000),
	mockCard(4, 'Quinta do Lago Townhouse', `${LOC}/loc-comporta.jpg`, comporta, 'townhouse', 4, 3, 1650000),
	mockCard(5, 'Estepona Penthouse', `${LOC}/loc-estepona.jpg`, estepona, 'penthouse', 3, 3, 1950000),
	mockCard(6, 'Cascais Retreat', `${LOC}/loc-cascais.jpg`, cascais, 'villa', 4, 4, 2950000)
];

export const MOCK_FRONTLINE_CARDS: PublicPropertyCard[] = [
	mockCard(11, 'Villa Los Naranjos', `${LOC}/loc-marbella.jpg`, marbella, 'villa', 4, 5, 2450000),
	mockCard(12, 'Quinta do Lago Estate', `${LOC}/loc-comporta.jpg`, comporta, 'villa', 6, 7, 3750000),
	mockCard(13, 'Casa Valderrama', `${LOC}/loc-estepona.jpg`, sotogrande, 'villa', 5, 6, 5950000),
	mockCard(14, 'Vilamoura Fairway Villa', `${LOC}/loc-algarve.jpg`, algarve, 'villa', 5, 5, 2750000),
	mockCard(15, 'Cascais Greenside Retreat', `${LOC}/loc-cascais.jpg`, cascais, 'villa', 4, 4, 2950000)
];
