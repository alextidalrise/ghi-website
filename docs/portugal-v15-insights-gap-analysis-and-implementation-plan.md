# Portugal v15 → GHI Insights: gap analysis and implementation plan

**Status:** Proposal for design and development review  
**Source of truth:** Approved standalone Portugal article preview, version 15  
**Approved preview:** `web-preview/index.html`  
**Website repository reviewed:** `/home/admin/GHI/repos/ghi-website`  
**Scope:** Sanity schema, public GROQ projections, frontend types/renderers and production QA  
**Owner for frontend review and implementation:** Alex / GHI design and development team

## 1. Executive summary

The approved Portugal article is worth carrying forward. It combines an editorial article with five reusable commercial content patterns that the current GHI Insights system does not yet support properly:

1. destination feature rows;
2. a live development collection;
3. linked golf-course cards;
4. a partner-logo strip;
5. linked buying-guide cards.

The existing Insights system already supports the article shell, hero, author/date metadata, contents rail, prose, images, paired images, takeaways, FAQs, inline calls to action, a Front Line listing carousel and the closing enquiry band. The gap is therefore not a new article template. It is a focused extension of the existing modular Insights body.

**Recommendation:** keep the production Insights shell and add five reusable, reference-led body blocks. Use shared visual primitives underneath them, but retain semantic Sanity block types so editors cannot accidentally use a golf card as a development card or copy volatile commercial data into article text.

The development block is the highest priority. Prices, status and completion information must be read from the referenced live development records at render time, not copied into an Insight document.

---

## 2. Why the standalone template happened

### Chronology

1. **Initial campaign brief**  
   James described a Portugal-wide article for the opening emailer, covering the portfolio, lifestyle, golf courses and partners. At that stage the request concerned campaign content and did not define the review environment.

2. **Article drafting and campaign research**  
   The work gathered current developments, galleries, golf and partner material. The focus remained the campaign deliverable rather than the website's actual Insight schema and renderer.

3. **The pivotal request: “can we build out into a web preview?”**  
   I interpreted “web preview” as permission to create a self-contained visual prototype. I then used a design-artifact workflow and wrote `web-preview/index.html` with its own HTML, CSS, fonts and assets.

4. **The missing prerequisite check**  
   Before writing that file, I should have inspected:
   - the Sanity `insight` document and `insightSection` block vocabulary;
   - the production `InsightBody.svelte` dispatcher;
   - the current Insight page shell and preview route;
   - any unsupported design requirements.

   That check did not happen. No explicit choice was presented between:
   - a **production-faithful Insight preview**, and
   - a **standalone design concept**.

5. **The custom preview became the review object**  
   James and I then iterated the standalone file through multiple versions. Each round improved that design on its own terms, which increased the distance from the available CMS modules.

6. **The distinction was reinforced incorrectly**  
   Later discussion treated the standalone page as the “article-format web preview” that could subsequently be adapted for email. I should have corrected that description: it was a custom concept, not a preview of the website's real Insight implementation.

7. **Version 15 approval**  
   Version 15 was approved editorially and visually as a standalone artefact. It had not passed a production-template feasibility or parity review.

8. **The later Sanity reconstruction**  
   When asked to make it a proper Insight, unsupported sections were approximated with the available blocks. That introduced design and editorial drift because the production implementation was not rendering the same structured source.

### Root cause

The immediate trigger was an ambiguous “web preview” request, but the process failure was mine: I selected the output format before confirming the actual delivery system.

The deeper causes were:

- no mandatory CMS-first discovery step for website articles;
- no declared review-object type;
- I introduced the constraint **“standalone local artifact only, no GHI frontend changes”** without James asking for that limitation;
- I routed the request through design-prototype workflows and an old standalone HTML reference before checking the current Insight schema and renderer;
- when James described the preview as “the article format”, I did not correct the distinction;
- no feasibility gap was presented before visual approval;
- standalone HTML and the Sanity draft had separate content structures;
- approval was attached to a visual file rather than a locked structured-content manifest;
- unsupported components were substituted rather than escalated.

### Process correction

For any article intended for the GHI website:

