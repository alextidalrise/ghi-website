---
version: 1
slug: "web-src-lib-components-sitenav-svelte"
primary_target: "web/src/lib/components/SiteNav.svelte"
related_targets: ["web/src/lib/nav/siteNav.ts","web/src/lib/sanity/queries/headerNav.ts","sanity/schemas/objects/headerNav.ts"]
---

# Surface brief: SiteNav (header + mobile drawer)

Scope: the site header bar, its desktop dropdown/shelf, and the mobile drawer. Visitor mode: Operate (wayfinding).

Audience and job: affluent, older dreamers and active buyers who want to see where GHI operates and reach a location page in one calm move. Proof the surface carries: the real market list (Spain, Portugal, UAE, Montenegro) with editor-curated locations, and the same 1px-framed 3:2 flag stamp the homepage country index uses.

Constraints: menu is CMS-authored in Sanity (siteSettings.headerNav), three tiers max, communities never appear, no hover-cascade flyouts, gold is accent/state only, zero border radius, 1px rules, one green surface (the bar and its shelf are one object).

Unresolved: the drawer breakpoint is measured at build, not assumed; Montenegro enters the menu only when editors add it.

## Direction contract

THESIS: The header stops enumerating countries and starts curating them. One word, "Countries", opens a single shelf where every market is visible at once: flag, name, and its places. It refuses both the per-country top-level slot and the cascading flyout.

OWN-WORLD: Deep green bar and shelf as one object; warm ivory Light 300 tracked caps for tier 1; Playfair mixed-case country heads beside a 1px-framed 3:2 flag stamp; Regular 400 tracked caps for locations on hairline-ruled rows; vertical hairlines between columns; a 2px gold rule on the shelf's top edge and a deep offset shadow beneath. Gold appears only as that rule and as hover/active ink.

STORY: The visitor sees in one glance how far GHI reaches and where, then lands on a location page in two moves on desktop and three taps on mobile. The drawer opens on the countries as its first act.

FIRST VIEWPORT: The 60px bar with Countries, Front Line Collection, Buying Guide, Partners, Insights, About, and the gold Contact button. With Countries open: a full-width shelf beneath the bar, its columns aligned to the 1060px content width, each column a flag stamp and serif country name over a ruled list of locations, top-aligned, columns never stretched to equal height.

FORM: Extension of the established SiteNav surface inside the existing world; no concept roll was run (local extension per new-work section 3). Seed key: none.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
