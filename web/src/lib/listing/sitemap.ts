import { buildCanonicalPath, type CanonicalSegments } from './canonicalPath';

export type SitemapTaxonomyRow = {
	type?: string | null;
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	_updatedAt?: string | null;
};

export type SitemapListingRow = CanonicalSegments & {
	_updatedAt?: string | null;
};

export type SitemapGolfCourseRow = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	slug?: string | null;
	_updatedAt?: string | null;
};

export type SitemapGuideRow = {
	slug?: string | null;
	_updatedAt?: string | null;
};

export type SitemapEntry = {
	path: string;
	lastmod?: string | null;
};

export function buildTaxonomyPath(row: SitemapTaxonomyRow): string | null {
	if (!row.countrySlug) {
		return null;
	}

	if (row.type === 'country') {
		return `/${row.countrySlug}`;
	}

	if (row.type === 'location' && row.locationSlug) {
		return `/${row.countrySlug}/${row.locationSlug}`;
	}

	return null;
}

export function buildListingPath(row: SitemapListingRow): string | null {
	return buildCanonicalPath(row);
}

export function buildGolfCoursePath(row: SitemapGolfCourseRow): string | null {
	if (!row.countrySlug || !row.locationSlug || !row.communitySlug || !row.slug) {
		return null;
	}

	return `/${row.countrySlug}/${row.locationSlug}/${row.communitySlug}/golf/${row.slug}`;
}

export function buildGuidePath(row: SitemapGuideRow): string | null {
	if (!row.slug) {
		return null;
	}

	return `/guides/${row.slug}`;
}

export function collectSitemapEntries(
	taxonomyRows: SitemapTaxonomyRow[],
	listingRows: SitemapListingRow[],
	golfCourseRows: SitemapGolfCourseRow[] = [],
	guideRows: SitemapGuideRow[] = []
): SitemapEntry[] {
	const byPath = new Map<string, SitemapEntry>();

	function add(path: string | null, lastmod?: string | null) {
		if (!path) {
			return;
		}

		const existing = byPath.get(path);
		if (!existing) {
			byPath.set(path, { path, lastmod: lastmod ?? null });
			return;
		}

		if (lastmod && (!existing.lastmod || lastmod > existing.lastmod)) {
			byPath.set(path, { path, lastmod });
		}
	}

	add('/', null);

	for (const row of taxonomyRows) {
		add(buildTaxonomyPath(row), row._updatedAt);
	}

	for (const row of listingRows) {
		add(buildListingPath(row), row._updatedAt);
	}

	for (const row of golfCourseRows) {
		add(buildGolfCoursePath(row), row._updatedAt);
	}

	// The Guides hub is a real page; include it whenever at least one guide exists.
	if (guideRows.length > 0) {
		add('/guides', null);
	}

	for (const row of guideRows) {
		add(buildGuidePath(row), row._updatedAt);
	}

	return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function formatLastmod(value: string | null | undefined): string | undefined {
	if (!value) {
		return undefined;
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return undefined;
	}

	return date.toISOString();
}

export function renderSitemapXml(origin: string, entries: SitemapEntry[]): string {
	const urls = entries
		.map((entry) => {
			const loc = escapeXml(`${origin}${entry.path}`);
			const lastmod = formatLastmod(entry.lastmod);
			const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
			return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n  </url>`;
		})
		.join('\n');

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		urls,
		'</urlset>',
		''
	].join('\n');
}
