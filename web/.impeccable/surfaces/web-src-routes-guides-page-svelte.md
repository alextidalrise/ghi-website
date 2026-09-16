---
version: 1
slug: "web-src-routes-guides-page-svelte"
primary_target: "web/src/routes/guides/+page.svelte"
related_targets: ["web/src/lib/components/guides/GuideFinder.svelte","sanity/schemas/documents/buyerType.ts"]
---

# Surface brief: Guides hub (/guides)

Scope: the /guides hub only. Guide pages, the enquiry shelf and the country routes panel link into guides and are untouched. Visitor mode: Operate (find my guide).

Audience and job: a buyer who knows two facts about themselves — who they are buying as (UK buyer, international buyer; editor-managed list) and where they are looking (a market). The hub's job is to turn those two answers into the one right guide, not to present a catalogue.

Proof the surface carries: the guide itself — its title, what it covers (its chapter headings), when it was last reviewed. Where no guide exists for that pairing, the honest statement and a real offer to talk it through; where a guide exists for the other buyer type, a pointer to it.

Constraints: buyer types are `buyerType` documents referenced by `guide.audience` (no code enum); markets use the canonical order; state lives in the URL (`?for=<buyer-type>&in=<market>`) and works without JavaScript; parameterised views are noindex with canonical /guides; no flag imagery on the hub; zero radius, 1px rules, square (never round) choice indicators; gold accent only; the hero keeps the page's one green band.

Unresolved: the buyer-type migration must run on the live dataset before merge (additive, safe for main); a compact every-guide text index stays at the foot for scanners and crawlers.

## Direction contract

THESIS: The hub stops listing guides and starts consulting: two questions an advisor would ask, then one answer. Refuses the grouped catalogue and the filter-over-a-list.

OWN-WORLD: White ground under the green text hero; Playfair questions over bottom-border questionnaire rows; square 1px green choice boxes that fill green when chosen; the answer as a contained --surface-tint panel with a gold top edge, Playfair guide title, a hairline chapter list, muted reviewed date, one filled green "Read the guide".

STORY: The visitor answers who and where, sees exactly which guide is theirs and what it covers, and reads it — or is told plainly that it is not written yet and offered the conversation.

FIRST VIEWPORT: Green text hero; on white, the two questions side by side on desktop (stacked on phones), each a Playfair prompt over a hairline row of square-box choices; the answer panel spans the content width directly beneath, holding the prompt to answer until both are chosen.

FORM: Whole-surface restructure inside the established world; structure "The Consultation", candidate 5 of 7 on the ordered list, locked by the user from the dealt hand. Seed key: b945ae03.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
