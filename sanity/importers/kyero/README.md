# Kyero V3 feed importer

Ingests a partner's [Kyero V3](https://kyero.com) XML property feed into Sanity as **draft**
`propertyListing` documents. See the full plan and decisions in
[`docs/kyero-feed-ingestion-plan.md`](../../../docs/kyero-feed-ingestion-plan.md).

## Two commands

**Read-only report** — feed shape, type mapping, towns, data-quality gaps, image counts:

```bash
pnpm --filter sanity kyero:dry-run                          # default: the murciaservices feed URL
pnpm --filter sanity kyero:dry-run -- --file sample.xml     # a saved fixture
```

**Build/write drafts** — `import.ts` is **dry-run by default** (no client, no token, no writes); pass
`--write` to `createOrReplace` drafts into a non-production dataset:

```bash
pnpm --filter sanity kyero:import                           # dry-run: build + print what WOULD be written
pnpm --filter sanity kyero:import -- --limit 5              # only the first 5
pnpm --filter sanity kyero:import -- --write                # WRITE drafts → development dataset
pnpm --filter sanity kyero:import -- --write --dataset development
```

`--write` needs `SANITY_API_TOKEN` (write) or a logged-in Sanity CLI. Production is refused outright.

## What each draft carries

- `status: 'draft'`, `listingKind: 'property'`; stable id `kyero-import-<ref>` so a re-sync updates in
  place (no duplicates). The repo gates on the `status` field + `validatePublishGate`, not native drafts.
- Mapped fields: type, transaction, price, specs (beds/baths/build status/pool), cleaned copy → short +
  Portable-Text about, `video_url`, raw `<notes>` → `internal.notes`.
- **Province → location** resolved deterministically (`mapProvince` + feed-wide town→province consensus).
- **Left for others, each with a blocking review item** (nothing can publish until resolved):
  - `location.community` — unset; **external AI agents** assign it (raw town/province in `internal.feedImport`).
  - `ghiListingId` — unset; the **external GHI-ID pipeline** assigns it.
  - media gallery — **not ingested yet** (Epic 1.5).
  - imported copy — must be reviewed before going live (D-2).

## Files

| File | Role |
|---|---|
| `parse.ts` | Kyero XML → flat `KyeroProperty[]` (fast-xml-parser; handles CDATA + entities) |
| `kyero-map.ts` | The **static** half: field + closed-set vocab maps + `mapProvince`. Unknowns return `null` — the caller flags rather than guesses. |
| `build-draft.ts` | **Pure**: `KyeroProperty` → draft `propertyListing` doc + review items. No client, no clock. Plus `buildProvinceConsensus`. |
| `import.ts` | Orchestrator: parse → build → report; `--write` commits via `createOrReplace`. |
| `dry-run.ts` | Read-only feed report (shape, mappings, data-quality). |
| `types.ts` | Value-type aliases mirroring `schemas/constants/enums.ts` |

## Not done yet (deliberately)

- **Image upload** (Epic 1.5) — the next step; each draft is currently held by a media review item.
- **Removal handling** (Epic 1.8) — feed-absent listings flagged, not auto-deleted.
- **Town→community resolution** — not code; owned by external AI agents reading `internal.feedImport`.
