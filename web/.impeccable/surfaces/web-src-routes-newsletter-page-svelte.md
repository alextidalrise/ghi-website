---
version: 1
slug: "web-src-routes-newsletter-page-svelte"
primary_target: "web/src/routes/newsletter/+page.svelte"
related_targets: ["web/src/routes/newsletter/+page.server.ts","web/src/lib/server/mailchimp.ts"]
---

Scope: /newsletter, Persuade. Organic Instagram traffic (bio link, posts), mostly phones. Basecamp todo 10318279399.

Job: say what the newsletter is and take an email within seconds. Offer = new homes as they come to market (by chosen country) + a regular letter. Frequency undecided: copy says "regular", never "monthly".

Owner rulings (2026-09-23): clarity over atmosphere; imagery only if it does a job (none does here). Single opt-in; consent evidence = ip_signup + timestamp_signup + Source tag + consent line. Keep site header/footer (organic traffic); footer signup hidden on this route. noindex, out of sitemap. Markets as Mailchimp tags, not groups. Dated "recent arrivals" ledger dropped: _createdAt is Sanity import time (feed imports land in batches), not market arrival.

## Direction contract
THESIS: A plain offer and its form, nothing else. Refuses the category's photo hero + newsletter-box template and any conceit (letter, story sequence).
OWN-WORLD: GHI system unchanged. White page, Playfair 600 display headline in green, two gold-diamond bullets, the form on the page's one green band (Frontline surface: radial top-left light, 0.31→0.24 gradient, gold hairlines) in the contact panel's concierge idiom: gold-underlined field, ivory chips with a gold tick, full-width gold Subscribe, gold focus. Split added 2026-09-23 on owner steer for more personality.
STORY: Visitor reads one sentence, sees the two things they get, types an email and subscribes. "You're subscribed" replaces the form, then an optional "Which countries interest you?" step (Save, or Skip), then "You're all set". Countries moved after sign-up 2026-09-23 so Subscribe clears every phone's first screen.
FIRST VIEWPORT: Phone: headline, two bullets, then the panel with email field and chips; Subscribe on or near the first screen. Desktop ≥56rem: 50/50 split filling the first screen: offer on white (left, aligned to the site column), green band bleeding to the right edge with the 27rem form centred in it. Phone: offer on white, then the green band grown to meet the footer.
FORM: Owner-steered canon (clarity-first single column); surface seed d4aa6306 hand declined in favour of it.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
