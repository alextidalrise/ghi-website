/**
 * EUR-normalised numeric price, shared by the listing search query (sort + min/max
 * facets) and the homepage facet-row projection so the two never drift.
 *
 * `coalesce(pricing.price, pricing.priceFrom)` is the raw native amount (properties use
 * `price`, developments a `priceFrom` range floor). It is multiplied by a per-currency
 * rate param so all comparisons happen in EUR. EUR and any unknown/missing currency fall
 * through to the literal 1. Callers must supply $rateGBP/$rateUSD/$rateAED — see
 * `rateQueryParams()` in `$lib/currency/rates`.
 *
 * Wrapped in parentheses so it composes safely everywhere it is interpolated — notably
 * `order(<expr> desc)`, where GROQ rejects a bare arithmetic expression before the `desc`
 * keyword ("unexpected postfix operator").
 */
export const PRICE_NUMERIC_EUR = /* groq */ `(coalesce(pricing.price, pricing.priceFrom) * select(
    pricing.currency == "GBP" => $rateGBP,
    pricing.currency == "USD" => $rateUSD,
    pricing.currency == "AED" => $rateAED,
    1
  ))`;
