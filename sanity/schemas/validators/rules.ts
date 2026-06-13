import type { StringRule } from 'sanity';

type PricingValue = {
	price?: number | null;
	priceFrom?: number | null;
	priceTo?: number | null;
	priceDisplay?: string | null;
	priceConfirmed?: boolean | null;
	availabilityStatus?: string | null;
};

/**
 * Slim pricing validator. The new model has no "folder hint" enum and no
 * reserved-must-be-hidden coupling: visibility is governed by the document's
 * top-level `status`, and the public renderer falls back to POA whenever
 * `priceConfirmed === false`. This validator currently has no failure modes;
 * it stays for future numeric sanity checks (price / priceFrom / priceTo).
 */
export function validatePricingFields(value: PricingValue | undefined) {
	if (!value) return true;

	if (
		value.priceFrom != null &&
		value.priceTo != null &&
		value.priceFrom > value.priceTo
	) {
		return 'Price from must be less than or equal to price to.';
	}

	return true;
}

type ReviewItemEntry = { blocksPublish?: boolean | null };

type PublishGateInput = {
	status?: string | null;
	reviewItems?: ReviewItemEntry[] | null;
};

/**
 * Document-level publish gate: cannot move to status = 'published' while any
 * reviewItem still has blocksPublish === true. This is the single rule that
 * connects the review checklist to the lifecycle.
 */
export function validatePublishGate(value: PublishGateInput | undefined) {
	if (!value) return true;
	if (value.status !== 'published') return true;

	const blockers = (value.reviewItems ?? []).filter((item) => item?.blocksPublish === true);
	if (blockers.length > 0) {
		return `Cannot publish: ${blockers.length} blocking review item(s) remain. Resolve or untick "Blocks publish" on each.`;
	}

	return true;
}

/** GHI listing ID format: GHI followed by 5 digits. */
export function ghiListingIdRule(Rule: StringRule) {
	return Rule.required().regex(/^GHI[0-9]{5}$/, {
		name: 'GHI ID',
		invert: false
	});
}
