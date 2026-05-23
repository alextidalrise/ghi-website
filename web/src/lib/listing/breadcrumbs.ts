import type { PublicPropertyListing, PublicDevelopment } from '$lib/sanity/transforms';

export type LocationTaxonomyRef = {
	_id?: string;
	name?: string | null;
	slug?: string | null;
	type?: string | null;
	breadcrumbLabel?: string | null;
};

export type BreadcrumbItem = {
	label: string;
	href: string | null;
};

function labelFor(ref: LocationTaxonomyRef | null | undefined): string | null {
	if (!ref) return null;
	return ref.breadcrumbLabel ?? ref.name ?? null;
}

/** Build breadcrumb trail from resolved location taxonomy refs (not URL parsing). */
export function buildPropertyBreadcrumbs(
	listing: PublicPropertyListing,
	canonicalPath: string
): BreadcrumbItem[] {
	const location = listing.location;
	const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

	const country = location?.country;
	const area = location?.area;

	if (country?.slug && labelFor(country)) {
		items.push({ label: labelFor(country)!, href: `/${country.slug}` });
	}

	if (area?.slug && country?.slug && labelFor(area)) {
		items.push({ label: labelFor(area)!, href: `/${country.slug}/${area.slug}` });
	}

	items.push({
		label: listing.publicTitle ?? listing.content?.heroHeadline ?? 'Property',
		href: canonicalPath
	});

	return items;
}

/** Build breadcrumb trail for a country stub page. */
export function buildCountryBreadcrumbs(
	country: LocationTaxonomyRef,
	canonicalPath: string
): BreadcrumbItem[] {
	const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
	const label = labelFor(country);
	if (!label) return items;
	items.push({ label, href: canonicalPath });
	return items;
}

/** Build breadcrumb trail for an area stub page. */
export function buildAreaBreadcrumbs(
	country: LocationTaxonomyRef,
	area: LocationTaxonomyRef,
	canonicalPath: string
): BreadcrumbItem[] {
	const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

	if (country?.slug && labelFor(country)) {
		items.push({ label: labelFor(country)!, href: `/${country.slug}` });
	}

	const areaLabel = labelFor(area);
	if (areaLabel) {
		items.push({ label: areaLabel, href: canonicalPath });
	}

	return items;
}

/** Build breadcrumb trail for a development from resolved location taxonomy refs. */
export function buildDevelopmentBreadcrumbs(
	development: PublicDevelopment,
	canonicalPath: string
): BreadcrumbItem[] {
	const location = development.location;
	const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

	const country = location?.country;
	const area = location?.area;

	if (country?.slug && labelFor(country)) {
		items.push({ label: labelFor(country)!, href: `/${country.slug}` });
	}

	if (area?.slug && country?.slug && labelFor(area)) {
		items.push({ label: labelFor(area)!, href: `/${country.slug}/${area.slug}` });
	}

	items.push({
		label: development.publicTitle ?? development.content?.heroHeadline ?? 'Development',
		href: canonicalPath
	});

	return items;
}

export function breadcrumbListJsonLd(items: BreadcrumbItem[], siteOrigin: string) {
	const itemListElement = items.map((item, index) => ({
		'@type': 'ListItem',
		position: index + 1,
		name: item.label,
		...(item.href ? { item: `${siteOrigin}${item.href}` } : {})
	}));

	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement
	};
}

/** HTML for a JSON-LD script tag (string concat avoids Sanity typegen misparsing Svelte templates). */
export function jsonLdScriptHtml(jsonLd: Record<string, unknown>): string {
	return (
		'<script type="application/ld+json">' + JSON.stringify(jsonLd) + '</script>'
	);
}
