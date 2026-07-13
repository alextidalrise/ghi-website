import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
import { INSIGHTS_PATH, insightPath } from './routes';

/** Home / Insights — the index trail. */
export function buildInsightsBreadcrumbs(): BreadcrumbItem[] {
	return [
		{ label: 'Home', href: '/' },
		{ label: 'Insights', href: INSIGHTS_PATH }
	];
}

/** Home / Insights / {title} — a single article's trail. */
export function buildInsightBreadcrumbs(insight: {
	title?: string | null;
	slug?: string | null;
}): BreadcrumbItem[] {
	const items: BreadcrumbItem[] = [
		{ label: 'Home', href: '/' },
		{ label: 'Insights', href: INSIGHTS_PATH }
	];

	if (insight.slug) {
		items.push({ label: insight.title ?? 'Insight', href: insightPath(insight.slug) });
	}

	return items;
}
