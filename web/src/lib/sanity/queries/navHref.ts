/**
 * GROQ that resolves a `navLink` object to a concrete href.
 *
 * A `navLink` (see the Studio object of the same name) is one of three styles: a `reference`
 * to a country / location / community / guide document (the canonical path is derived from the
 * linked doc's slug, so it stays correct if the slug later changes), a hand-typed `internal`
 * path, or an `external` URL. This is the single source of that resolution — the header and
 * footer navigation and the insight hero link all read a `navLink` and all resolve it here,
 * rather than each query re-spelling the six-way `select`.
 *
 * `prefix` is the field-access path to the navLink from the current GROQ scope, including the
 * trailing dot. The header/footer store it in a field named `link` (so `"link."`, the default);
 * the insight hero stores it in `heroLink` and projects `navHref("heroLink.")`. Pass `""` when
 * the navLink object is itself the current scope.
 *
 * Written as an expression-bodied arrow so `@sanity/typegen`, which statically inlines these
 * fragments into the query types, can evaluate the call — a block body (with a `return`) is not
 * something its extractor supports.
 */
export const navHref = (prefix = 'link.') => `select(
		${prefix}linkType == "external" => ${prefix}externalUrl,
		${prefix}linkType == "internal" => ${prefix}internalPath,
		${prefix}linkType == "reference" && ${prefix}reference->_type == "guide" => "/guides/" + ${prefix}reference->slug.current,
		${prefix}linkType == "reference" && ${prefix}reference->type == "country" => "/" + ${prefix}reference->slug.current,
		${prefix}linkType == "reference" && ${prefix}reference->type == "location" => "/" + ${prefix}reference->parent->slug.current + "/" + ${prefix}reference->slug.current,
		${prefix}linkType == "reference" && ${prefix}reference->type == "community" => "/" + ${prefix}reference->parent->parent->slug.current + "/" + ${prefix}reference->parent->slug.current + "?community=" + ${prefix}reference->slug.current
	)`;

/** True when the navLink at `prefix` is a hand-typed external URL. */
export const navExternal = (prefix = 'link.') => `${prefix}linkType == "external"`;
