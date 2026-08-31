import type { RequestHandler } from './$types';
import { collectSitemapEntries, renderSitemapXml } from '$lib/listing/sitemap';
import {
	fetchPublic,
	sitemapGolfCoursesQuery,
	sitemapGuidesQuery,
	sitemapInsightsQuery,
	sitemapListingsQuery,
	sitemapTaxonomyQuery,
	sitemapUnitsQuery
} from '$lib/sanity/queries';

export const GET: RequestHandler = async ({ url }) => {
	const [taxonomyRows, listingRows, golfCourseRows, guideRows, insightRows, unitRows] =
		await Promise.all([
			fetchPublic<Parameters<typeof collectSitemapEntries>[0]>(sitemapTaxonomyQuery),
			fetchPublic<Parameters<typeof collectSitemapEntries>[1]>(sitemapListingsQuery),
			fetchPublic<Parameters<typeof collectSitemapEntries>[2]>(sitemapGolfCoursesQuery),
			fetchPublic<Parameters<typeof collectSitemapEntries>[3]>(sitemapGuidesQuery),
			fetchPublic<Parameters<typeof collectSitemapEntries>[4]>(sitemapInsightsQuery),
			fetchPublic<Parameters<typeof collectSitemapEntries>[5]>(sitemapUnitsQuery)
		]);

	const entries = collectSitemapEntries(
		taxonomyRows ?? [],
		listingRows ?? [],
		golfCourseRows ?? [],
		guideRows ?? [],
		insightRows ?? [],
		unitRows ?? []
	);
	const body = renderSitemapXml(url.origin, entries);

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
