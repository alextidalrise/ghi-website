import type { RawDevelopment, RawPropertyListing } from '../transforms';
import type { MediaAssetInput } from '../transforms/mediaFilter';

const APPROVED_IMAGE_REF = 'image-verification-approved';
const BLOCKED_IMAGE_REF = 'image-verification-blocked';

function imageRef(ref: string) {
	return { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: ref } };
}

function approvedAsset(ref: string, alt: string): MediaAssetInput {
	return {
		asset: imageRef(ref),
		altText: alt,
		assetBrandingType: 'ghi_branded',
		imageRightsStatus: 'approved',
		publicUseApproved: true
	};
}

function blockedAsset(ref: string, alt: string, rights: 'rejected' | 'do_not_use' | 'restricted' = 'rejected'): MediaAssetInput {
	return {
		asset: imageRef(ref),
		altText: alt,
		assetBrandingType: 'third_party_branded',
		imageRightsStatus: rights === 'rejected' ? 'rejected' : rights,
		publicUseApproved: false
	};
}

const sharedLocation = {
	country: { _id: 'c1', name: 'Spain', slug: 'spain', type: 'country' },
	location: { _id: 'a1', name: 'Costa del Sol', slug: 'costa-del-sol-verification', type: 'location' },
	community: {
		_id: 'cm1',
		name: 'Verification Community',
		slug: 'verification-community',
		type: 'community'
	},
	addressDisplay: 'Costa del Sol, Spain',
	mapPrivacyLevel: 'area_only' as const,
	mapDisplayApproved: false
};

/** Raw query-shaped payload for fixture 1 — fully published property. */
export const goldenPropertyRaw: RawPropertyListing = {
	_id: 'verificationFixture.property.golden',
	_type: 'propertyListing',
	ghiListingId: 'GHI99001',
	title: 'Verification Golden Villa',
	slug: 'verification-golden-villa',
	listingKind: 'property',
	propertyType: 'villa',
	transactionType: 'sale',
	location: sharedLocation,
	pricing: {
		price: 895_000,
		priceDisplay: '895000',
		currency: 'EUR',
		priceQualifier: 'guide',
		priceSourceStatus: 'source_confirmed',
		availabilityStatus: 'available',
		publicVisibility: 'visible'
	},
	specs: { bedrooms: 4, bathrooms: 3, builtArea: 280, builtAreaUnit: 'sqm' },
	content: {
		shortDescription: 'Verification golden villa fixture.',
		heroHeadline: 'Verification Golden Villa'
	},
	media: {
		heroImage: approvedAsset(APPROVED_IMAGE_REF, 'Approved hero'),
		gallery: [approvedAsset(APPROVED_IMAGE_REF, 'Approved gallery')]
	}
};

/** Raw query-shaped payload for fixture 2 — development with folder_hint_only + reserved unit. */
export const privacyDevelopmentRaw: RawDevelopment = {
	_id: 'verificationFixture.development.privacy-units',
	_type: 'development',
	ghiListingId: 'GHI99002',
	title: 'Verification Privacy Units Development',
	slug: 'verification-privacy-units',
	listingKind: 'development',
	developmentDisplayMode: 'units',
	location: sharedLocation,
	pricing: {
		priceFrom: 650_000,
		priceTo: 720_000,
		priceDisplay: 'POA',
		currency: 'EUR',
		priceSourceStatus: 'folder_hint_only',
		availabilityStatus: 'available',
		publicVisibility: 'visible'
	},
	content: {
		shortDescription: 'Verification privacy units fixture.',
		heroHeadline: 'Verification Privacy Units Development'
	},
	media: {
		heroImage: approvedAsset(APPROVED_IMAGE_REF, 'Approved development hero')
	},
	units: [
		{
			_id: 'verificationFixture.unit.available-a',
			unitName: 'Villa A (available)',
			pricing: {
				price: 650_000,
				priceDisplay: '650000',
				currency: 'EUR',
				priceSourceStatus: 'source_confirmed',
				availabilityStatus: 'available',
				publicVisibility: 'visible'
			}
		},
		{
			_id: 'verificationFixture.unit.reserved-b',
			unitName: 'Villa B (reserved)',
			pricing: {
				price: 720_000,
				priceDisplay: '720000',
				currency: 'EUR',
				priceSourceStatus: 'source_confirmed',
				availabilityStatus: 'reserved',
				publicVisibility: 'hidden'
			}
		}
	]
};

/** Raw query-shaped payload for fixture 3 — blocked hero + restricted gallery. */
export const mediaPrivacyPropertyRaw: RawPropertyListing = {
	_id: 'verificationFixture.property.media-privacy',
	_type: 'propertyListing',
	ghiListingId: 'GHI99003',
	title: 'Verification Media Privacy Villa',
	slug: 'verification-media-privacy',
	listingKind: 'property',
	propertyType: 'villa',
	transactionType: 'sale',
	location: sharedLocation,
	pricing: {
		price: 750_000,
		priceDisplay: '750000',
		currency: 'EUR',
		priceSourceStatus: 'source_confirmed',
		availabilityStatus: 'available',
		publicVisibility: 'visible'
	},
	specs: { bedrooms: 3, bathrooms: 2, builtArea: 200, builtAreaUnit: 'sqm' },
	content: {
		shortDescription: 'Verification media privacy fixture.',
		heroHeadline: 'Verification Media Privacy Villa'
	},
	media: {
		heroImage: blockedAsset(BLOCKED_IMAGE_REF, 'Do-not-use hero', 'do_not_use'),
		gallery: [
			blockedAsset(BLOCKED_IMAGE_REF, 'Restricted gallery', 'restricted'),
			approvedAsset(APPROVED_IMAGE_REF, 'Approved gallery')
		]
	}
};

/** Documents that must fail schema validation when saved through Studio. */
export const schemaViolationExamples = {
	folderHintWithPrice: {
		price: 500_000,
		priceDisplay: '500000',
		priceSourceStatus: 'folder_hint_only',
		availabilityStatus: 'available',
		publicVisibility: 'visible'
	},
	reservedVisible: {
		price: 500_000,
		priceDisplay: '500000',
		priceSourceStatus: 'source_confirmed',
		availabilityStatus: 'reserved',
		publicVisibility: 'visible'
	},
	restrictedApproved: {
		assetBrandingType: 'third_party_branded',
		imageRightsStatus: 'rejected',
		publicUseApproved: true
	}
} as const;

/** Documents that must fail the public listing GROQ gate. */
export const queryGateFailures = {
	notApproved: {
		workflow: { publishReadiness: 'metadata_only' },
		pricing: { publicVisibility: 'visible', availabilityStatus: 'available' }
	},
	hidden: {
		workflow: { publishReadiness: 'approved_for_publish' },
		pricing: { publicVisibility: 'hidden', availabilityStatus: 'available' }
	},
	reservedListing: {
		workflow: { publishReadiness: 'approved_for_publish' },
		pricing: { publicVisibility: 'visible', availabilityStatus: 'reserved' }
	}
} as const;

export { APPROVED_IMAGE_REF, BLOCKED_IMAGE_REF };
