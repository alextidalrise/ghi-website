# Sanity: derived location/country sync (handoff)

**Status:** ✅ Fixed 2026-06-07. Changing **Community** now updates the derived `location.location` / `location.country` refs in the Studio form, repair-on-open fixes documents saved with stale refs, and clearing the community clears both derived refs.

## Root cause

There were **two** independent bugs. The first explains why the prior form-patching attempts produced wrong/stale data; the second explains why, once the logic was correct, **nothing happened at all** (the sync code never even ran).

### Bug 1 — wrong onChange scope (patches went to garbage paths)

Every prior attempt synced derived fields via `useFormCallbacks().onChange` with **absolute** paths (e.g. `set(value, ['location'])`).

That callback is **not document-root scoped.** In Sanity v5 each field/object member re-provides `FormCallbacksContext` with an `onChange` that **prefixes every patch with the member's own field name** (`PatchEvent.from(event).prefixAll(member.name)` — see `node_modules/sanity/lib/index.js` lines 23279 / 21551 / 22696). So:

- From the **object input** (`location` field), `formOnChange(set(v, ['location']))` was re-prefixed to `location.location.*` → garbage path → silently dropped.
- From the **community input**, it was re-prefixed to `location.community.location.*` → garbage path → silently dropped.

That is exactly why direct API patches worked but form sync never did. The fix is the input's own **correctly-scoped `props.onChange`** with paths *relative to the object*.

### Bug 2 — field-level `components` shadowed the type-level input (the input never mounted)

The `location` field in `development.ts` / `propertyListing.ts` declared `components: { field: HideFieldTitle }`. A **field-level** `components` object **shadows** the type-level one: `locationFields` set `components: { input: LocationFieldsInput }` on the *type*, but because the field only declared `components.field`, Sanity used `HideFieldTitle` as the field wrapper and fell back to the **default object input**. So `LocationFieldsInput` was bundled and imported (its module-load ran) but **never mounted** — no mount, no effect, no sync, regardless of how correct the logic was.

Fix: declare the input **on the field**, alongside the wrapper, in both document types:

```ts
components: { field: HideFieldTitle, input: LocationFieldsInput }
```

> Diagnostic that nailed this: a `console.info` at module top-level fired (code is in the bundle) but one inside the component render never did (component never mounted). **If the sync "isn't running at all," check field-vs-type component shadowing first.**

## The fix

All sync lives in one place: **`LocationFieldsInput`** (the object input), using `props.onChange`. Sanity scopes that callback to the object and prefixes with the object's field name, so a patch with a path *relative to the object* (`set(ref, ['country'])`) correctly lands on `<object>.country`.

A single `useEffect` watches the community/location/country `_ref`s and, whenever they drift from the community's parent chain, emits `buildParentRefPatches` via `props.onChange`. This covers pick / swap / clear **and** repair-on-open — so the separate `CommunitySyncReferenceInput` patch-interception component was deleted, and `community` is now a plain reference field. If the parent-chain fetch returns null for a present community (transient read), derived refs are left untouched rather than wiped. The publish-time validation rule on `locationFields` remains as a safety net for the change-then-immediately-publish race.

