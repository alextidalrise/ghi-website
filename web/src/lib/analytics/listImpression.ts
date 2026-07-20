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

	const report = () => {
		if (!current || current.items.length === 0) return;
		const key = impressionKey(current.list.list_id, current.items);
		if (fired.has(key)) return;
		fired.add(key);
		trackListViewed(current.list, current.items);
	};

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) report();
			}
		},
		// Enough of the list on screen to count as seen, but reachable for a tall rail
		// that can never be 100% visible on a phone.
		{ threshold: 0.3 }
	);

	observer.observe(node);

	return {
		update(next?: ListImpressionParams) {
			current = next;
			// Contents may have changed while the list is already on screen (pagination
			// keeps the grid in view), so re-check rather than waiting for a scroll.
			const rect = node.getBoundingClientRect();
			const onScreen = rect.top < window.innerHeight && rect.bottom > 0;
			if (onScreen) report();
		},
		destroy() {
			observer.disconnect();
		}
	};
}
