import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import {
	buyerTypesQuery,
	fetchGuidesHubPage,
	fetchMarkets,
	fetchPublic,
	guidesHubQuery
} from '$lib/sanity/queries';
import {
	FOR_PARAM,
	GUIDES_PATH,
	IN_PARAM,
	buildGuidesBreadcrumbs,
	guidePath,
	resolveFinder,
	reviewedLabel,
	type BuyerType,
	type FinderGuide
} from '$lib/guides';
import { resolveGuidesHubContent } from '$lib/sanity/transforms/pageContent';
import { addCacheTags } from '$lib/cache/tagContext';
import { cacheTag } from '$lib/cache/tags';

type RawHubGuide = {
	slug?: string | null;
	title?: string | null;
	tagline?: string | null;
	guideCategory?: string | null;
	lastReviewed?: string | null;
	chapters?: Array<string | null> | null;
	audience?: string | null;
	market?: unknown;
};

function toFinderGuide(raw: RawHubGuide): FinderGuide | null {
	if (!raw.slug || !raw.title) return null;
	return {
		slug: raw.slug,
		title: raw.title,
		tagline: raw.tagline?.trim() || null,
		chapters: (raw.chapters ?? []).map((c) => c?.trim() ?? '').filter(Boolean),
		reviewed: reviewedLabel(raw.lastReviewed),
		audience: raw.audience ?? null,
		market: typeof raw.market === 'string' ? raw.market : null
	};
}

export const load: PageServerLoad = async ({ url }) => {
	// Lists every guide, so a newly published one must purge this hub.
	addCacheTags(cacheTag.hubGuides);

	const [rawGuides, rawBuyerTypes, markets, rawPage] = await Promise.all([
		fetchPublic<RawHubGuide[]>(guidesHubQuery).then((r) => r ?? []),
		fetchPublic<Array<Partial<BuyerType>>>(buyerTypesQuery).then((r) => r ?? []),
		fetchMarkets(),
		fetchGuidesHubPage()
	]);

	const allGuides = rawGuides
		.map((raw) => ({ raw, guide: toFinderGuide(raw) }))
		.filter((entry): entry is { raw: RawHubGuide; guide: FinderGuide } => entry.guide != null);

	const buyerTypes: BuyerType[] = rawBuyerTypes.flatMap((t) =>
		t.slug && t.name ? [{ slug: t.slug, name: t.name }] : []
	);

	// The two questions are about buying: a future location or golf guide has no buyer-type
	// answer, so it is reachable from the index at the foot of the page, not the finder.
	const finder = resolveFinder({
		guides: allGuides.filter((e) => e.raw.guideCategory === 'buying').map((e) => e.guide),
		buyerTypes,
		markets,
		forSlug: url.searchParams.get(FOR_PARAM),
		inSlug: url.searchParams.get(IN_PARAM)
	});

	const index = allGuides.map(({ guide }) => ({ title: guide.title, href: guidePath(guide.slug) }));

	const content = resolveGuidesHubContent(rawPage);
	const canonicalUrl = `${url.origin}${GUIDES_PATH}`;
	const breadcrumbs = buildGuidesBreadcrumbs();

	// An answered view is the hub with a choice applied, not another page: it canonicalises
	// to /guides and stays out of the index, while every guide it can show is linked from
	// the plain hub's index below.
	const answered = url.searchParams.has(FOR_PARAM) || url.searchParams.has(IN_PARAM);

	return {
		finder,
		index,
		content,
		canonicalUrl,
		noindex: answered,
		breadcrumbs,
		breadcrumbJsonLd: breadcrumbListJsonLd(breadcrumbs, url.origin)
	};
};
