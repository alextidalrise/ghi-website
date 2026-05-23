import { buildPublicImageUrl } from '$lib/sanity/image';
import type { PublicDevelopment, PublicPropertyListing } from '$lib/sanity/transforms';

/** SEO payload built only from allowlisted seo fields on the public listing. */
export type PropertySeoMeta = {
	title: string;
	description: string | null;
	openGraphTitle: string | null;
	openGraphDescription: string | null;
	openGraphImageUrl: string | null;
	noindex: boolean;
	schemaType: string | null;
};

export function buildPropertySeo(
	listing: PublicPropertyListing,
	canonicalUrl: string
): PropertySeoMeta & { canonicalUrl: string } {
	const seo = listing.seo;
	const fallbackTitle = listing.publicTitle ?? 'Property';
	const fallbackDescription = listing.content?.shortDescription ?? null;

	return {
		canonicalUrl,
		title: seo?.seoTitle ?? fallbackTitle,
		description: seo?.metaDescription ?? fallbackDescription,
		openGraphTitle: seo?.openGraphTitle ?? seo?.seoTitle ?? fallbackTitle,
		openGraphDescription: seo?.openGraphDescription ?? seo?.metaDescription ?? fallbackDescription,
		openGraphImageUrl: buildPublicImageUrl(seo?.openGraphImage ?? listing.media?.heroImage, {
			width: 1200,
			height: 630,
			fit: 'crop'
		}),
		noindex: seo?.noindex ?? false,
		schemaType: seo?.schemaType ?? 'RealEstateListing'
	};
}

type LocationSeoFields = {
	name: string;
	seoTitle?: string | null;
	metaDescription?: string | null;
	publicDescription?: string | null;
};

export function buildLocationSeo(
	location: LocationSeoFields,
	canonicalUrl: string
): PropertySeoMeta & { canonicalUrl: string } {
	const fallbackDescription = location.publicDescription ?? null;

	return {
		canonicalUrl,
		title: location.seoTitle ?? location.name,
		description: location.metaDescription ?? fallbackDescription,
		openGraphTitle: location.seoTitle ?? location.name,
		openGraphDescription: location.metaDescription ?? fallbackDescription,
		openGraphImageUrl: null,
		noindex: false,
		schemaType: null
	};
}

export function buildDevelopmentSeo(
	development: PublicDevelopment,
	canonicalUrl: string
): PropertySeoMeta & { canonicalUrl: string } {
	const seo = development.seo;
	const fallbackTitle = development.publicTitle ?? development.developmentName ?? 'Development';
	const fallbackDescription = development.content?.shortDescription ?? null;

	return {
		canonicalUrl,
		title: seo?.seoTitle ?? fallbackTitle,
		description: seo?.metaDescription ?? fallbackDescription,
		openGraphTitle: seo?.openGraphTitle ?? seo?.seoTitle ?? fallbackTitle,
		openGraphDescription: seo?.openGraphDescription ?? seo?.metaDescription ?? fallbackDescription,
		openGraphImageUrl: buildPublicImageUrl(seo?.openGraphImage ?? development.media?.heroImage, {
			width: 1200,
			height: 630,
			fit: 'crop'
		}),
		noindex: seo?.noindex ?? false,
		schemaType: seo?.schemaType ?? 'RealEstateListing'
	};
}
