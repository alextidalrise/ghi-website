import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
import { GUIDES_PATH, guidePath } from './routes';

/** Home / Guides — the hub trail. */
export function buildGuidesBreadcrumbs(): BreadcrumbItem[] {
	return [
		{ label: 'Home', href: '/' },
		{ label: 'Guides', href: GUIDES_PATH }
	];
}

/** Home / Guides / {title} — a single guide's trail. */
export function buildGuideBreadcrumbs(guide: {
	title?: string | null;
	slug?: string | null;
}): BreadcrumbItem[] {
	const items: BreadcrumbItem[] = [
		{ label: 'Home', href: '/' },
		{ label: 'Guides', href: GUIDES_PATH }
	];

	if (guide.slug) {
		items.push({ label: guide.title ?? 'Guide', href: guidePath(guide.slug) });
	}

	return items;
}
