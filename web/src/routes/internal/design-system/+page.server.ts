import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	goldenPropertyRaw,
	mediaPrivacyPropertyRaw
} from '$lib/sanity/verification/fixture-payloads';
import {
	toPublicPropertyCard,
	type PublicPropertyCard,
	type RawPropertyCard
} from '$lib/sanity/transforms/propertyCard';
import type { RawPropertyListing } from '$lib/sanity/transforms';
import type { PageServerLoad } from './$types';

export const prerender = false;

function canViewDesignSystem(): boolean {
	return env.ENABLE_DESIGN_SYSTEM === 'true' || env.VERCEL_ENV !== 'production';
}

function cardLocationFromFixture(raw: RawPropertyListing): RawPropertyCard['location'] {
	const location = raw.location!;
	return {
		country: { name: location.country!.name!, slug: location.country!.slug! },
		location: { name: location.location!.name!, slug: location.location!.slug! },
		community: {
			name: location.community!.name!,
			slug: location.community!.slug!
		},
		addressDisplay: location.addressDisplay!
	};
}

function rawCardFromFixture(
	raw: RawPropertyListing,
	overrides: Partial<RawPropertyCard> = {}
): RawPropertyCard {
	return {
		_id: raw._id!,
		ghiListingId: raw.ghiListingId!,
		title: raw.title!,
		slug: raw.slug!,
		listingKind: raw.listingKind as RawPropertyCard['listingKind'],
		propertyType: raw.propertyType as RawPropertyCard['propertyType'],
		transactionType: raw.transactionType as RawPropertyCard['transactionType'],
		location: cardLocationFromFixture(raw),
		pricing: raw.pricing as RawPropertyCard['pricing'],
		specs: raw.specs as RawPropertyCard['specs'],
		media: raw.media as RawPropertyCard['media'],
		...overrides
	};
}

function buildDemoCards(): PublicPropertyCard[] {
	const demoImage = '/design-system/assets/andalucia-golf-villa.png';

	const golden = toPublicPropertyCard(
		rawCardFromFixture(goldenPropertyRaw, { media: null })
	);
	const poa = toPublicPropertyCard(
		rawCardFromFixture(goldenPropertyRaw, {
			_id: 'verificationFixture.property.poa',
			title: 'Verification POA Villa',
			slug: 'verification-poa-villa',
			media: null,
			pricing: {
				price: 650_000,
				priceFrom: 650_000,
				priceTo: 720_000,
				priceDisplay: 'POA',
				currency: 'EUR',
				priceSourceStatus: 'folder_hint_only',
				availabilityStatus: 'available',
				completionStatus: null,
				completionDate: null,
				buildStatus: null,
				priceQualifier: null
			}
		})
	);
	const noImage = toPublicPropertyCard(
		rawCardFromFixture(mediaPrivacyPropertyRaw, { media: null })
	);

	return [
		{
			...golden,
			heroImageUrl: demoImage,
			heroImageAlt: 'Andalucian golf villa with a pool and fairway view'
		},
		{
			...poa,
			heroImageUrl: demoImage,
			heroImageAlt: 'Andalucian golf villa with a pool and fairway view'
		},
		noImage
	];
}

export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({
		'X-Robots-Tag': 'noindex, nofollow, noarchive'
	});

	if (!canViewDesignSystem()) {
		error(404, 'Not found');
	}

	return {
		demoCards: buildDemoCards()
	};
};
