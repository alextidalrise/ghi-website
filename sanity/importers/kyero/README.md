# Kyero V3 feed importer

Ingests a partner's [Kyero V3](https://kyero.com) XML property feed into Sanity. See the full plan and
decisions in [`docs/kyero-feed-ingestion-plan.md`](../../../docs/kyero-feed-ingestion-plan.md).

## Status

**Epic 1, step 1 — the dry run — is done.** Everything here is **read-only**: it fetches/parses/maps a
feed and reports what it *would* create and what needs a human. **No Sanity connection, no writes.**

```bash
pnpm --filter sanity kyero:dry-run                          # default: the murciaservices feed URL
pnpm --filter sanity kyero:dry-run -- --file sample.xml     # a saved fixture
pnpm --filter sanity kyero:dry-run -- --url https://…       # any other Kyero feed
```

The report covers: feed shape, property-type mapping (flagging unmapped/empty types), the distinct towns
that need community resolution, measured data-quality gaps, image counts, and a sample of mapped listings.

## Files

| File | Role |
|---|---|
| `parse.ts` | Kyero XML → flat `KyeroProperty[]` (fast-xml-parser; handles CDATA + entities) |
| `kyero-map.ts` | The **static** half: field + closed-set vocabulary maps. Unknowns return `null` so the caller routes them to reconciliation rather than guessing. |
| `types.ts` | Value-type aliases mirroring `schemas/constants/enums.ts` |
| `dry-run.ts` | Orchestrates parse → map → report. Read-only. |

## Not done yet (deliberately gated)

- **Writing drafts** — waits on D-2 (drafts vs auto-publish) and D-3 (town→community mapping home).
- **Image upload, GHI-id allocation, re-sync/dedupe** — Epic 1 steps 1.4–1.8.
- **Town→community resolution** — needs the `sourceAliases` field (Epic 2). The dry run currently marks
  every town "unresolved" because the Murcia/Costa Cálida region isn't seeded in the taxonomy yet.

The town→community judgement calls are **not** code — they belong to editors in Studio (see the plan).
