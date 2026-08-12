import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { publicClient } from './client';

const studioUrl =
	publicEnv.PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333/development';

/**
 * Control / enum fields that drive render branching or identity, not visible prose. Stega
 * encodes preview strings with invisible characters so the visual editor can map a rendered
 * word back to its field — great for editable copy, but fatal for a value the code compares
 * with `===` or emits as an `id`/anchor. `heroLayout === 'coBrand'`, `headingStyle === 'eyebrow'`,
 * a block's `style`, and the `anchor` used for the contents-rail id all silently stopped
 * matching in preview once encoded (the section eyebrows rendered as full serif headings, and
 * anchor ids carried zero-width noise). These keys are matched on the RESULT path (what the
 * query returns), so projection aliases like `"anchor": anchor.current` are covered too.
 */
const STEGA_SKIP_KEYS = new Set([
	'headingStyle',
	'heroLayout',
	'variant',
	'display',
	'style',
	'anchor',
	'layout',
	'align',
	'tone',
	'size'
]);

/**
 * Authenticated client for draft preview (server-only).
 * Requires SANITY_API_READ_TOKEN with viewer access to the dataset.
 */
export const serverClient = publicClient.withConfig({
	token: privateEnv.SANITY_API_READ_TOKEN,
	useCdn: false,
	stega: {
		studioUrl,
		enabled: true,
		filter: (props) => {
			const last = props.resultPath[props.resultPath.length - 1];
			if (typeof last === 'string' && STEGA_SKIP_KEYS.has(last)) return false;
			return props.filterDefault(props);
		}
	}
});
