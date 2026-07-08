import {
	FIXTURE_ASSET_TAGS,
	FIXTURE_GHI_IDS,
	FIXTURE_IDS,
	FIXTURE_SLUGS
} from './constants';

export type UploadedAssets = Record<(typeof FIXTURE_ASSET_TAGS)[keyof typeof FIXTURE_ASSET_TAGS], string>;

function imageRef(assetId: string) {
	return {
		_type: 'image' as const,
		asset: { _type: 'reference' as const, _ref: assetId }
	};
}

function verificationLocation(countryId: string, locationId: string, communityId: string) {
	return {
		_type: 'locationFields' as const,
		country: { _type: 'reference' as const, _ref: countryId },
		location: { _type: 'reference' as const, _ref: locationId },
		community: { _type: 'reference' as const, _ref: communityId },
		addressDisplay: 'Costa del Sol, Spain (verification fixture)'
	};
}

function mediaAsset(assetId: string, altText: string) {
	return {
		_type: 'mediaAssetMetadata' as const,
		asset: imageRef(assetId),
		altText
	};
}

function baseContent(title: string) {
	return {
		_type: 'contentFields' as const,
		shortDescription: `${title} — verification fixture for privacy gate testing.`
	};
}

/** Shared location taxonomy used by all verification listings. */
export function buildLocationDocuments() {
	return [
		{
			_id: FIXTURE_IDS.country,
			_type: 'locationTaxonomy',
			name: 'Spain (verification)',
			slug: { _type: 'slug', current: FIXTURE_SLUGS.country },
			type: 'country',
			breadcrumbLabel: 'Spain',
			publicDescription: 'Verification fixture country stub.'
		},
		{
			_id: FIXTURE_IDS.location,
			_type: 'locationTaxonomy',
			name: 'Costa del Sol (verification)',
			slug: { _type: 'slug', current: FIXTURE_SLUGS.location },
			type: 'location',
			parent: { _type: 'reference', _ref: FIXTURE_IDS.country },
			breadcrumbLabel: 'Costa del Sol',
			publicDescription: 'Verification fixture location stub.'
		},
		{
			_id: FIXTURE_IDS.community,
			_type: 'locationTaxonomy',
			name: 'Verification Community',
			slug: { _type: 'slug', current: FIXTURE_SLUGS.community },
			type: 'community',
			parent: { _type: 'reference', _ref: FIXTURE_IDS.location },
			breadcrumbLabel: 'Verification Community',
			publicDescription: 'Verification fixture community stub.',
			coordinates: { _type: 'geopoint', lat: 36.484, lng: -4.952 }
		}
	];
}

/** Fixture 1: fully published property — must render with price and approved hero. */
export function buildGoldenProperty(assets: UploadedAssets) {
	return {
		_id: FIXTURE_IDS.goldenProperty,
		_type: 'propertyListing',
		ghiListingId: FIXTURE_GHI_IDS.goldenProperty,
		title: 'Verification Golden Villa',
		slug: { _type: 'slug', current: FIXTURE_SLUGS.goldenProperty },
		listingKind: 'property',
		propertyType: 'villa',
		transactionType: 'sale',
		status: 'published',
		location: verificationLocation(FIXTURE_IDS.country, FIXTURE_IDS.location, FIXTURE_IDS.community),
		pricing: {
			_type: 'propertyPricingFields',
			price: 895_000,
			priceDisplay: '895000',
			currency: 'EUR'
		},
		specs: {
			_type: 'specsFields',
			bedrooms: 4,
			bathrooms: 3,
			builtArea: 280,
			builtAreaUnit: 'sqm',
			pool: 'private'
		},
		content: baseContent('Verification Golden Villa'),
		media: {
			_type: 'mediaFields',
			gallery: [
				mediaAsset(
					assets[FIXTURE_ASSET_TAGS.approvedHero],
					'Approved hero — verification golden villa'
				),
				mediaAsset(
					assets[FIXTURE_ASSET_TAGS.approvedGallery],
					'Approved gallery image — verification golden villa'
				)
			]
		}
	};
}

/** Fixture 2: published development with unconfirmed price (POA) and a reserved child unit (locked row). */
export function buildPrivacyDevelopmentStub(assets: UploadedAssets) {
	return {
		_id: FIXTURE_IDS.privacyDevelopment,
		_type: 'development',
		ghiListingId: FIXTURE_GHI_IDS.privacyDevelopment,
		title: 'Verification Privacy Units',
		slug: { _type: 'slug', current: FIXTURE_SLUGS.privacyDevelopment },
		listingKind: 'development',
		developmentDisplayMode: 'units',
		status: 'published',
		location: verificationLocation(FIXTURE_IDS.country, FIXTURE_IDS.location, FIXTURE_IDS.community),
		pricing: {
			_type: 'pricingFields',
			priceDisplay: 'POA',
			currency: 'EUR',
			priceConfirmed: false,
			availabilityStatus: 'available'
		},
		availabilitySummary: '1 unit available, 1 reserved',
		content: baseContent('Verification Privacy Units Development'),
		media: {
			_type: 'mediaFields',
			gallery: [
				mediaAsset(assets[FIXTURE_ASSET_TAGS.approvedHero], 'Approved development hero')
			]
		},
		units: []
	};
}

