import { setPreviewing } from '@sanity/svelte-loader';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ data }) => {
	setPreviewing(data.preview);
	return data;
};
