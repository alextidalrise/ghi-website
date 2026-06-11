# Units table missing on uploaded developments — Hermes uploader bug

**For:** the Hermes upload agent team
**From:** GHI website engineering
**Severity:** content-blocking (development pages render with no inventory table)
**Scope:** all developments uploaded in the affected batch (Portugal + 2 Spain), 172 documents total

---

## Symptom

On recently uploaded development pages, the **"Properties available" units table does not render at all**. The rest of the page (gallery, summary, about, enquiry rail) renders fine. Example:

`/portugal/algarve/azuya-algarve-golden-triangle` — no units table.

Other developments (e.g. Capri, Amaris Villas in Spain) render their units table correctly. The difference is entirely in how the documents were written, not in the website code.

---

## Root cause

The uploader writes the development's `units[]` (and `unitTypes[]`) **reference `_ref` values with a `drafts.` prefix**:

```jsonc
// Azuya development, units[] array — AS UPLOADED (broken)
{ "_type": "reference", "_ref": "drafts.ghi00132-azuya-unit-a-review-only" }
```

A Sanity reference `_ref` must always point at a document's **canonical id**, never the `drafts.`-prefixed id. The `drafts.` prefix belongs **only** on the `_id` of a draft document, never inside a `_ref` that points to it.

### Why this breaks the table specifically

The website's preview/review client reads Sanity with the **`drafts` perspective** (so unpublished, in-review content can be previewed). Under that perspective:

- A document is exposed at its **canonical id** (`ghi00132-azuya-unit-a-review-only`).
- **No** document exists at the literal id `drafts.ghi00132-azuya-unit-a-review-only`.

So when the page dereferences `units[]->`, every reference points at a literal `drafts.…` id that doesn't exist → each dereference resolves to **null** → the website drops the null rows → the table has zero rows → it is not rendered.

Evidence (development dataset, `drafts` perspective — what the site uses):

```
*[slug.current=="azuya-algarve-golden-triangle"][0]{ units[]->{_id} }
→ { "units": [null, null, null, null, null, null, null, null, null, null, null] }   // 11 dangling refs

*[_id=="drafts.ghi00132-azuya-unit-a-review-only"][0]._id   → null        // no such document
*[_id=="ghi00132-azuya-unit-a-review-only"][0]._id          → resolves    // the unit lives here
```

> Note for whoever debugs this in GROQ: `count(units[]->[defined(_id)])` misleadingly returns 11 — `count()` does not strictly dereference. The projection form `units[]->{…}` (what the app actually runs) returns nulls. Trust the projection.

---

## Working vs broken — side by side

Same dataset, same query, `drafts` perspective:

| Development | Country | `units[0]._ref` as written | Base doc exists? | `units[]->` resolves? | Table renders? |
|---|---|---|---|---|---|
| **Capri** (ghi00126) | Spain | `ghi00126-capri-b2e2-2c-review-only` ✅ canonical | yes | **8/8** | ✅ yes |
| **Amaris Villas** (ghi00128) | Spain | `ghi00128-amaris-villas-villa-9-review-only` ✅ canonical | yes | **7/7** | ✅ yes |
| **Azuya** (ghi00132) | Portugal | `drafts.ghi00132-azuya-unit-a-review-only` ❌ prefixed | no | **0/11 (null)** | ❌ no |
| **Monte Rei** (ghi00130) | Portugal | `drafts.ghi00130-monte-rei-apartment-211-review-only` ❌ prefixed | no | **0/55 (null)** | ❌ no |
| **Tyrian Residences** (ghi00129) | Spain | `drafts.ghi00129-tyrian-residences-tyr-101-review-only` ❌ prefixed | no | **0/17 (null)** | ❌ no |

The decisive difference is the **`_ref` prefix**. The working uploads reference units by canonical id; the broken uploads reference them by `drafts.`-prefixed id.

(The broken set also happens to be draft-only with no published base document. That is secondary — publishing is **not** required for the table to render in preview. A draft-only unit referenced by its **canonical** id resolves fine under the drafts perspective. The single thing that must change is the `_ref` value.)

This is also why it isn't really a "Portugal" problem — the affected batch is whatever Hermes uploaded with prefixed refs. Tyrian (Spain) is broken the same way; the Portugal developments just happen to be the whole recent batch.

---

## The fix (uploader side — this is the real fix)

When writing reference fields (`units[]`, `unitTypes[]`, `parentDevelopment`, `parentUnitType`, and any other `_ref`), **strip any `drafts.` prefix from the `_ref` value**. The reference must always be the canonical id:

```jsonc
// CORRECT
{ "_type": "reference", "_ref": "ghi00132-azuya-unit-a-review-only" }

// WRONG (current behaviour)
{ "_type": "reference", "_ref": "drafts.ghi00132-azuya-unit-a-review-only" }
```

The `drafts.` prefix is only ever valid on a document's own `_id`. It is never valid inside a `_ref`. This holds whether the target document is being created as a draft or as published.

Concretely, wherever the uploader computes a ref, apply: `ref = id.startsWith("drafts.") ? id.slice("drafts.".length) : id`.

Once the uploader is fixed, please confirm the **next** upload writes canonical refs so this doesn't recur (the migration below only cleans up the existing 172 docs).

---

## Remediation for the already-uploaded data

The website repo already has a migration that retro-fixes the affected documents:

`sanity/migrations/fix-draft-ref-prefix-migrate.ts`

A read-only dry run against the development dataset reports:

```
Phase 1 — Would create 172 base documents   (materialise canonical ids for draft-only docs)
Phase 2 — Would patch 172 documents         (strip the drafts. prefix from _ref values)
```

Phase 2 is the part that restores the units table. Run it (with a write token) once the uploader is fixed:

```bash
# dry run first
pnpm --filter sanity migrate:fix-draft-ref-prefix:dry-run -- --dataset development
# apply
pnpm --filter sanity migrate:fix-draft-ref-prefix -- --dataset development
```

Then repeat for the production dataset if the same documents exist there.

---

## How to verify the fix

After the uploader change + migration, on a development page (e.g. Azuya) confirm:

1. `units[]->{_id}` under the `drafts` perspective returns resolved unit objects, not nulls.
2. The page renders the "Properties available" table with the expected row count.

A quick GROQ check (drafts perspective):

```
*[_type=="development" && slug.current=="azuya-algarve-golden-triangle"][0]{
  "resolvedUnits": units[]->{_id, unitName}
}
```

Every entry should be an object, none `null`.
