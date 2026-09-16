/**
 * Referring to a market.
 *
 * A country used to exist twice: as a `locationTaxonomy` document (real, editable, with
 * the flag, hero and description on it) and as a frozen string in `COUNTRY_OPTIONS`,
 * which is what `partner.countries` and `guide.country` actually stored. Adding a market
 * therefore meant a document AND a code change, a web deploy and a Studio deploy — and
 * forgetting the enum left the market untaggable, while a typo in it matched nothing,
 * silently.
 *
 * Anything that needs to say "this belongs to a market" now references the taxonomy
 * document. A new market is one document, and every Studio dropdown populates itself.
 *
 * Note for migrations: country document IDs are NOT uniform. Spain and Portugal were
 * seeded with stable `places-country-<slug>` IDs; UAE and Montenegro were created in
 * Studio and carry random UUIDs. Always resolve a country by `slug.current`, never by
 * constructing an ID.
 */

/** The document type a market reference points at. */
export const COUNTRY_REFERENCE_TO = [{ type: 'locationTaxonomy' as const }];

/**
 * Narrows the reference picker to countries, so an editor cannot tag a partner or a
 * guide with a location or a community.
 */
export const COUNTRY_REFERENCE_OPTIONS = { filter: 'type == "country"' };
