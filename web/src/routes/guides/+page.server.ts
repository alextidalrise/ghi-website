import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import {
	fetchPublic,
	guidesHubQuery,
	fetchGuidesHubPage,
	fetchMarkets
} from '$lib/sanity/queries';
import { GUIDES_PATH, buildGuidesBreadcrumbs, groupGuidesByMarket } from '$lib/guides';
import type { GuideCard } from '$lib/guides';
import { resolveGuidesHubContent } from '$lib/sanity/transforms/pageContent';
import { addCacheTags } from '$lib/cache/tagContext';
import { cacheTag } from '$lib/cache/tags';

export const load: PageServerLoad = async ({ url }) => {
	// Lists every guide, so a newly published one must purge this hub.
	addCacheTags(cacheTag.hubGuides);

	const [cards, rawPage, markets] = await Promise.all([
		fetchPublic<GuideCard[]>(guidesHubQuery).then((r) => r ?? []),
		fetchGuidesHubPage(),
		fetchMarkets()
	]);

	const content = resolveGuidesHubContent(rawPage);
	// Market is the spine; category is a sub-heading only where a market has more than one
	// kind of guide. Every market appears, including those with nothing written yet.
	const groups = groupGuidesByMarket(cards, markets, content.categoryMeta);

	const canonicalUrl = `${url.origin}${GUIDES_PATH}`;
	const breadcrumbs = buildGuidesBreadcrumbs();
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		groups,
		content,
		canonicalUrl,
		breadcrumbs,
		breadcrumbJsonLd
	};
};
