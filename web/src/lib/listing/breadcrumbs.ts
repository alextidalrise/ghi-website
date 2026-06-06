import type { PublicPropertyListing, PublicDevelopment, PublicGolfCourse } from '$lib/sanity/transforms';

export type LocationTaxonomyRef = {
	_id?: string;
	name?: string | null;
	slug?: string | null;
	type?: string | null;
	breadcrumbLabel?: string | null;
	isCatchAll?: boolean | null;
};

export type BreadcrumbItem = {
	label: string;
	href: string | null;
};

type BreadcrumbLocation = {
	country?: LocationTaxonomyRef | null;
	location?: LocationTaxonomyRef | null;
	community?: LocationTaxonomyRef | null;
};

function labelFor(ref: LocationTaxonomyRef | null | undefined): string | null {
	if (!ref) return null;
	return ref.breadcrumbLabel ?? ref.name ?? null;
}

function locationRefs(source: { location?: unknown }): BreadcrumbLocation | null {
	return (source.location as BreadcrumbLocation | null | undefined) ?? null;
}

function communityFilterHref(
	countrySlug: string,
	locationSlug: string,
	communitySlug: string
): string {
	return `/${countrySlug}/${locationSlug}?community=${encodeURIComponent(communitySlug)}`;
}

/** Build breadcrumb trail from resolved location taxonomy refs (not URL parsing). */
export function buildPropertyBreadcrumbs(
	listing: PublicPropertyListing,
	canonicalPath: string
): BreadcrumbItem[] {
	const location = locationRefs(listing);
	const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

	const country = location?.country;
	const loc = location?.location;
	const community = location?.community;

	if (country?.slug && labelFor(country)) {
		items.push({ label: labelFor(country)!, href: `/${country.slug}` });
	}

	if (loc?.slug && country?.slug && labelFor(loc)) {
		items.push({ label: labelFor(loc)!, href: `/${country.slug}/${loc.slug}` });
	}

	if (
		community?.slug &&
		!community.isCatchAll &&
		loc?.slug &&
		country?.slug &&
		labelFor(community)
	) {
		items.push({
			label: labelFor(community)!,
			href: communityFilterHref(country.slug, loc.slug, community.slug)
		});
	}

	items.push({
		label: listing.title ?? 'Property',
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

/** Build breadcrumb trail for a location stub page. */
export function buildLocationBreadcrumbs(
	country: LocationTaxonomyRef,
	location: LocationTaxonomyRef,
	canonicalPath: string
): BreadcrumbItem[] {
	const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

	if (country?.slug && labelFor(country)) {
		items.push({ label: labelFor(country)!, href: `/${country.slug}` });
	}

	const locationLabel = labelFor(location);
	if (locationLabel) {
		items.push({ label: locationLabel, href: canonicalPath });
	}

	return items;
}

/** Build breadcrumb trail for a golf course page. */
export function buildGolfCourseBreadcrumbs(
	course: PublicGolfCourse,
	canonicalPath: string
): BreadcrumbItem[] {
	const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

	const country = course.community?.country;
	const location = course.community?.parent;
	const community = course.community;

	if (country?.slug && labelFor(country)) {
		items.push({ label: labelFor(country)!, href: `/${country.slug}` });
	}

	if (location?.slug && country?.slug && labelFor(location)) {
		items.push({ label: labelFor(location)!, href: `/${country.slug}/${location.slug}` });
	}

	if (community?.slug && location?.slug && country?.slug && labelFor(community)) {
		items.push({
			label: labelFor(community)!,
			href: communityFilterHref(country.slug, location.slug, community.slug)
		});
	}

	items.push({
		label: course.name,
		href: canonicalPath
	});

	return items;
}

/** Build breadcrumb trail for a development from resolved location taxonomy refs. */
export function buildDevelopmentBreadcrumbs(
	development: PublicDevelopment,
	canonicalPath: string
): BreadcrumbItem[] {
	const location = locationRefs(development);
	const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

	const country = location?.country;
	const loc = location?.location;
	const community = location?.community;

	if (country?.slug && labelFor(country)) {
		items.push({ label: labelFor(country)!, href: `/${country.slug}` });
	}

	if (loc?.slug && country?.slug && labelFor(loc)) {
		items.push({ label: labelFor(loc)!, href: `/${country.slug}/${loc.slug}` });
	}

	if (
		community?.slug &&
		!community.isCatchAll &&
		loc?.slug &&
		country?.slug &&
		labelFor(community)
	) {
		items.push({
			label: labelFor(community)!,
			href: communityFilterHref(country.slug, loc.slug, community.slug)
		});
	}

	items.push({
		label: development.title ?? 'Development',
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
