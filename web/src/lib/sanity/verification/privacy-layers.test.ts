import { describe, expect, it } from 'vitest';
import {
	validateMediaAssetMetadata,
	validatePricingFields
} from '../../../../../sanity/schemas/validators/rules';
import { formatListingPrice } from '$lib/listing/formatPrice';
import { passesPublicListingGate } from '$lib/sanity/queries/listingGates';
import {
	goldenPropertyRaw,
	mediaPrivacyPropertyRaw,
	privacyDevelopmentRaw,
	queryGateFailures,
	schemaViolationExamples
} from './fixture-payloads';
import { toPublicDevelopment, toPublicPropertyListing } from '../transforms';

describe('privacy layer 1 — schema validation', () => {
	it('rejects public price when priceSourceStatus is folder_hint_only', () => {
		expect(validatePricingFields(schemaViolationExamples.folderHintWithPrice)).toMatch(
			/Folder hint only/
		);
	});

	it('rejects reserved items with visible public visibility', () => {
		expect(validatePricingFields(schemaViolationExamples.reservedVisible)).toMatch(/Reserved items/);
	});

	it('rejects publicUseApproved on restricted assets', () => {
		expect(validateMediaAssetMetadata(schemaViolationExamples.restrictedApproved)).toMatch(
			/restricted or do-not-use/
		);
	});

	it('allows golden fixture pricing and media metadata', () => {
		expect(validatePricingFields(goldenPropertyRaw.pricing ?? undefined)).toBe(true);
		expect(validateMediaAssetMetadata(goldenPropertyRaw.media?.heroImage ?? undefined)).toBe(true);
	});

	it('allows privacy development POA with folder_hint_only (no numeric public price in CMS)', () => {
		// CMS document uses POA only; raw query payload may still carry numeric hints from GROQ.
		expect(
			validatePricingFields({
				priceDisplay: 'POA',
				priceSourceStatus: 'folder_hint_only',
				availabilityStatus: 'available',
				publicVisibility: 'visible'
			})
		).toBe(true);
	});

	it('allows reserved unit when visibility is hidden', () => {
		const reservedUnit = privacyDevelopmentRaw.units?.[1];
		expect(validatePricingFields(reservedUnit?.pricing ?? undefined)).toBe(true);
	});
});

describe('privacy layer 2 — query gates (GROQ filter mirror)', () => {
	it('passes all three golden property gates', () => {
		expect(
			passesPublicListingGate({
				workflow: { publishReadiness: 'approved_for_publish' },
				pricing: goldenPropertyRaw.pricing
			})
		).toBe(true);
	});

	it('blocks documents that are not approved for publish', () => {
		expect(passesPublicListingGate(queryGateFailures.notApproved)).toBe(false);
	});

	it('blocks hidden listings', () => {
		expect(passesPublicListingGate(queryGateFailures.hidden)).toBe(false);
	});

	it('blocks reserved top-level listings', () => {
		expect(passesPublicListingGate(queryGateFailures.reservedListing)).toBe(false);
	});

	it('allows the privacy development parent listing (reserved child units filtered separately)', () => {
		expect(
			passesPublicListingGate({
				workflow: { publishReadiness: 'approved_for_publish' },
				pricing: privacyDevelopmentRaw.pricing
			})
		).toBe(true);
	});
});

describe('privacy layer 3 — server transforms', () => {
	it('fixture 1: golden property renders price and approved media', () => {
		const pub = toPublicPropertyListing(goldenPropertyRaw);
		expect(pub).not.toBeNull();
		expect(pub!.pricing?.price).toBe(895_000);
		expect(formatListingPrice(pub!.pricing)).toContain('895');
		expect(pub!.media?.heroImage).not.toBeNull();
		expect(pub!.media?.gallery).toHaveLength(1);
	});

	it('fixture 2: strips folder_hint_only prices and hides reserved unit', () => {
		const pub = toPublicDevelopment(privacyDevelopmentRaw);
		expect(pub).not.toBeNull();
		expect(pub!.pricing?.priceFrom).toBeUndefined();
		expect(pub!.pricing?.priceTo).toBeUndefined();
		expect(pub!.pricing?.price).toBeUndefined();
		expect(pub!.pricing?.priceDisplay).toBe('POA');
		expect(formatListingPrice(pub!.pricing)).toBe('POA');

		expect(pub!.units).toHaveLength(1);
		expect(pub!.units[0].unitName).toContain('available');
		expect(pub!.units.some((u) => u.unitName?.includes('reserved'))).toBe(false);
	});

	it('fixture 3: removes do_not_use hero and restricted gallery items', () => {
		const pub = toPublicPropertyListing(mediaPrivacyPropertyRaw);
		expect(pub).not.toBeNull();
		expect(pub!.media?.heroImage).toBeNull();
		expect(pub!.media?.gallery).toHaveLength(1);
		expect(pub!.media?.gallery[0]?.altText).toContain('Approved');
	});
});
