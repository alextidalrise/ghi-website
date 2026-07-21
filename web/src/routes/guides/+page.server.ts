import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import { fetchPublic, guidesHubQuery, fetchGuidesHubPage } from '$lib/sanity/queries';
import { GUIDES_PATH, buildGuidesBreadcrumbs, groupGuidesByCategory } from '$lib/guides';
import type { GuideCard } from '$lib/guides';
import { resolveGuidesHubContent } from '$lib/sanity/transforms/pageContent';

export const load: PageServerLoad = async ({ url }) => {
	const [cards, rawPage] = await Promise.all([
		fetchPublic<GuideCard[]>(guidesHubQuery).then((r) => r ?? []),
		fetchGuidesHubPage()
	]);

	const content = resolveGuidesHubContent(rawPage);
	const groups = groupGuidesByCategory(cards, content.categoryMeta);

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
