import type { RawDevelopment, RawPropertyListing } from '../transforms';
import type { MediaAssetInput } from '../transforms/mediaFilter';

const APPROVED_IMAGE_REF = 'image-verification-approved';

function imageRef(ref: string) {
	return { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: ref } };
}

function mediaAsset(ref: string, alt: string): MediaAssetInput {
	return {
		asset: imageRef(ref),
		altText: alt
	};
}

const sharedLocation = {
	country: { _id: 'c1', name: 'Spain', slug: 'spain', type: 'country' },
	location: { _id: 'a1', name: 'Costa del Sol', slug: 'costa-del-sol-verification', type: 'location' },
	community: {
		_id: 'cm1',
		name: 'Verification Community',
		slug: 'verification-community',
		type: 'community',
		coordinates: { lat: 36.484, lng: -4.952 }
	},
	addressDisplay: 'Costa del Sol, Spain'
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
	status: 'published',
	location: sharedLocation,
	pricing: {
		price: 895_000,
		priceDisplay: '895000',
		currency: 'EUR',
		priceQualifier: 'guide',
		priceConfirmed: true,
		availabilityStatus: 'available'
	},
	specs: { bedrooms: 4, bathrooms: 3, builtArea: 280, builtAreaUnit: 'sqm' },
	content: {
		shortDescription: 'Verification golden villa fixture.'
	},
	media: {
		gallery: [
			mediaAsset(APPROVED_IMAGE_REF, 'Approved hero'),
			mediaAsset(APPROVED_IMAGE_REF, 'Approved gallery')
		]
	}
};

/** Raw query-shaped payload for fixture 2 — published development with unconfirmed price + reserved unit. */
export const privacyDevelopmentRaw: RawDevelopment = {
	_id: 'verificationFixture.development.privacy-units',
	_type: 'development',
	ghiListingId: 'GHI99002',
	title: 'Verification Privacy Units Development',
	slug: 'verification-privacy-units',
	listingKind: 'development',
	developmentDisplayMode: 'units',
	status: 'published',
	location: sharedLocation,
	pricing: {
		priceFrom: 650_000,
		priceTo: 720_000,
		priceDisplay: 'POA',
		currency: 'EUR',
		priceConfirmed: false,
		availabilityStatus: 'available'
	},
	content: {
		shortDescription: 'Verification privacy units fixture.'
	},
	media: {
		gallery: [mediaAsset(APPROVED_IMAGE_REF, 'Approved development hero')]
	},
	units: [
		{
			_id: 'verificationFixture.unit.available-a',
			unitName: 'Villa A (available)',
			pricing: {
				price: 650_000,
				priceDisplay: '650000',
				currency: 'EUR',
				priceConfirmed: true,
				availabilityStatus: 'available'
			}
		},
		{
			_id: 'verificationFixture.unit.reserved-b',
			unitName: 'Villa B (reserved — locked row)',
			pricing: {
				price: 720_000,
				priceDisplay: '720000',
				currency: 'EUR',
				priceConfirmed: true,
				availabilityStatus: 'reserved'
			}
		},
		{
			_id: 'verificationFixture.unit.withdrawn-c',
			unitName: 'Villa C (withdrawn — should drop)',
			pricing: {
				price: 800_000,
				priceDisplay: '800000',
				currency: 'EUR',
				priceConfirmed: true,
				availabilityStatus: 'withdrawn'
			}
		}
	]
};

/** Raw query-shaped payload for fixture 3 — first gallery slot has no file; later item is public. */
export const mediaPrivacyPropertyRaw: RawPropertyListing = {
	_id: 'verificationFixture.property.media-privacy',
	_type: 'propertyListing',
	ghiListingId: 'GHI99003',
	title: 'Verification Media Privacy Villa',
	slug: 'verification-media-privacy',
	listingKind: 'property',
	propertyType: 'villa',
	transactionType: 'sale',
	status: 'published',
	location: sharedLocation,
	pricing: {
		price: 750_000,
		priceDisplay: '750000',
		currency: 'EUR',
		priceConfirmed: true,
		availabilityStatus: 'available'
	},
	specs: { bedrooms: 3, bathrooms: 2, builtArea: 200, builtAreaUnit: 'sqm' },
	content: {
		shortDescription: 'Verification media privacy fixture.'
	},
	media: {
		gallery: [
			{ altText: 'Gallery placeholder without uploaded file' },
			mediaAsset(APPROVED_IMAGE_REF, 'Gallery image')
		]
	}
};

/** Documents that must fail the document-level publish gate. */
type PublishGateFixture = {
	status: string;
	reviewItems: Array<{
		_key: string;
		label: string;
		blocksPublish: boolean;
		category: string;
	}>;
};

export const publishGateFailures: {
	publishedWithBlocker: PublishGateFixture;
	publishedAllNotes: PublishGateFixture;
} = {
	publishedWithBlocker: {
		status: 'published',
		reviewItems: [
			{ _key: 'r1', label: 'Confirm price source', blocksPublish: true, category: 'price' }
		]
	},
	publishedAllNotes: {
		status: 'published',
		reviewItems: [
			{ _key: 'r1', label: 'Internal aside', blocksPublish: false, category: 'internal' }
		]
	}
};

/** Documents that must fail the public listing GROQ gate. */
export const queryGateFailures = {
	draft: { status: 'draft' },
	inReview: { status: 'in_review' },
	unpublished: { status: 'unpublished' },
	archived: { status: 'archived' }
} as const;

export { APPROVED_IMAGE_REF };
