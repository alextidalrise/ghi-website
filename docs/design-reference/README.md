# Design reference — frozen mockup (NOT the live system)

`index.html` is the original hand-built design-system showcase from before this became
a SvelteKit project. It is kept here **only as a visual reference / source of
inspiration**.

**Do not treat this as the source of truth.**

- It is a static HTML snapshot. Its "components" are hardcoded HTML/CSS, not the real
  reusable components.
- Its tokens are hardcoded inline and will drift from the live system.
- The live, authoritative design system is the code: `web/src/lib/styles/tokens.css`,
  `web/src/lib/styles/global.css`, and the components in `web/src/lib/components/`.
- The live, browsable showcase is the `/internal/design-system` route, which renders
  the real components and therefore cannot drift.

Open `index.html` directly in a browser to view it. Recovered from git history
(commit `ac566b9`, last live at `2f9e137^`) on 2026-06-01.
