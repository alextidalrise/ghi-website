import { onSessionReset } from './dataLayer';
import { trackListViewed } from './events';
import type { AnalyticsItem, ListContext } from './types';

/**
 * `view_item_list` on genuine visibility.
 *
 * Firing on mount would report the Similar Properties rail at the foot of a detail page
 * as "viewed" the instant the page loads, which inflates the denominator of every list's
 * click-through rate. An IntersectionObserver is the honest signal and costs one
 * observer per list.
 */

/** Lists already reported on this page. Keyed by contents, not by element. */
const fired = new Set<string>();
onSessionReset(() => fired.clear());

/**
 * Identity of a list *and* its current contents.
 *
 * Keying on the item ids rather than the list id alone is what makes pagination and
 * filtering behave correctly: a new page of results is a genuinely new impression, while
 * scrolling away and back is not.
 */
export function impressionKey(listId: string, items: readonly AnalyticsItem[]): string {
	return `${listId}|${items.map((item) => item.item_id).join(',')}`;
}

export type ListImpressionParams = {
	list: ListContext;
	items: AnalyticsItem[];
};

/** Share of the list itself that counts as seen, for lists shorter than the viewport. */
const VISIBLE_RATIO = 0.3;

/** Share of the viewport that counts as seen, for lists taller than it. */
const VIEWPORT_RATIO = 0.25;

/**
 * How much of a list must be on screen to count as an impression.
 *
 * A ratio alone does not work: a full results grid is 24 cards, which on a phone is
 * several viewports tall, so 30% of the *element* can be more than the screen can ever
 * show and the impression would never fire. Taking the smaller of "30% of the list" and
 * "25% of the viewport" means short rails still need to be meaningfully visible, while a
 * tall grid only needs to genuinely occupy the screen.
 */
export function impressionThreshold(elementHeight: number, viewportHeight: number): number {
	return Math.min(elementHeight * VISIBLE_RATIO, viewportHeight * VIEWPORT_RATIO);
}

/**
 * IntersectionObserver works in ratios, while our reporting rule is expressed in
 * visible pixels. Derive the exact ratio for this element rather than relying on a
 * fixed threshold that a very tall grid may never be able to reach.
 */
export function impressionObserverThreshold(
	elementHeight: number,
	viewportHeight: number
): number {
	if (elementHeight <= 0) return 1;
	return impressionThreshold(elementHeight, viewportHeight) / elementHeight;
}

/** Whether the currently visible slice of an element is enough to report. */
export function isSufficientlyVisible(
	rect: { top: number; bottom: number; height: number },
	viewportHeight: number
): boolean {
	const visible = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
	if (visible <= 0) return false;
	return visible >= impressionThreshold(rect.height, viewportHeight);
}

/**
 * Report a list once it is meaningfully on screen.
 *
 * The observer is deliberately *not* disconnected after firing: keeping it live lets a
 * later `update()` — pagination, a filter change — report the new contents while the
 * container is still in view. Deduplication is the key set's job, not the observer
 * lifecycle's.
 */
export function listImpression(node: HTMLElement, params?: ListImpressionParams) {
	let current = params;

	// `undefined` means the container was used without naming a list — a plain grid or
	// rail that opts out of impression tracking. Older browsers likewise report nothing.
	if (!params || typeof IntersectionObserver === 'undefined') {
		return { update: (next?: ListImpressionParams) => (current = next), destroy: () => {} };
	}

	/** Single gate for both the observer and the update path, so they cannot disagree. */
	const reportIfVisible = () => {
		if (!current || current.items.length === 0) return;
		if (!isSufficientlyVisible(node.getBoundingClientRect(), window.innerHeight)) return;

		const key = impressionKey(current.list.list_id, current.items);
		if (fired.has(key)) return;
		fired.add(key);
		trackListViewed(current.list, current.items);
	};

	let observer: IntersectionObserver | undefined;
	let currentObserverThreshold: number | undefined;

	/** Rebuild when layout changes because IntersectionObserver thresholds are immutable. */
	const rebuildObserver = () => {
		const threshold = impressionObserverThreshold(
			node.getBoundingClientRect().height,
			window.innerHeight
		);
		if (observer && threshold === currentObserverThreshold) return;

		observer?.disconnect();
		currentObserverThreshold = threshold;
		observer = new IntersectionObserver(reportIfVisible, { threshold });
		observer.observe(node);
	};

	rebuildObserver();

	// A responsive layout can change either the list height or the viewport cap. Keep
	// the observer's derived ratio in sync and immediately re-check an already-visible
	// list rather than waiting for another scroll.
	const onResize = () => {
		rebuildObserver();
		reportIfVisible();
	};
	window.addEventListener('resize', onResize);
	const resizeObserver =
		typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : undefined;
	resizeObserver?.observe(node);

	return {
		update(next?: ListImpressionParams) {
			current = next;
			// Contents can change while the list is already on screen — paginating keeps
			// the grid in view — so re-check rather than waiting for a scroll that may
			// never come.
			reportIfVisible();
		},
		destroy() {
			observer?.disconnect();
			resizeObserver?.disconnect();
			window.removeEventListener('resize', onResize);
		}
	};
}
