/**
 * Permanent redirects for pre-hierarchy URLs that Google still holds from an older sitemap.
 *
 * Before the country → location → community hierarchy landed, some Estepona areas were
 * addressed as if `estepona` were a top-level region: `/estepona/estepona` (the town itself)
 * and `/estepona/el-campanario` (a community within it). Both now 404 — there is no country
 * with slug `estepona` — so they waste crawl budget and leak whatever link equity they hold.
 *
 * Neither has an exact live equivalent: `/spain/estepona` is the town's canonical page and
 * `el-campanario` has no standalone community page, so both fold into the Estepona location,
 * the nearest genuine ancestor. Keys are normalised (no trailing slash) before lookup.
 */
const LEGACY_PATH_REDIRECTS: Readonly<Record<string, string>> = {
	'/estepona/estepona': '/spain/estepona',
	'/estepona/el-campanario': '/spain/estepona'
};

/** Resolve a legacy pathname to its permanent target, or null when none applies. */
export function resolveLegacyRedirect(pathname: string): string | null {
	const normalised = pathname.replace(/\/+$/, '') || '/';
	return LEGACY_PATH_REDIRECTS[normalised] ?? null;
}