1. **Inspect the live schema and renderer first.**
2. **Create the article in Sanity first.**
3. **Review it through the real frontend route.**
4. If a design concept is useful, label it **concept only — not production-faithful**.
5. Before concept approval, produce a feasibility matrix: supported, partially supported, unsupported.
6. Lock approved copy, imagery, order, links and CTAs in a versioned manifest.
7. Do not substitute unsupported modules. Raise a design/dev gap and keep the article in draft.
8. Require a parity check between the approved manifest, Sanity document and frontend render before publication.

---

## 3. Current Insights capability

### Already supported

The current system can retain or reproduce:

- production Insight page shell;
- category, title and optional title emphasis;
- subhead;
- hero image and caption;
- author, publication date and reading time;
- desktop and mobile contents navigation derived from section anchors;
- rich text and headings;
- inline links;
- single figures and figure pairs;
- compact portrait;
- simple editorial card grids;
- routes/decision aids;
- pull quotes;
- takeaways and key figures;
- FAQ blocks and FAQ structured data;
- inline CTA callouts;
- Front Line listing carousel;
- configurable closing CTA band;
- related Insights.

### Important existing implementation points

- Sanity document: `sanity/schemas/documents/insight.ts`
- Body block definitions: `sanity/schemas/objects/insightContent.ts`
- Object registration: `sanity/schemas/objects/index.ts`
- Public field projection: `web/src/lib/sanity/allowlists.ts`
- Frontend types: `web/src/lib/insights/types.ts`
- Body dispatcher: `web/src/lib/components/insights/InsightBody.svelte`
- Existing reusable renderer example: `InsightFrontlineRail.svelte`
- Existing entity components worth reusing:
  - `web/src/lib/components/golf/GolfCoursesSection.svelte`
  - `web/src/lib/components/guides/GuideCardLink.svelte`
  - `web/src/lib/components/partners/PartnerCard.svelte`
  - `web/src/lib/components/home/TrustedPartners.svelte`

---

## 4. Gap matrix

An independent repository review expanded the original five-block audit to **14 production jobs**. The five rich entity modules remain the main missing content blocks, but the hero and closing CTA also have material fidelity gaps.

| # | Approved v15 element/job | Current support | Required production change | Priority |
|---:|---|---|---|:---:|
| 1 | Standalone draft strip and campaign masthead | Intentional production-shell adaptation | Do not port; use standard GHI navigation, breadcrumb and footer | P2 |
| 2 | Equal split hero, square image and overlaid caption | Partial/lossy: current hero uses a narrower rail, 4:3 plate and caption below | Add reusable `heroLayout: standard | splitSquare`; keep standard as default | **P0** |
| 3 | Numbered desktop and mobile contents navigation | Supported | Use existing contents rail and exact section anchors | P2 |
| 4 | Ruled rich-section rhythm and wider module measure | Partial: current generic sections deliberately remove rules | Add `insightSection.presentation: standard | ruledRich` | **P0** |
| 5 | Opening serif lead paragraph | Partial: ordinary Portable Text flattens the hierarchy | Add `insightLead` | P1 |
| 6 | Four destination image/text/CTA panels | Unsupported as coherent repeated units | Add `insightDestinationGrid` with referenced location identity and article-owned copy/image override | **P0** |
| 7 | Tinted advisory enquiry prompt | Partial: existing CTA has the wrong visual treatment | Add `variant: default | advisory` to `insightCtaCallout` | P1 |
| 8 | Development intro lead and checked-data small print | Partial | Reuse `insightLead`; add `insightSmallPrint` | P1 |
| 9 | Ten live development cards grouped by destination | Unsupported for this job; Front Line rail has the wrong semantic and layout | Add `insightDevelopmentGrid`, live references, override-only article imagery and accessible mobile disclosure | **P0** |
| 10 | Four linked golf-course cards and split section intro | Unsupported | Add `insightCourseGrid` plus optional section intro/header layout | **P0** |
| 11 | Eight partner-logo cells and split section intro | Unsupported | Add `insightPartnerLogoGrid`; strictly exclude internal referral fields | **P0** |
| 12 | Two linked green buying-guide cards | Unsupported | Add `insightGuideCards` using canonical guide references and routes | **P0** |
| 13 | Exact two-action Portugal closing band | Partial/materially lossy: WhatsApp label/message are generic and the default Browse action can create a third action | Add WhatsApp label/message overrides and explicit secondary-action visibility; keep the number centralised | **P0** |
| 14 | Draft/noindex, SEO, author, related reading and global footer | Supported shell behaviour | Retain normal Insight route and publication gates | P1 |

