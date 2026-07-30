import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

/**
 * Context channel for the inline Front Line carousel. The cards are a request-time feed
 * fetched once in the Insight server load and set on the page; the `insightFrontlineRail`
 * body block sits several layers down inside `<PortableText>`, so context — not props —
 * is how it reaches the renderer without threading through every intermediate component.
 *
 * The value is a getter object rather than a bare array so it stays live across client-side
 * navigation between two articles: the page re-runs its load and updates the derived cards,
 * and the getter always reads the current value (a snapshot captured at `setContext` time
 * would go stale after the first navigation).
 */
export const FRONTLINE_CARDS_KEY = Symbol('insight:frontline-cards');

export type FrontlineCardsContext = { readonly cards: SimilarListingCard[] };
