import type { RequestHandler } from './$types';
import { collectSitemapEntries, renderSitemapXml } from '$lib/listing/sitemap';
import {
	fetchPublic,
	sitemapGolfCoursesQuery,
	sitemapGuidesQuery,
	sitemapListingsQuery,
	sitemapTaxonomyQuery
} from '$lib/sanity/queries';

export const GET: RequestHandler = async ({ url }) => {
	const [taxonomyRows, listingRows, golfCourseRows, guideRows] = await Promise.all([
		fetchPublic<Parameters<typeof collectSitemapEntries>[0]>(sitemapTaxonomyQuery),
		fetchPublic<Parameters<typeof collectSitemapEntries>[1]>(sitemapListingsQuery),
		fetchPublic<Parameters<typeof collectSitemapEntries>[2]>(sitemapGolfCoursesQuery),
		fetchPublic<Parameters<typeof collectSitemapEntries>[3]>(sitemapGuidesQuery)
	]);

	const entries = collectSitemapEntries(
		taxonomyRows ?? [],
		listingRows ?? [],
		golfCourseRows ?? [],
		guideRows ?? []
	);
	const body = renderSitemapXml(url.origin, entries);

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