**Original goal (met), verified locally (development dataset, Epic):** changing **Community** updates the derived **Location**/**Country** refs in the form before publish (Aloha → Alcaidesa flips Location Nueva Andalucía → Sotogrande, Country stays Spain); stale refs are repaired on open; each change converges with no patch loop.

---

## Problem statement

Editors pick a **community** on the Place tab. **Location** (area) and **country** should be derived automatically from the community’s parent chain in `locationTaxonomy`:

```
community.parent → location (type: "location")
community.parent.parent → country (type: "country")
```

These derived refs are **stored** on the document (not computed at query time). The frontend relies on them extensively — see GROQ patterns using `location.location->slug.current`, `location.country->slug.current`, and coalesce fallbacks through `location.community->parent`.

When `location.location` / `location.country` are stale:

- **URL routing and filters** can point at the wrong place
- **Deleting a taxonomy node** fails with “referenced by …” even though the editor shows the “correct” community
- **Draft vs published** diverge silently

---

## Affected schema

| Document types | Field | Object type |
|---|---|---|
| `development` | `location` | `locationFields` |
| `propertyListing` | `location` | `locationFields` |

Same object type and components for both — **not** a development-vs-property bug.

### `locationFields` shape

```typescript
{
  _type: 'locationFields',
  community: reference → locationTaxonomy (type: community),  // editor picks this
  location:  reference → locationTaxonomy (type: location),  // derived
  country:    reference → locationTaxonomy (type: country),    // derived
  addressDisplay: string,
  exactAddressInternal?: string
}
```

Parent chain GROQ (in `sanity/lib/locationFieldsSync.ts`):

```groq
*[_id == $id][0]{
  "locationRef": parent._ref,
  "countryRef": parent->parent._ref
}
```

---

## Reproduction

### Fixture document (development dataset)

| Item | Value |
|---|---|
| Document | `sample.development.epic` (Development “Epic”) |
| Draft id | `drafts.sample.development.epic` |
| Sample taxonomy | `sample.location`, `sample.country`, `sample.community` (from `sanity/fixtures/sample-development/seed.ts`) |

### Steps

1. Open **Development** workspace: https://golfhomes.sanity.studio/development (or local http://localhost:3333/development)
2. Open **Epic** → **Place** tab
3. Note **Community**, **Location**, **Country** (location/country are read-only reference pickers)
4. Change community to a different place (e.g. Aloha → Alcaidesa)
5. **Expected:** Location and Country update immediately to match the new community’s parent chain
6. **Actual:** Community updates; Location and Country stay on the previous area

### Verify in Vision

```groq
*[_id in ["sample.development.epic", "drafts.sample.development.epic"]]{
  _id,
  _updatedAt,
  "community": location.community->name,
  "communityRef": location.community._ref,
  "locationRef": location.location._ref,
  "locationName": location.location->name,
  "countryRef": location.country._ref,
  "countryName": location.country->name
}
```

**Known bad state example** (community changed, location stale):

- `communityRef`: `places-community-alcaidesa`
- `locationRef`: `places-location-nueva-andalucia` ← should be `places-location-sotogrande`

### API patch works (proves logic is correct)

From repo root, using write token in `sanity/.env.local`:

```bash
cd sanity && node -e "
import { createClient } from '@sanity/client';
import { readFileSync } from 'fs';
import { PARENT_CHAIN_QUERY, buildSyncedLocationFieldsValue } from './lib/locationFieldsSync.ts';

const token = readFileSync('.env.local', 'utf8').match(/SANITY_API_TOKEN=(.+)/)?.[1];
const c = createClient({ projectId: 's88o8sjb', dataset: 'development', apiVersion: '2025-05-01', token, useCdn: false, perspective: 'raw' });

const doc = await c.fetch('*[_id == \"drafts.sample.development.epic\"][0]{ location }');
const ref = doc.location.community._ref;
const chain = await c.fetch(PARENT_CHAIN_QUERY, { id: ref });
const synced = buildSyncedLocationFieldsValue(doc.location, chain, ref);
await c.patch('drafts.sample.development.epic').set({ location: synced }).commit();
console.log(synced);
"
```

After this patch, Vision shows correct refs — but changing community again in Studio breaks sync again.

---

## Draft vs published (important)

Sanity keeps separate **draft** and **published** documents. Studio edits the draft. Reference integrity on delete checks **both**.

- Published Epic: `sample.development.epic`
- Draft Epic: `drafts.sample.development.epic`

Symptoms:

- Editor shows updated community on draft
- Delete Sample Coast still blocked → check **draft** referencers, not just published
- Orange “unpublished changes” on document

Always query both ids in Vision when debugging.

---

## API access gotcha

Tokens in `sanity/.env.local` (`SANITY_AUTH_TOKEN` / deploy token) **cannot read** `development`, `unit`, or `unitType` documents — queries return 0 results.

Use **`SANITY_API_READ_TOKEN`** from `web/.env.local` (or `SANITY_API_TOKEN` with Editor role) to inspect developments.

Project: `s88o8sjb`, dataset: **`development`** (web dev uses this via `PUBLIC_SANITY_DATASET=development`).

---

## Current implementation (still broken in UI)

### Files

| File | Role |
|---|---|
| `sanity/schemas/objects/locationFields.ts` | Schema; publish-time validation; wires the object input |
| `sanity/lib/locationFieldsSync.ts` | Pure sync logic (`buildParentRefPatches` / `isParentChainSynced`) |
| `sanity/lib/locationFieldsSync.test.ts` | Unit tests for the sync logic |
| `sanity/components/LocationFieldsInput.tsx` | **Object input — single source of truth for sync** (pick/swap/clear + repair-on-open) via `props.onChange` |
| `sanity/components/ReadOnlyReferenceInput.tsx` | Read-only display for location/country |

> `CommunitySyncReferenceInput.tsx` was **deleted** — its patch-interception approach was the wrong layer (see Root cause above). `community` is now a plain reference field.

### Intended flow

1. Editor changes community in `CommunitySyncReferenceInput`
2. Parse patches from reference picker (`community` or `community._ref`)
3. Fetch parent chain via GROQ
4. Build full object with `buildSyncedLocationFieldsValue()`
5. Patch document via `useFormCallbacks().onChange(PatchEvent.from(set(value, objectPath)))`
6. `LocationFieldsInput` useEffect repairs stale state when document opens

### Object-level validation

Publish is blocked if community and derived refs are out of sync (custom rule on `locationFields`).

---

## What was tried and why it failed

### 1. Hidden fields + `useEffect` on object input (original)

- `location` and `country` were `hidden: true`; only community visible
- `LocationFieldsInput` synced via async `useEffect`
- **Failed:** race on Publish (save before fetch completes); editor never showed derived values

### 2. Visible `readOnly: true` on schema

- **Failed:** programmatic sibling patches from object `onChange` appeared to be ignored or stripped for read-only fields

### 3. Wrapping object `onChange` / `renderInput` on object input

- Intercept patches at `locationFields` object level
- **Failed:** nested community reference input does not reliably bubble through wrapped `onChange`; community updated via default path, siblings did not

### 4. `ObjectInputMember` + custom `renderInput`

- Render members manually with wrapped renderInput for community
- **Failed:** same — community changed, location/country stale

### 5. Patch detection for `community._ref`

When **swapping** an existing reference, Sanity emits:

```javascript
set('places-community-aloha', ['community', '_ref'])
```

Not `set({ _type: 'reference', _ref: '...' }, ['community'])`. Helpers were updated to detect this — **still not enough** because intercept was not firing or form patch was not applied.

### 6. `useFormCallbacks` + document-level `set(..., objectPath)` (current)

- `CommunitySyncReferenceInput` patches entire `locationFields` at path `['location']` on the document
- **Still reported broken** by editor after deploy

---

## Hypotheses for next agent

1. **`CommunitySyncReferenceInput` onChange wrapper never runs** — reference picker may bypass custom input in some Studio versions / auto-update runtime (local 5.28 vs hosted 5.30). Confirm with temporary `console.log` in `handleChange` and `syncCommunity`.

2. **`useFormCallbacks().onChange` + `PatchEvent.from(set(..., objectPath))` incorrect** — path may need encoding, or `set` at document root may merge incorrectly with draft layer. Try:
   - `formOnChange([set(...)])` without PatchEvent
   - `prefixPath` from `sanity` package
   - Multiple patches: community set + location set + country set

3. **Async sync + forward race** — when patch detection fails, `props.onChange(event)` forwards `_ref`-only patch; derived fields never updated. **Fallback:** on any community input change, read new ref from `useFormValue([...path, 'community'])` after microtask and sync.

4. **Hosted Studio auto-updates** serving older bundle — verify deployed bundle includes `CommunitySyncReferenceInput` (search built `sanity/dist` or network tab). Deploy: `cd sanity && pnpm exec sanity deploy -y`.

5. **Consider architectural alternatives** (if form patching remains unreliable):
   - **Stop storing** `location` / `country`; derive only in GROQ (large frontend migration)
   - **Document action** “Sync place hierarchy” + **pre-publish** server-side mutation
   - **`sanity-plugin-documents-json`-style** listener on publish to normalize
   - **Only store `community`**; denormalize location/country in a migration on publish

---

## Suggested approaches (priority order)

### A. Debug-first (1–2 hours)

1. Add logging to `CommunitySyncReferenceInput.handleChange` — log `patches`, `objectPath`, `communityRef`
2. Confirm logs appear when changing community in hosted Studio
3. If logs appear but UI stale → problem is `formOnChange` / patch path
4. If no logs → custom input not mounted; check schema registration and deploy

### B. Robust community input (if wrapper runs but patch fails)

Replace patch parsing with explicit ref from picker callback if Sanity exposes one, or:

```typescript
// After forward(event), read live value:
const nextRef = useFormValue([...objectPath, 'community'])?._ref
// then sync if nextRef !== previousRef
```

Use `useEffect` on `useFormValue([...objectPath, 'community'])` inside `CommunitySyncReferenceInput` to trigger sync whenever community ref changes (avoid relying on patch shape entirely).

### C. Publish-time enforcement (safety net)

Document action or `document.actions` / validation that runs client-side fetch + patches document before publish allowed. Doesn’t fix live UI but prevents bad data going live.

### D. Schema simplification

Store only `community` on `locationFields`; remove stored `location`/`country` refs after migrating GROQ to always walk `community->parent`. Big change; eliminates sync class of bug.

---

## Tests

```bash
cd sanity && pnpm test lib/locationFieldsSync.test.ts
```

Covers `buildSyncedLocationFieldsValue`, `buildParentRefPatches`, patch detection including `community._ref`. **Does not** test React Studio inputs — add integration test or manual checklist.

---

## Manual test checklist (after fix)

- [ ] Open Epic draft, Place tab — location/country match community on load (repair on open)
- [ ] Change community A → B — location/country update **before** Publish
- [ ] Publish — Vision shows consistent refs on published doc; draft cleared or matches
- [ ] Repeat on a **property listing** (same `locationFields`)
- [ ] Delete sample taxonomy — no referencers after Epic is synced
- [ ] Hard refresh hosted Studio — behaviour unchanged (not local-only)

---

## Related commands

```bash
# Local Studio
cd sanity && pnpm dev
# → http://localhost:3333/development

# Deploy Studio
cd sanity && set -a && source .env.local && set +a && pnpm exec sanity deploy -y

# Sample fixture seed / delete
SANITY_API_TOKEN=… pnpm --filter sanity sample:seed
SANITY_API_TOKEN=… pnpm --filter sanity sample:delete
```

---

## Frontend dependency (why stored refs matter)

Listing/development URL resolution and filters use stored refs, e.g.:

```groq
coalesce(
  location.location->slug.current,
  location.community->parent->slug.current
) == $locationSlug
```

Coalesce provides fallback when `location.location` is missing, but **stale** `location.location` takes precedence and routes to the wrong place. Sync must keep stored refs accurate, not just community.

---

## Contact context from debugging session

- User could not delete `sample.location` (Sample Coast) because Epic referenced it via stale `location.location`
- Changing community to Aloha appeared to work in UI but Vision showed mismatched refs on **draft**
- API patch of full `location` object fixes data temporarily; Studio change breaks it again
- Issue affects **developments and property listings** equally (same object type)