### Two corrections to the initial audit

1. **Hero fidelity is not already solved.** The current schema stores the required content, but the production renderer cannot reproduce v15's equal split, square media or green overlay caption without an opt-in hero variant.
2. **The closing band is not already solved.** The current shared component hard-codes a generic WhatsApp label/message and supplies a default Browse action when no secondary override is passed. V15 needs one primary enquiry action and one Portugal-specific WhatsApp action, with no duplicate third button.

The full technically specific matrix, including exact field contracts, repository paths and per-module acceptance criteria, is in `v15-to-current-insights-gap-matrix-design-dev.md`.

### Not recommended

Do **not** solve the gap by adding a raw HTML block, arbitrary CSS field, iframe, article-specific Svelte component or Portugal-only page template. Those routes would recreate the same drift and maintenance problem inside the production site.

---

## 5. Proposed component architecture

### Shared visual foundation

Design and develop one shared responsive editorial-grid foundation for:

- consistent image ratios;
- card borders and spacing;
- heading, summary and action styles;
- responsive one/two/four-column rules;
- keyboard focus and hover treatment;
- empty and partial-data states.

Build semantic wrappers on top of it. Shared styling should not mean one untyped CMS block.

### A. `insightDestinationGrid`

**Purpose:** repeatable destination rows containing an image, location, short editorial explanation and contextual CTA.

**Sanity fields**

- optional block heading;
- ordered items, 2–6;
- `location` reference;
- optional article-specific image override;
- caption;
- short editorial body;
- CTA label override;
- optional CTA destination override, otherwise derive the canonical location URL;
- optional reversed image alignment per item, if design approves alternating rows.

**Renderer**

- desktop: image and copy in a balanced two-column row;
- mobile: image, caption, heading, body, CTA in source order;
- whole image may link, but heading/CTA must retain visible focus states;
- no card-style boxed treatment unless approved by design.

**Data rule:** destination identity and canonical URL come from the referenced location. Article-specific positioning copy remains in the Insight.

### B. `insightDevelopmentGrid`

**Purpose:** an ordered, grouped collection of current developments with live commercial facts.

**Sanity fields**

- heading and summary;
- ordered groups;
- group heading or location reference;
- ordered `development` references;
- optional image override per reference;
- `initialMobileCount` or a simple `collapseOnMobile` toggle;
- disclosure label;
- optional collection CTA.

**Live fields derived at query/render time**

- title;
- canonical URL;
- location/country;
- preferred approved gallery image, with optional editorial override;
- verified from-price and qualifier;
- development/build status;
- completion status/date;
- publish/indexability state.

**Behaviour**

- preserve editor order and destination grouping;
- automatically omit withdrawn, unpublished or non-indexable developments;
- show a clear fallback if a referenced development lacks a public price or completion date;
- never copy price/status/date into the Insight document;
- collapsed mobile view must be progressively enhanced and accessible;
- disclosure control uses correct `aria-expanded` and `aria-controls` states.

**Why the Front Line rail is not enough:** the approved article includes developments regardless of Front Line classification and needs grouping plus status/completion data. Reusing the visual card foundation is sensible; reusing the Front Line editorial contract is not.

### C. `insightCourseGrid`

**Purpose:** an editor-curated set of linked golf-course cards.

**Sanity fields**

- heading and summary;
- ordered `golfCourse` references, 2–8;
- optional image override;
- optional CTA label override.

**Derived fields**

- course name;
- location;
- canonical route;
- approved image;
- optional factual spec line if design wants it.

**Implementation note:** reuse the existing golf-course card transform and visual language where possible rather than creating a separate representation of the same entity.

### D. `insightPartnerLogoGrid`

**Purpose:** compact independent-partner logo display with service labels.

**Sanity fields**

- heading and explanatory body;
- ordered `partner` references;
- optional block CTA to the partners hub.

**Derived fields**

- public partner name;
- approved logo;
- public service/category label;
- public partner route or approved partners-hub URL.

**Rules**

- never expose internal referral URLs;
- retain the article's independence wording in prose;
- logos require meaningful alt text and consistent optical sizing;
- absent logos fall back to a typeset name without breaking the grid.

### E. `insightGuideCards`

