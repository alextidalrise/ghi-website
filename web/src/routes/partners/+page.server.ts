import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd, type BreadcrumbItem } from '$lib/listing/breadcrumbs';
import {
	fetchMarketsWithPartnerCounts,
	fetchPartnerCategories,
	fetchPartnerCategoryTotal,
	fetchPartnerTotal,
	fetchPartnersPage
} from '$lib/sanity/queries';
import { resolvePartnersPageContent } from '$lib/sanity/transforms/pageContent';
import { addCacheTags } from '$lib/cache/tagContext';
import { cacheTag } from '$lib/cache/tags';
import { marketInProse } from '$lib/markets/markets';

const BASE_PATH = '/partners';

/** The query param that carries the coverage filter. */
const COVERING_PARAM = 'covering';

export const load: PageServerLoad = async ({ url }) => {
	// The directory is a live query over partners/categories, so a newly published partner
	// must purge it.
	addCacheTags(cacheTag.partners);

	const requested = url.searchParams.get(COVERING_PARAM)?.trim().toLowerCase() || null;

	const markets = await fetchMarketsWithPartnerCounts();

	// An unknown or stale slug falls back to the whole network rather than an empty page:
	// a link from an old campaign, or a market that has since been renamed, should still
	// land the buyer somewhere useful. `covering` (validated) is what everything below
	// reads — never `requested`.
	const activeMarket = markets.find((market) => market.slug === requested) ?? null;
	const covering = activeMarket?.slug ?? null;

	const [categories, categoryTotal, partnerTotal, rawPage] = await Promise.all([
		fetchPartnerCategories(markets, covering),
		fetchPartnerCategoryTotal(),
		fetchPartnerTotal(),
		fetchPartnersPage()
	]);

	const coveredDisciplines = categories.length;
	const content = resolvePartnersPageContent(rawPage);

	// A filtered view canonicalises to the unfiltered directory: it is one page with a
	// facet applied, not N pages, and every firm on it is also on /partners.
	const canonicalUrl = `${url.origin}${BASE_PATH}`;

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Home', href: '/' },
		{ label: 'Partners', href: BASE_PATH }
	];

	const title = activeMarket
		? `Trusted Partners in ${marketInProse(activeMarket.name)} | Golf Homes International`
		: 'Trusted Partners | Golf Homes International';
	const description =
		content.seo?.metaDescription?.trim() ||
		(activeMarket
			? `Independent legal, tax, financial and property professionals covering ${marketInProse(activeMarket.name)}, each vetted to protect buyers. We make a personal introduction; the choice stays yours.`
			: 'Independent legal, tax, financial and property professionals across every region we cover, each vetted to protect buyers. We make a personal introduction; the choice stays yours.');

	const seo = {
		title: content.seo?.seoTitle?.trim() || title,
		description,
		ogTitle: content.seo?.openGraphTitle?.trim() || title,
		ogDescription: content.seo?.openGraphDescription?.trim() || description,
		canonicalUrl,
		// A filtered view is a facet of one directory, not its own page. Marking it noindex
		// keeps N market permutations of the same twelve firms out of the index, matching
		// how filtered listing views are already treated (see $lib/listing/seo).
		noindex: content.seo?.noindex === true || activeMarket != null
	};

	return {
		categories,
		markets,
		activeMarket,
		partnerTotal,
		categoryTotal,
		coveredDisciplines,
		content,
		breadcrumbs,
		seo,
		breadcrumbJsonLd: breadcrumbListJsonLd(breadcrumbs, url.origin)
	};
};
