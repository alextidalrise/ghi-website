# Image performance standard

The rule for every image on the site. Goal: modern formats, right-sized, no layout
shift, no multi-MB downloads.

## The five rules

1. **CMS / editorial imagery** (listings, heroes, guides, location & country cards)
   MUST go through the Sanity image pipeline:
   - `buildPublicImageUrl(asset, opts)` and `buildImageSrcset(asset, widths, opts)`
     from [`web/src/lib/sanity/image.ts`](../web/src/lib/sanity/image.ts).
   - `.auto('format')` is baked in, so the CDN negotiates **AVIF → WebP → JPEG**
     per request. You get modern formats for free — do **not** hardcode a format.
   - Always pass `width`/`height` (and `fit: 'crop'`) so the URL is right-sized and
     the `<img>` can carry matching `width`/`height` attributes.

2. **Local / static raster** (brand defaults, fallbacks, marketing pages that can't
   be in the CMS) must be **pre-optimized**: sized to the largest real display width
   (heroes ≤ 2000px), progressive JPEG at q72–80, no raw multi-MB files. A static
   URL can't content-negotiate, so prefer migrating the image into Sanity (see
   `/about` for the pattern) over keeping it static. If it must stay static, treat a
   single optimized JPEG as the floor.

3. **Vector / UI** (logos, icons) = **SVG**.

4. **Every `<img>`** carries:
   - explicit `width` + `height` (prevents CLS),
   - `loading="lazy"` by default; `loading="eager"` + `fetchpriority="high"` **only**
     for the LCP/above-the-fold hero,
   - `decoding="async"`,
   - meaningful `alt` (or `alt=""` if purely decorative).

5. **Budget**: photographic quality ~75–82; never ship an image larger than ~2× its
   max display size. Card thumbs single-size is fine; full-bleed heroes get a
   `srcset`.

## Why not "just WebP"?

Because the Sanity pipeline already serves **AVIF** to browsers that support it and
falls back to WebP then JPEG automatically. Standardising on WebP everywhere would be
a downgrade of the dynamic path. The only gap is static assets, which bypass that
negotiation — so the work is keeping static imagery out of the hot path, not picking
one format.

## Migrating a static image into the pipeline (the `/about` pattern)

If a page renders a hardcoded `/static/...` image of a place that already exists as a
`locationTaxonomy` doc, query that doc's `heroImage` instead and build the URL in the
loader:

- Add an allowlisted query in `web/src/lib/sanity/queries/` (never ad-hoc GROQ in a
  page — see the `fetchLocationHeroesBySlug` helper in `queries/settings.ts`).
- In `+page.server.ts`, fetch the `heroImage` asset and build `image` + `srcset` with
  the helpers, keeping any page-specific editorial labels (name/region/alt) local.
- In the component, render `<img src srcset sizes width height loading decoding>`.

This keeps the editorial copy where it belongs while the bytes flow through the same
optimized, format-negotiated CDN path as the rest of the site.

## Verifying

Measure against a **production build** (the dev server's unbundled output is
meaningless for perf):

```bash
cd web
set -a && . ./.env.local && set +a
PREVIEW_ALL_LISTINGS=true node_modules/.bin/vite build
PREVIEW_ALL_LISTINGS=true node_modules/.bin/vite preview --port 4180 --strictPort
# then, against the running server:
bash .gstack/benchmark-reports/measure.sh <tag>   # local harness (gitignored)
```
