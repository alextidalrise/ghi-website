/** Section root for all guides. The nav points here. */
export const GUIDES_PATH = '/guides';

/** Canonical path for a single guide. Category lives in data, not the URL. */
export function guidePath(slug: string): string {
	return `${GUIDES_PATH}/${slug}`;
}
