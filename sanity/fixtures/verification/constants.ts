/** Stable IDs for idempotent upserts in the development dataset. No dots — Sanity hides dotted IDs from anonymous API clients. */
export const FIXTURE_IDS = {
	country: 'verificationFixture-country-spain',
	area: 'verificationFixture-area-costa-del-sol',
	goldenProperty: 'verificationFixture-property-golden',
	privacyDevelopment: 'verificationFixture-development-privacy-units',
	unitAvailable: 'verificationFixture-unit-available-a',
	unitReserved: 'verificationFixture-unit-reserved-b',
	mediaPrivacyProperty: 'verificationFixture-property-media-privacy'
} as const;

export const FIXTURE_GHI_IDS = {
	goldenProperty: 'GHI99001',
	privacyDevelopment: 'GHI99002',
	mediaPrivacyProperty: 'GHI99003'
} as const;

export const FIXTURE_SLUGS = {
	country: 'spain',
	area: 'costa-del-sol-verification',
	goldenProperty: 'verification-golden-villa',
	privacyDevelopment: 'verification-privacy-units',
	mediaPrivacyProperty: 'verification-media-privacy'
} as const;

export const FIXTURE_ASSET_TAGS = {
	approvedHero: 'verification-approved-hero',
	approvedGallery: 'verification-approved-gallery',
	doNotUseHero: 'verification-do-not-use-hero',
	restrictedGallery: 'verification-restricted-gallery'
} as const;

export const VERIFICATION_DATASET = 'development';