**Purpose:** a small ordered selection of existing buying guides.

**Sanity fields**

- heading and summary;
- ordered `guide` references, normally 2–4;
- optional audience label override.

**Derived fields**

- title;
- subhead/card summary;
- hero/card image where applicable;
- canonical guide URL.

**Implementation note:** adapt or reuse `GuideCardLink.svelte`; do not duplicate guide titles and summaries in the Insight.

---

## 6. Delivery plan

### Phase 0 — design decisions and contracts

**Design team**

- Compare the approved v15 sections with the production design system.
- Approve desktop, tablet and mobile layouts for the five missing patterns.
- Decide image ratios, maximum item counts, spacing and collapse behaviour.
- Confirm whether destination rows alternate image alignment.
- Confirm whether development groups display location headings on all breakpoints.
- Confirm logo treatment for mixed aspect ratios and monochrome/colour marks.

**Development team**

- Agree block names and field contracts before implementation.
- Confirm canonical route helpers and public filters for location, development, golf course, partner and guide references.
- Confirm which existing cards/transforms can be reused without leaking the wrong semantics.

**Acceptance gate**

- Signed-off component sheet for all five blocks.
- Approved field contract with required, optional and derived fields.
- Explicit empty/partial/withdrawn data behaviour.

### Phase 1 — P0 presentation and data seams

Implement:

1. Add the opt-in `splitSquare` hero variant; preserve the current hero as the default.
2. Add `ruledRich` section presentation and the exact two-action closing-band controls.
3. Define and project the five reference-led entity blocks with strict TypeScript contracts.
4. Implement `insightDestinationGrid` and `insightDevelopmentGrid`, including live commercial transforms and accessible mobile disclosure.
5. Add Studio previews, validation, projection/transform tests and exact Portugal v15 fixtures.

**Acceptance gate**

- The production hero reproduces the approved split-square composition without changing existing Insights.
- The article can reproduce its four destination rows and ten live development cards in the production Insight page.
- No development price, status or completion date is stored in article copy.
- Removing or unpublishing a referenced development does not leave a broken card.
- Mobile users can access all developments without JavaScript-dependent loss of content.
- The closing band has exactly the approved enquiry and Portugal WhatsApp actions, with no default Browse button.

### Phase 2 — remaining rich modules and supporting fidelity

Implement:

1. `insightCourseGrid`.
2. `insightPartnerLogoGrid`.
3. `insightGuideCards`.
4. `insightLead` and `insightSmallPrint`.
5. Advisory CTA variant and optional split section intro/header layout.
6. Reuse existing entity transforms and route helpers.
7. Add Studio previews, validation, type coverage, interaction tests and visual tests.

**Acceptance gate**

- Golf cards resolve from current golf-course records.
- Partner blocks cannot project internal referral fields.
- Guide links use canonical guide data and routes.
- Opening/development text hierarchy, advisory prompt and split section intros match the approved design job.
- Missing images/logos have deliberate fallbacks.

### Phase 3 — article migration and parity review

1. Create/update the Portugal Insight draft using the approved v15 copy, imagery, order, links and CTAs.
2. Replace temporary approximations with the new semantic blocks.
3. Keep the production Insight shell, contents rail, author/date treatment and site footer; use the approved opt-in `splitSquare` hero variant for this article.
4. Run a structured parity audit against v15.
5. Review desktop, tablet and mobile renders section by section.
6. Reconfirm volatile commercial data and image rights immediately before publication.
7. Publish only after editorial, design, commercial-data and image sign-off.

**Acceptance gate**

- Every approved v15 section is either faithfully represented or recorded as an explicitly accepted production-system difference.
- Copy, image identity, order, CTA wording and destination URLs match the approved manifest.
- Sanity draft, frontend preview and public query all agree.

---

## 7. Technical change map

The exact filenames can follow repository conventions, but implementation is expected to touch:

### Sanity

- `sanity/schemas/documents/insight.ts` — add opt-in hero layout and closing-band WhatsApp/secondary-action controls.
- `sanity/schemas/objects/insightContent.ts` — define five rich blocks, item types, lead/small-print blocks and section/CTA presentation options.
- `sanity/schemas/objects/index.ts` — register new types before `insightSection`.
- Studio validation/tests — add limits, required references, unique selections and useful previews.

