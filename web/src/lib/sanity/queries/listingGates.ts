import { PUBLISHED_STATUS } from '../constants';

/** Minimal document shape for evaluating the public listing GROQ gate in tests. */
export type ListingGateInput = {
	status?: string | null;
};

/** Mirrors {@link PUBLIC_LISTING_FILTER} from filters.ts. */
export function passesPublicListingGate(doc: ListingGateInput): boolean {
	return (doc.status ?? '') === PUBLISHED_STATUS;
}
