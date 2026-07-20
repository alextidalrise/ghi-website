/**
 * Public analytics surface.
 *
 * Components import from `$lib/analytics` and nothing deeper. In particular they never
 * import `dataLayer.ts`, so every payload is guaranteed to pass through the sanitizer —
 * a rule enforced mechanically by the grep assertion in `sanitize.test.ts`.
 */

export {
	priceBandLabel,
	trackContactClicked,
	trackFloorplanRequestStarted,
	trackGalleryImageViewed,
	trackGalleryOpened,
	trackLeadSubmitted,
	trackListViewed,
	trackListingSelected,
	trackListingViewed,
	trackSearchSubmitted,
	type GalleryNavigation,
	type GallerySurface,
	type SearchParams,
	type SearchPlacement
} from './events';

export {
	toAnalyticsItem,
	toAnalyticsItems,
	toAnalyticsItemsByPosition,
	type ItemContext,
	type ItemSource
} from './item';

export { listImpression } from './listImpression';

export { trackPageView, type PageAnalytics } from './pageView';

export { configureAnalytics } from './dataLayer';

export {
	acceptAll,
	closePreferences,
	consent,
	initConsent,
	openPreferences,
	rejectAll,
	saveConsent,
	withdrawConsent
} from './consent.svelte';

export type {
	AnalyticsItem,
	ConsentCategories,
	ContactMethod,
	LeadType,
	ListContext,
	ListingKind,
	StoredConsent
} from './types';
