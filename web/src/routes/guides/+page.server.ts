import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import { fetchPublic, guidesHubQuery } from '$lib/sanity/queries';
import { GUIDES_PATH, buildGuidesBreadcrumbs, groupGuidesByCategory } from '$lib/guides';
import type { GuideCard } from '$lib/guides';

export const load: PageServerLoad = async ({ url }) => {
	const cards = (await fetchPublic<GuideCard[]>(guidesHubQuery)) ?? [];
	const groups = groupGuidesByCategory(cards);

	const canonicalUrl = `${url.origin}${GUIDES_PATH}`;
	const breadcrumbs = buildGuidesBreadcrumbs();
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		groups,
		canonicalUrl,
		breadcrumbs,
		breadcrumbJsonLd
	};
};