### Public query boundary

- `web/src/lib/sanity/allowlists.ts` — add explicit projections for all new blocks.
- Keep internal partner referral data and non-public entity fields outside projections.
- Publish-gate and indexability-filter referenced entities.

### Frontend contracts

- `web/src/lib/insights/types.ts` — add discriminated block types and hero/closing controls.
- Entity transforms — reuse or add narrow transforms for development, golf, partner and guide card data.
- `web/src/lib/components/insights/InsightBody.svelte` — dispatch all new body types explicitly.
- `web/src/lib/components/insights/InsightArticleHero.svelte` — add the opt-in split-square variant.
- `web/src/routes/insights/[slug]/+page.server.ts` — hydrate and public-filter referenced entities while preserving editor order.
- `web/src/routes/insights/[slug]/+page.svelte` — apply section modifiers and exact closing-band props.
- Shared `TalkToUsBand.svelte` — accept a safe WhatsApp label/message override while continuing to generate the number centrally.

### Renderers

Suggested components:

- `InsightDestinationGrid.svelte`
- `InsightDevelopmentGrid.svelte`
- `InsightCourseGrid.svelte`
- `InsightPartnerLogoGrid.svelte`
- `InsightGuideCards.svelte`
- `InsightLead.svelte`
- `InsightSmallPrint.svelte`

Use shared internal layout/card primitives where appropriate, but keep public component contracts semantic.

### Tests

At minimum:

- schema validation for required references, limits and uniqueness;
- projection tests proving only public fields are returned;
- transform tests for missing price/image/status/logo;
- canonical-link tests;
- withdrawn/unpublished reference behaviour;
- component tests for heading hierarchy and source order;
- keyboard and disclosure tests;
- visual regression at desktop, tablet and mobile widths;
- an exact Portugal v15 fixture to prevent future drift.

---

## 8. Global acceptance criteria

### Editorial fidelity

- Approved copy is not rewritten during component migration.
- Section order, image identity, captions, CTA labels and target URLs are preserved.
- Any necessary production-system difference is surfaced for approval rather than substituted silently.

### Commercial-data integrity

- Development price, status and completion fields come from current referenced records.
- Rendered values use existing GHI formatters and qualifiers.
- Missing or stale commercial fields degrade honestly; they are not inferred.

### CMS usability

- Editors can add and reorder items without code changes.
- References are filtered to the correct document type.
- Duplicate references are rejected.
- Studio previews identify the block and selected records clearly.
- Field descriptions explain which values are live and which are article-specific.

### Accessibility

- Logical heading hierarchy.
- Informative alt text and visible captions where supplied.
- Full keyboard access.
- Visible focus treatment.
- Accessible mobile disclosure.
- No information available only through hover.
- Contrast meets WCAG AA.

### Responsive quality

- No horizontal overflow at supported widths.
- Destination rows stack in a coherent reading order.
- Development facts remain legible without truncating critical values.
- Partner marks remain optically balanced.
- Cards do not create orphaned headings or awkward single-item final rows without an approved rule.

### Performance

- Responsive Sanity image URLs/srcsets.
- Lazy loading below the fold.
- No standalone font or stylesheet payload added by article content.
- Avoid fetching full entity documents where a narrow public card projection is sufficient.
- Layout remains stable while images load.

### Privacy and security

- New GROQ shapes are explicit allowlists.
- Internal referral URLs and operational fields never reach the browser.
- Authored links use existing URL validation/sanitisation.
- No raw HTML or arbitrary script/style capability is introduced.

---

## 9. Definition of done

The gap is closed only when:

- all five blocks exist in Sanity and render through the normal production Insight route;
- the Portugal article is assembled from those blocks, not an article-specific component;
- the production preview passes the v15 parity checklist;
- the development collection reads current commercial data from live references;
- responsive, accessibility, privacy and visual tests pass;
- design and editorial owners approve the actual frontend preview;
- image rights and current prices/statuses are reconfirmed;
- publication remains a separate explicit approval.

---

## 10. Recommended decision for the team

Approve the five-block extension as a reusable **commercial editorial layer for Insights**, with destination and development blocks delivered first. This preserves the strongest parts of the Portugal v15 design without creating a one-off Portugal template, and it gives future regional, launch and market articles a controlled way to present live GHI inventory and related expertise.
