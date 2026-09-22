import type { RequestHandler } from './$types';
import { collectSitemapEntries, renderSitemapXml } from '$lib/listing/sitemap';
import { addCacheTags } from '$lib/cache/tagContext';
import { cacheTag } from '$lib/cache/tags';
import {
	fetchPublic,
	sitemapGuidesQuery,
	sitemapInsightsQuery,
	sitemapListingsQuery,
	sitemapTaxonomyQuery
} from '$lib/sanity/queries';

export const GET: RequestHandler = async ({ url }) => {
	// The whole sitemap is one structural dependency: any indexable doc's create/publish/
	// unpublish/delete purges this tag (purgeTags.ts). cacheHandle reads it and emits
	// Vercel-Cache-Tag, and — because /sitemap.xml is now an allowlisted cacheable route —
	// applies the edge TTL + browser cache-control, so this route sets no cache header itself.
	addCacheTags(cacheTag.sitemap);

	/* Golf course pages (116 of them) are deliberately not fetched: the sitemap is trimmed to
	   the core pages plus developments while Google's crawl budget for the site is tiny — see
	   sitemapListingsQuery. To restore them, fetch sitemapGolfCoursesQuery again and pass the
	   rows as collectSitemapEntries' third argument. */
	const [taxonomyRows, listingRows, guideRows, insightRows] = await Promise.all([
		fetchPublic<Parameters<typeof collectSitemapEntries>[0]>(sitemapTaxonomyQuery),
		fetchPublic<Parameters<typeof collectSitemapEntries>[1]>(sitemapListingsQuery),
		fetchPublic<Parameters<typeof collectSitemapEntries>[3]>(sitemapGuidesQuery),
		fetchPublic<Parameters<typeof collectSitemapEntries>[4]>(sitemapInsightsQuery)
	]);

	const entries = collectSitemapEntries(
		taxonomyRows ?? [],
		listingRows ?? [],
		[],
		guideRows ?? [],
		insightRows ?? []
	);
	const body = renderSitemapXml(url.origin, entries);

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8'
		}
	});
};
