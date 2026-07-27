/**
 * Locale loading and direction-aware helpers.
 *
 * One campaign is one locale. Mailchimp sends to a language segment, so a
 * translated campaign is a separate template file and a separate campaign,
 * not a switch inside one email. Each template sets `locale:` in front matter
 * and the build resolves everything else from here.
 *
 * RTL: because every component in this system is horizontally symmetric (equal
 * left and right cell padding, never asymmetric), right-to-left support reduces
 * to three things — the `dir` attribute, text alignment, and the direction of
 * the arrow glyph. That symmetry constraint is enforced by the validator, and
 * it is the reason Arabic works without a parallel stylesheet.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const localesDir = join(here, '..', 'locales');

/** @returns {string[]} every locale code with a file on disk */
export function availableLocales() {
	return readdirSync(localesDir)
		.filter((f) => f.endsWith('.json'))
		.map((f) => f.replace(/\.json$/, ''))
		.sort();
}

/**
 * Load a locale definition.
 * @param {string} code
 */
export function loadLocale(code = 'en') {
	const available = availableLocales();

	if (!available.includes(code)) {
		throw new Error(
			`Unknown locale "${code}". Available: ${available.join(', ')}. ` +
				`Add locales/${code}.json to introduce a new one.`
		);
	}

	return JSON.parse(readFileSync(join(localesDir, `${code}.json`), 'utf8'));
}

/**
 * Direction-aware values derived from a locale.
 *
 * `start`/`end` map to the physical alignment keywords that email clients
 * understand. `align="start"` is not supported in email, so these resolve to
 * left/right at build time rather than at render time.
 *
 * @param {{dir: string}} locale
 */
export function directionHelpers(locale) {
	const rtl = locale.dir === 'rtl';

	return {
		rtl,
		start: rtl ? 'right' : 'left',
		end: rtl ? 'left' : 'right'
	};
}

/**
 * Build the full template context for a locale. Called by `beforeRender` in
 * config.js, so every template and component sees the same shape.
 *
 * @param {string} code
 */
export function localeContext(code = 'en') {
	const locale = loadLocale(code);

	return {
		i18n: locale,
		...directionHelpers(locale)
	};
}
