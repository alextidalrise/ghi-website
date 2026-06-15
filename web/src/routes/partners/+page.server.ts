import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd, type BreadcrumbItem } from '$lib/listing/breadcrumbs';
import { fetchPartnerCategories } from '$lib/sanity/queries';

const BASE_PATH = '/partners';

export const load: PageServerLoad = async ({ url }) => {
	const canonicalUrl = `${url.origin}${BASE_PATH}`;

	const categories = await fetchPartnerCategories();

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Home', href: '/' },
		{ label: 'Partners', href: BASE_PATH }
	];

	const seo = {
		title: 'Trusted Partners | Golf Homes International',
		description:
			'Independent legal, tax, financial and property professionals across Spain and Portugal, each vetted to protect buyers. We make a personal introduction; the choice stays yours.',
		canonicalUrl,
		noindex: false
	};

	return {
		categories,
		breadcrumbs,
		seo,
		breadcrumbJsonLd: breadcrumbListJsonLd(breadcrumbs, url.origin)
	};
};
