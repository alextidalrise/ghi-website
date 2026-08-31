import { buildCanonicalPath, type CanonicalSegments } from './canonicalPath';

export type SitemapTaxonomyRow = {
	type?: string | null;
	parentType?: string | null;
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	_updatedAt?: string | null;
};

export type SitemapListingRow = CanonicalSegments & {
	_updatedAt?: string | null;
};

/**
 * A standalone `_type == "unit"` document's canonical path segments. Mirrors the fields
 * UNIT_CANONICAL_PATH_FIELDS projects: the parent development's URL segments plus the unit
 * slug. `communitySlug` is absent (and `isCatchAll` true) when the parent development is a
 * catch-all community, served without a community segment.
 */
export type SitemapUnitRow = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	isCatchAll?: boolean | null;
	developmentSlug?: string | null;
	unitSlug?: string | null;
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

export type SitemapInsightRow = {
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

	/* A real location hangs directly off a country, so its two-segment path resolves. Guard on
	   parentType: some community nodes are mistyped `location` (e.g. the Estepona catch-all and
	   el-campanario, whose parent is the Estepona *location*, not a country). Left ungated they
	   made `countrySlug` resolve to `parent->slug` — emitting /estepona/estepona and
	   /estepona/el-campanario, both 404s the sitemap should never advertise. */
	if (row.type === 'location' && row.locationSlug && row.parentType === 'country') {
		return `/${row.countrySlug}/${row.locationSlug}`;
	}

	return null;
}

export function buildListingPath(row: SitemapListingRow): string | null {
	return buildCanonicalPath(row);
}

/**
 * Nested canonical unit path: the parent development's canonical path + the unit slug. Reuses
 * buildCanonicalPath so the catch-all (3-segment) vs standard (4-segment) development rules are
 * applied identically to how the unit page (buildUnitDetailPageData) and the /u/[ghiId] permalink
 * resolve them — the emitted URL is byte-identical to the one a request canonicalises to, so it
 * never 301s.
 *   Standard:   /{country}/{location}/{community}/{developmentSlug}/{unitSlug}
 *   Catch-all:  /{country}/{location}/{developmentSlug}/{unitSlug}
 */
export function buildUnitPath(row: SitemapUnitRow): string | null {
	const developmentPath = buildCanonicalPath({
		countrySlug: row.countrySlug,
		locationSlug: row.locationSlug,
		communitySlug: row.communitySlug,
		slug: row.developmentSlug,
		isCatchAll: row.isCatchAll
	});

	if (!developmentPath || !row.unitSlug) {
		return null;
	}

	return `${developmentPath}/${row.unitSlug}`;
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

export function buildInsightPath(row: SitemapInsightRow): string | null {
	if (!row.slug) {
		return null;
	}

	return `/insights/${row.slug}`;
}

const STATIC_INDEXABLE_PATHS = [
	'/about',
	'/contact',
	'/front-line-collection',
	'/partners'
] as const;

export function collectSitemapEntries(
	taxonomyRows: SitemapTaxonomyRow[],
	listingRows: SitemapListingRow[],
	golfCourseRows: SitemapGolfCourseRow[] = [],
	guideRows: SitemapGuideRow[] = [],
	insightRows: SitemapInsightRow[] = [],
	unitRows: SitemapUnitRow[] = []
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

	for (const path of STATIC_INDEXABLE_PATHS) {
		add(path, null);
	}

	for (const row of taxonomyRows) {
		add(buildTaxonomyPath(row), row._updatedAt);
	}

	for (const row of listingRows) {
		add(buildListingPath(row), row._updatedAt);
	}

	for (const row of unitRows) {
		add(buildUnitPath(row), row._updatedAt);
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

	// The Insights index is a real page; include it whenever at least one insight exists.
	if (insightRows.length > 0) {
		add('/insights', null);
	}

	for (const row of insightRows) {
		add(buildInsightPath(row), row._updatedAt);
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
