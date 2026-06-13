import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd, type BreadcrumbItem } from '$lib/listing/breadcrumbs';

const BASE_PATH = '/about';

export const load: PageServerLoad = async ({ url }) => {
	const canonicalUrl = `${url.origin}${BASE_PATH}`;

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Home', href: '/' },
		{ label: 'About', href: BASE_PATH }
	];

	const seo = {
		title: 'About Us | Golf Homes International',
		description:
			'Specialists in golf property across Spain and Portugal, built around people, not just listings. Meet the team and the trusted network that makes buying abroad simpler and safer.',
		canonicalUrl,
		noindex: false
	};

	return {
		breadcrumbs,
		seo,
		breadcrumbJsonLd: breadcrumbListJsonLd(breadcrumbs, url.origin)
	};
};