export function buildPrivacyDevelopmentUnits() {
	const unitAvailable = {
		_id: FIXTURE_IDS.unitAvailable,
		_type: 'unit',
		unitName: 'Villa A (available)',
		unitNumber: 'A',
		slug: { _type: 'slug', current: 'villa-a' },
		parentDevelopment: { _type: 'reference', _ref: FIXTURE_IDS.privacyDevelopment },
		listingKind: 'unit',
		status: 'published',
		pricing: {
			_type: 'pricingFields',
			price: 650_000,
			priceDisplay: '650000',
			currency: 'EUR',
			priceConfirmed: true,
			availabilityStatus: 'available'
		},
		specs: {
			_type: 'specsFields',
			bedrooms: 3,
			bathrooms: 2,
			builtArea: 180,
			builtAreaUnit: 'sqm'
		}
	};

	const unitReserved = {
		_id: FIXTURE_IDS.unitReserved,
		_type: 'unit',
		unitName: 'Villa B (reserved — locked row)',
		unitNumber: 'B',
		slug: { _type: 'slug', current: 'villa-b' },
		parentDevelopment: { _type: 'reference', _ref: FIXTURE_IDS.privacyDevelopment },
		listingKind: 'unit',
		status: 'published',
		pricing: {
			_type: 'pricingFields',
			price: 720_000,
			priceDisplay: '720000',
			currency: 'EUR',
			priceConfirmed: true,
			availabilityStatus: 'reserved'
		},
		specs: {
			_type: 'specsFields',
			bedrooms: 4,
			bathrooms: 3,
			builtArea: 210,
			builtAreaUnit: 'sqm'
		}
	};

	return [unitAvailable, unitReserved];
}

export function buildPrivacyDevelopmentWithUnits(assets: UploadedAssets) {
	return {
		...buildPrivacyDevelopmentStub(assets),
		units: [
			{ _type: 'reference', _ref: FIXTURE_IDS.unitAvailable, _key: 'unit-a' },
			{ _type: 'reference', _ref: FIXTURE_IDS.unitReserved, _key: 'unit-b' }
		]
	};
}

/** @deprecated Use ordered builders in seed script instead. */
export function buildPrivacyDevelopmentDocuments(assets: UploadedAssets) {
	return [...buildPrivacyDevelopmentUnits(), buildPrivacyDevelopmentWithUnits(assets)];
}

/** Fixture 3: property with placeholder first in gallery — public output uses first item with a file. */
export function buildMediaPrivacyProperty(assets: UploadedAssets) {
	return {
		_id: FIXTURE_IDS.mediaPrivacyProperty,
		_type: 'propertyListing',
		ghiListingId: FIXTURE_GHI_IDS.mediaPrivacyProperty,
		title: 'Verification Media Privacy Villa',
		slug: { _type: 'slug', current: FIXTURE_SLUGS.mediaPrivacyProperty },
		listingKind: 'property',
		propertyType: 'villa',
		transactionType: 'sale',
		status: 'published',
		location: verificationLocation(FIXTURE_IDS.country, FIXTURE_IDS.location, FIXTURE_IDS.community),
		pricing: {
			_type: 'propertyPricingFields',
			price: 750_000,
			priceDisplay: '750000',
			currency: 'EUR'
		},
		specs: {
			_type: 'specsFields',
			bedrooms: 3,
			bathrooms: 2,
			builtArea: 200,
			builtAreaUnit: 'sqm'
		},
		content: baseContent('Verification Media Privacy Villa'),
		media: {
			_type: 'mediaFields',
			gallery: [
				{
					_type: 'mediaAssetMetadata',
					altText: 'Gallery placeholder without uploaded file'
				},
				mediaAsset(
					assets[FIXTURE_ASSET_TAGS.approvedGallery],
					'Gallery image — should appear publicly'
				)
			]
		}
	};
}

export function buildAllVerificationDocuments(assets: UploadedAssets) {
	return [
		...buildLocationDocuments(),
		buildGoldenProperty(assets),
		buildPrivacyDevelopmentStub(assets),
		...buildPrivacyDevelopmentUnits(),
		buildPrivacyDevelopmentWithUnits(assets),
		buildMediaPrivacyProperty(assets)
	];
}
