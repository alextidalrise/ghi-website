import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const prerender = false;

function canViewDesignSystem(): boolean {
	return env.ENABLE_DESIGN_SYSTEM === 'true' || env.VERCEL_ENV !== 'production';
}

export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({
		'X-Robots-Tag': 'noindex, nofollow, noarchive'
	});

	if (!canViewDesignSystem()) {
		error(404, 'Not found');
	}

	return {};
};
