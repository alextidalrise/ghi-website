import { APPROVED_PUBLISH_READINESS } from '../constants';

/** Minimal document shape for evaluating public listing GROQ gates in tests. */
export type ListingGateInput = {
	workflow?: { publishReadiness?: string | null } | null;
	pricing?: {
		publicVisibility?: string | null;
		availabilityStatus?: string | null;
	} | null;
};

/** Mirrors {@link PUBLISH_READINESS_FILTER} from filters.ts. */
export function passesPublishReadinessGate(doc: ListingGateInput): boolean {
	const readiness = doc.workflow?.publishReadiness ?? '';
	return (APPROVED_PUBLISH_READINESS as readonly string[]).includes(readiness);
}

/** Mirrors {@link PUBLIC_VISIBILITY_FILTER} from filters.ts. */
export function passesPublicVisibilityGate(doc: ListingGateInput): boolean {
	return (doc.pricing?.publicVisibility ?? 'visible') === 'visible';
}

/** Mirrors {@link NOT_RESERVED_FILTER} from filters.ts. */
export function passesNotReservedGate(doc: ListingGateInput): boolean {
	return (doc.pricing?.availabilityStatus ?? '') !== 'reserved';
}

/** Mirrors {@link PUBLIC_LISTING_FILTER} from filters.ts. */
export function passesPublicListingGate(doc: ListingGateInput): boolean {
	return (
		passesPublishReadinessGate(doc) &&
		passesPublicVisibilityGate(doc) &&
		passesNotReservedGate(doc)
	);
}
