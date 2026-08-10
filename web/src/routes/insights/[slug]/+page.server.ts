import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import { fetchMaybePreview, insightBySlugQuery } from '$lib/sanity/queries';
import {
	toSimilarListingCard,
	type RawSimilarListingItem,
	type SimilarListingCard
} from '$lib/sanity/transforms/similarListingCard';
import {
	toInsightDevelopmentCards,
	toInsightDevelopmentGroups,
	type InsightDevelopmentGridItemRaw
} from '$lib/sanity/transforms/insightDevelopmentCard';
import {
	buildInsightArticleJsonLd,
	buildInsightBreadcrumbs,
	buildInsightFaqJsonLd,
	buildInsightSeo,
	buildInsightToc,
	insightPath
} from '$lib/insights';
import type { InsightBodyBlock, InsightDetail } from '$lib/insights';
import type {
	InsightDevelopmentGridBlock,
	InsightFrontlineRailBlock
} from '$lib/insights/types';

/**
 * The inline Front Line carousel (`insightFrontlineRail`) is a hand-picked, ordered set of
 * listing references. The GROQ projection dereferences those picks — gated to published targets
 * (or drafts in preview) — into raw card rows on each block; here we map them to the discriminated
 * card union the rail renderer consumes, in place, so the cards travel with their own block rather
 * than through a page-level channel. A block whose picks are all unpublished maps to an empty list
 * and the renderer hides itself. No extra query: the refs ride the single by-slug fetch.
 */
function hydrateFrontlineRails(insight: InsightDetail): InsightDetail {
	const sections = insight.sections;
	if (!sections?.length) return insight;
	return {
		...insight,
		sections: sections.map((section) => {
			const body = section.body;
			if (!body?.length) return section;
			return {
				...section,
				// `block` narrows to the rail member plus PortableText (whose `_type` is a broad string),
				// so cast to the exact member before spreading — a bare `{ ...block, cards }` over the
				// union distributes `cards` across every member and collides with the development grid's
				// own (differently-typed) `cards` field.
				body: body.map((block): InsightBodyBlock => {
					if (block?._type !== 'insightFrontlineRail') return block;
					const rail = block as InsightFrontlineRailBlock;
					const raw = (block as { listings?: Array<RawSimilarListingItem | null> | null })
						.listings;
					const cards = (raw ?? [])
						.map((row) => (row ? toSimilarListingCard(row) : null))
						.filter((card): card is SimilarListingCard => card !== null);
					return { ...rail, cards };
				})
			};
		})
	};
}

/**
 * The live development collection (`insightDevelopmentGrid`) references canonical `development`
 * records; the projection dereferences them (publish-gated) into raw rows on each block's items.
 * Here we resolve those into render-ready cards — flat in editor order (desktop) and grouped by
 * destination (mobile) — reusing the same commercial transforms/formatters as the site's own
 * development cards, so no price/status/completion literal is ever copied into the article. Items
 * whose target is unpublished (raw `development` is null) drop out, preserving order.
 */
function hydrateDevelopmentGrids(insight: InsightDetail): InsightDetail {
	const sections = insight.sections;
	if (!sections?.length) return insight;
	return {
		...insight,
		sections: sections.map((section) => {
			const body = section.body;
			if (!body?.length) return section;
			return {
				...section,
				body: body.map((block): InsightBodyBlock => {
					if (block?._type !== 'insightDevelopmentGrid') return block;
					const grid = block as InsightDevelopmentGridBlock;
					const items = (block as { items?: Array<InsightDevelopmentGridItemRaw | null> | null })
						.items;
					return {
						...grid,
						cards: toInsightDevelopmentCards(items),
						groups: toInsightDevelopmentGroups(items)
					};
				})
			};
		})
	};
}

export const load: PageServerLoad = async ({ params, url, locals: { preview, loadQuery } }) => {
	const fetched = await fetchMaybePreview<InsightDetail>(
		insightBySlugQuery,
		{ slug: params.slug },
		loadQuery,
		preview
	);

	if (!fetched?.slug) {
		error(404, 'Article not found.');
	}

	// Map each inline Front Line rail's hand-picked, publish-gated listing refs into render-ready
	// cards, then resolve every development collection's live references the same way. Both are cheap
	// and in-memory — the refs came down with the single by-slug fetch.
	const insight = hydrateDevelopmentGrids(hydrateFrontlineRails(fetched));

	const canonicalUrl = `${url.origin}${insightPath(fetched.slug)}`;
	const breadcrumbs = buildInsightBreadcrumbs(insight);
	const seoBase = buildInsightSeo(insight, canonicalUrl);
	// Draft preview pages must never be indexed.
	const seo = preview ? { ...seoBase, noindex: true } : seoBase;

	const toc = buildInsightToc(insight.sections);

	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);
	const articleJsonLd = buildInsightArticleJsonLd(insight, canonicalUrl, seo.openGraphImageUrl);
	const faqJsonLd = buildInsightFaqJsonLd(insight.sections);

	return {
		insight,
		toc,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd,
		articleJsonLd,
		faqJsonLd
	};
};
