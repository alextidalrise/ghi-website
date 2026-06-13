import { describe, expect, it } from 'vitest';
import {
	validatePricingFields,
	validatePublishGate
} from '../../../../../sanity/schemas/validators/rules';
import { formatListingPrice } from '$lib/listing/formatPrice';
import { passesPublicListingGate } from '$lib/sanity/queries/listingGates';
import {
	goldenPropertyRaw,
	mediaPrivacyPropertyRaw,
	privacyDevelopmentRaw,
	publishGateFailures,
	queryGateFailures
} from './fixture-payloads';
import { toPublicDevelopment, toPublicPropertyListing } from '../transforms';
import { resolveListingHeroImage } from '../transforms/mediaFilter';
import { MEDIA_ASSET_PUBLIC } from '../allowlists';

/**
 * Two privacy layers protect public output:
 *   1. Schema validation (Sanity Studio refuses to save invalid documents).
 *   2. Server transforms (filter the raw query result before it reaches the page).
 *
 * The GROQ gate is a single one-liner now; we test it as a small extra check.
 */

describe('privacy layer 1 — schema validation', () => {
	it('publish gate refuses to publish while a blocking review item remains', () => {
		expect(validatePublishGate(publishGateFailures.publishedWithBlocker)).toMatch(
			/blocking review item/
		);
	});

	it('publish gate allows publishing when only non-blocking notes remain', () => {
		expect(validatePublishGate(publishGateFailures.publishedAllNotes)).toBe(true);
	});

	it('publish gate is silent for non-published statuses', () => {
		expect(
			validatePublishGate({
				status: 'draft',
				reviewItems: [{ blocksPublish: true }]
			})
		).toBe(true);
	});

	it('pricing validator allows the golden fixture', () => {
		expect(validatePricingFields(goldenPropertyRaw.pricing ?? undefined)).toBe(true);
	});

	it('pricing validator rejects priceFrom > priceTo', () => {
		expect(
			validatePricingFields({
				priceFrom: 800_000,
				priceTo: 600_000
			})
		).toMatch(/price from/i);
	});
});

describe('GROQ gate mirror', () => {
	it('passes a published document', () => {
		expect(passesPublicListingGate({ status: 'published' })).toBe(true);
	});

	it('blocks every non-published status', () => {
		for (const failure of Object.values(queryGateFailures)) {
			expect(passesPublicListingGate(failure)).toBe(false);
		}
	});
});

describe('privacy layer 2 — server transforms', () => {
	it('fixture 1: golden property renders confirmed price and uploaded media', () => {
		const pub = toPublicPropertyListing(goldenPropertyRaw);
		expect(pub).not.toBeNull();
		expect(pub!.pricing?.price).toBe(895_000);
		expect(formatListingPrice(pub!.pricing)).toContain('895');
		expect(resolveListingHeroImage(pub!.media)).not.toBeNull();
		expect(pub!.media?.gallery).toHaveLength(2);
	});

	it('fixture 2: collapses unconfirmed prices to POA and applies the inventory display policy', () => {
		const pub = toPublicDevelopment(privacyDevelopmentRaw);
		expect(pub).not.toBeNull();

		// Unconfirmed development price → POA, numeric prices stripped.
		expect(pub!.pricing?.priceFrom).toBeUndefined();
		expect(pub!.pricing?.priceTo).toBeUndefined();
		expect(pub!.pricing?.price).toBeUndefined();
		expect(pub!.pricing?.priceDisplay).toBe('POA');
		expect(formatListingPrice(pub!.pricing)).toBe('POA');

		// Inventory policy: withdrawn drops, reserved/sold render as locked rows.
		const names = pub!.units.map((u) => u.unitName);
		expect(names).toContain('Villa A (available)');
		expect(names).toContain('Villa B (reserved — locked row)');
		expect(names.find((n) => n?.toLowerCase().includes('withdrawn'))).toBeUndefined();
	});

	it('fixture 3: skips gallery slots without files and resolves hero from first public image', () => {
		const pub = toPublicPropertyListing(mediaPrivacyPropertyRaw);
		expect(pub).not.toBeNull();
		expect(pub!.media?.gallery).toHaveLength(1);
		expect(resolveListingHeroImage(pub!.media)?.altText).toContain('Gallery');
	});

	it('MEDIA_ASSET_PUBLIC allowlist excludes private media provenance fields', () => {
		expect(MEDIA_ASSET_PUBLIC).not.toContain('sourceFileName');
		expect(MEDIA_ASSET_PUBLIC).not.toContain('sourceDriveFileId');
		expect(MEDIA_ASSET_PUBLIC).not.toContain('sourceMediaFolderUrl');
	});

	it('public payload never contains the internal namespace', () => {
		const pub = toPublicPropertyListing(goldenPropertyRaw);
		const serialized = JSON.stringify(pub);
		expect(serialized).not.toContain('"internal"');
		expect(serialized).not.toContain('priceConfirmed');
	});
});
