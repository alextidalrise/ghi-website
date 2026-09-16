---
version: 1
slug: "web-src-routes-partners-page-svelte"
primary_target: "web/src/routes/partners/+page.svelte"
related_targets: ["web/src/routes/guides/+page.svelte","web/src/lib/components/country/CountryRoutes.svelte","web/src/lib/components/property/EnquiryShelf.svelte"]
---

# Surface brief: market-scalable Partners, Guides and country routes

Scope: /partners (coverage filter, market tags, honest-coverage note), /guides (grouped by market), the country page cross-link panel, and the listing enquiry shelf. Visitor mode: Operate (/partners, shelf) and Read (/guides).

Audience and job: affluent buyers in one specific market, asking "who handles this for me, here?" and "how does buying work here?". The network's totality is the credibility; their own market is the answer.

Proof the surfaces carry: live per-market partner counts (Spain 8, Portugal 7, UAE 2, Montenegro 1), real buying guides where written, and a plain statement where not.

Constraints: countries are taxonomy documents referenced by partner and guide (no code enum); one canonical market order (displayOrder); prose never enumerates markets, structure does; gold accent only; zero radius; 1px rules; country page's green band stays Frontline's.

Unresolved: country-refs migration must run against the live dataset (human approval); keyword-map rewrite for the region-led homepage; Insights has no country field (out of scope).

## Direction contract

THESIS: The site stops naming its markets and starts reading them. Every market list derives from country documents in one order, and a thin market says so honestly instead of going quiet. Refuses both per-country partner sections and silent omission.

OWN-WORLD: White editorial ground; InsightFilters chip row (1px --border chips, tabular counts, gold-fill active) for coverage; 1px-framed 3:2 flag stamps beside Playfair market names on hairline-topped blocks; InsightRoutes contained panel (1px border, gold top edge, --surface-tint bed, white-bed outline actions) on the country page.

STORY: A buyer sees how many vetted firms cover their market before clicking, finds their country's guides under its flag, and when something isn't there yet is offered the introduction by hand.

FIRST VIEWPORT: /partners: white hero (overline, Playfair title, lead, dot-separated markers), then why section; coverage chip row sits directly above the directory. /guides: text hero, then market blocks each led by stamp + serif name.

FORM: Extension of established surfaces inside the existing world; no concept roll (local extension per new-work section 3). Seed key: none.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
