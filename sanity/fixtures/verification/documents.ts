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

function approvedWorkflow() {
	return {
		_type: 'workflowFields' as const,
		contentStatus: 'published',
		publishReadiness: 'approved_for_publish',
		approvedBy: 'verification-fixture',
		approvedAt: '2026-05-22T12:00:00.000Z',
		humanReviewed: true
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
		location: verificationLocation(FIXTURE_IDS.country, FIXTURE_IDS.location, FIXTURE_IDS.community),
		pricing: {
			_type: 'pricingFields',
			price: 895_000,
			priceDisplay: '895000',
			currency: 'EUR',
			priceQualifier: 'guide',
			priceSourceStatus: 'source_confirmed',
			availabilityStatus: 'available',
			publicVisibility: 'visible'
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
		},
		workflow: approvedWorkflow()
	};
}

/** Fixture 2: development with folder_hint_only pricing and a reserved child unit. */
export function buildPrivacyDevelopmentStub(assets: UploadedAssets) {
	return {
		_id: FIXTURE_IDS.privacyDevelopment,
		_type: 'development',
		ghiListingId: FIXTURE_GHI_IDS.privacyDevelopment,
		developmentName: 'Verification Privacy Units',
		title: 'Verification Privacy Units Development',
		slug: { _type: 'slug', current: FIXTURE_SLUGS.privacyDevelopment },
		listingKind: 'development',
		developmentDisplayMode: 'units',
		location: verificationLocation(FIXTURE_IDS.country, FIXTURE_IDS.location, FIXTURE_IDS.community),
		pricing: {
			_type: 'pricingFields',
			priceDisplay: 'POA',
			currency: 'EUR',
			priceSourceStatus: 'folder_hint_only',
			availabilityStatus: 'available',
			publicVisibility: 'visible'
		},
		availabilitySummary: '1 unit available (1 reserved — hidden from public)',
		content: baseContent('Verification Privacy Units Development'),
		media: {
			_type: 'mediaFields',
			gallery: [
				mediaAsset(assets[FIXTURE_ASSET_TAGS.approvedHero], 'Approved development hero')
			]
		},
		units: [],
		workflow: approvedWorkflow()
	};
}

export function buildPrivacyDevelopmentUnits() {
	const unitAvailable = {
		_id: FIXTURE_IDS.unitAvailable,
		_type: 'unit',
		unitName: 'Villa A (available)',
		unitNumber: 'A',
		parentDevelopment: { _type: 'reference', _ref: FIXTURE_IDS.privacyDevelopment },
		listingKind: 'unit',
		pricing: {
			_type: 'pricingFields',
			price: 650_000,
			priceDisplay: '650000',
			currency: 'EUR',
			priceSourceStatus: 'source_confirmed',
			availabilityStatus: 'available',
			publicVisibility: 'visible'
		},
		specs: {
			_type: 'specsFields',
			bedrooms: 3,
			bathrooms: 2,
			builtArea: 180,
			builtAreaUnit: 'sqm'
		},
		workflow: approvedWorkflow()
	};

	const unitReserved = {
		_id: FIXTURE_IDS.unitReserved,
		_type: 'unit',
		unitName: 'Villa B (reserved — must not appear publicly)',
		unitNumber: 'B',
		parentDevelopment: { _type: 'reference', _ref: FIXTURE_IDS.privacyDevelopment },
		listingKind: 'unit',
		pricing: {
			_type: 'pricingFields',
			price: 720_000,
			priceDisplay: '720000',
			currency: 'EUR',
			priceSourceStatus: 'source_confirmed',
			availabilityStatus: 'reserved',
			publicVisibility: 'hidden'
		},
		specs: {
			_type: 'specsFields',
			bedrooms: 4,
			bathrooms: 3,
			builtArea: 210,
			builtAreaUnit: 'sqm'
		},
		workflow: approvedWorkflow()
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
		location: verificationLocation(FIXTURE_IDS.country, FIXTURE_IDS.location, FIXTURE_IDS.community),
		pricing: {
			_type: 'pricingFields',
			price: 750_000,
			priceDisplay: '750000',
			currency: 'EUR',
			priceSourceStatus: 'source_confirmed',
			availabilityStatus: 'available',
			publicVisibility: 'visible'
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
		},
		workflow: approvedWorkflow()
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
