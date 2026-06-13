# Listing Reviewer Guide

How to take a listing from raw intake to live on the website, using Sanity Studio.

This guide assumes you have access to [golfhomes.sanity.studio](https://golfhomes.sanity.studio/) and an understanding of the kind of property data we hold (price, beds/baths, location, photos, etc.). It does **not** assume any technical knowledge.

---

## 1. The big picture

Every listing — property, development, unit, unit type — moves through four stages:

```
Drafts ──▶ In review ──▶ Published ──▶ Unpublished
                              │
                              └──▶ (back to In review if something breaks)
```

- **Drafts** — the intake agent has dropped raw data in. Nobody's looked at it yet.
- **In review** — a human (you) has claimed it and is working through what's missing or unverified.
- **Published** — the listing is live on the public website.
- **Unpublished** — was live, has been pulled back. Includes "archived" listings we don't expect to bring back.

Your job as a reviewer is to take a listing from **Drafts**, work it up under **In review**, then move it to **Published** when ready. After that, you may occasionally need to handle issues on already-live listings.

---

## 2. Finding listings to work on

Open the Sanity Studio and look at the left-hand sidebar. Below the main content list (Properties, Developments, Units, Places, Golf courses) you'll see a single entry:

> **Listings status** (clipboard icon)

Click it to open a sub-pane with five views:

| View | What it shows | When you use it |
|---|---|---|
| **Drafts** | Listings nobody has claimed yet | Picking up new work |
| **In review** | Listings currently being worked on | Resuming your own work-in-progress |
| **Published** | Live on the website | Sanity-checking what's currently visible |
| **Unpublished** | Was live, now off | Finding something to bring back, or to permanently archive |
| **Published but blocked** | Live listings with an unresolved blocking review item — should normally be empty | Triaging anomalies |

Each view mixes all four document types: properties, developments, units, and unit types. The doc type is shown in each row's preview.

---

## 3. The end-to-end workflow

### 3.1 Pick up a listing from Drafts

1. Open **Listings status → Drafts**.
2. Pick a listing. Open it.
3. Switch the **Status** field (in the **Internal** group) from `draft` to `in_review`. Save.

That signals to the team that you're actively working on it. The listing now appears in **In review** for everyone, and disappears from **Drafts**.

### 3.2 Read the listing top to bottom

Before adding anything, just read what's there. The intake agent will have populated:

- **Title, name, slug** — sanity-check spelling, capitalisation, and that the slug is sensible.
- **Location** — country, location, community, map pin.
- **Pricing** — asking price, currency, fees, availability.
- **Specs** — beds, baths, built area, plot size, year built.
- **Media** — photos, floorplans, brochures, videos.
- **Copy** — overview, description, headline.
- **Internal** group — sources, commission, fees & tax, notes, Drive folders.
- **Review items** — almost always pre-populated. The intake agent flags everything it's unsure about as it ingests the data. Treat these as your starting checklist; you don't have to write everything from scratch.

You're not editing anything yet. You're forming an impression: what looks solid, what looks shaky, what's missing.

### 3.3 Work through Review items

The **Review items** field (Internal group) is your worklist. The intake agent will have left items there for anything it couldn't verify on its own — pricing discrepancies between source documents, missing legal docs, ambiguous facts, low-confidence map pins, etc. Your job is to walk down the list and resolve each one.

You'll also add new items yourself as you spot things the intake agent missed.

Each entry has:

- **Label** — one-line summary of the issue (required).
- **Detail** — optional longer explanation, links, source references.
- **Blocks publish** — checkbox.
  - **Ticked** = a blocker. The listing **cannot move to Published** until this is resolved.
  - **Unticked** = a non-blocking note. Lives on the listing as institutional memory.
- **Category** — one of Price, Facts, Media, Location, Copy, SEO, Legal, Internal (required).

#### When is something a blocker vs a note?

A **blocker** is anything that, if left as-is, would make publishing the listing wrong, illegal, embarrassing, or self-contradictory. Examples:

- "Confirm asking price with seller" — €1.85m vs €1.95m discrepancy between sources.
- "Energy certificate missing" — Spanish CEE legally required.
- "Floorplan PDF unreadable" — current scan is rotated and pixelated.
- "Hero image alt text missing" — accessibility requirement.

A **note** is context worth keeping but not blocking publish. Examples:

- "Owner is friend of M. — handle inbound personally."
- "Building access via gate code 4421."
- "Re-check pricing in Q3 if not sold."

**Rule of thumb:** if you can't write a clear "done = X" criterion for the item, it's a note, not a blocker.

#### When to record information as `internal.notes` instead

Some context is permanent and should live in the **Internal → Notes** field (a single free-text area), not in review items. Use `internal.notes` for:

- Sourcing details ("Listing data extracted from V.06 price list, June 2026").
- Long-running annotations that aren't tied to a question ("This developer always undersells — verify completion dates against neighbours").
- Anything you'd write in a "things future-me should know" memo.

Use **review items** for **questions** and **must-fixes**. Use **internal.notes** for **answers** and **standing context**.

### 3.4 Pricing — the `priceConfirmed` checkbox

Inside the **Pricing** field there's a `priceConfirmed` boolean. It's a simple "do we trust this number enough to show the public?":

- **Ticked** = "Yes, this price is verified." The website renders the number.
- **Unticked** = "Not yet confirmed." The website renders **POA** (Price On Application) regardless of what's in the `price` field.

Untick this any time the price is a folder hint, an old draft, or otherwise unverified. It's safer than leaving a wrong number visible.

### 3.5 Availability — `pricing.availabilityStatus`

For developments and units (not standalone properties), the **Availability status** drives the public inventory table:

| Value | Public site behaviour |
|---|---|
| `available` | Listed and clickable in the inventory table |
| `coming_soon` | Listed and clickable, with a "coming soon" tag |
| `under_offer` | Listed and clickable, with an "under offer" tag |
| `reserved` | Locked, non-clickable row |
| `sold` | Locked, non-clickable row |
| `withdrawn` | **Dropped from the website entirely** |
| `unknown` | Treated as available |

If a unit is being held off the market for any reason (legal hold, owner uncertainty), set it to `withdrawn`. Do **not** unpublish the parent development — `withdrawn` already takes the unit out of public view.

### 3.6 Resolve blocking review items

For each blocker:

1. Do the work it asks for. Edit the affected field, fetch the missing document, take the corrected photo, etc.
2. Once handled, **delete the review item row** (use the Resolve button on the item, or the array delete). Resolution = deletion. The item is gone.
3. If the item turned out to be a non-issue or only worth keeping as a note, untick **Blocks publish** and update the label/detail to reflect the new meaning. The item stays as a note.

You cannot publish while any `blocksPublish: true` items remain. The Studio will show a validation error on the document.

### 3.7 Publish

When all blockers are resolved and the listing is ready:

1. Set **Status** to `published`. Save.
2. The Studio's publish-gate validator confirms there are no open blockers. If anything's still unresolved, you get a validation error explaining what.
3. The listing now appears in **Published** in the desk and on the public website.

That's the happy path complete.

---

## 4. Post-publish: handling problems on live listings

Listings drift. Owners change their minds. Photos get retired. Prices move. You'll occasionally need to act on already-live listings.

### 4.1 Found a small issue — fix in place

If it's something you can fix without taking the listing offline (typo, wrong bullet, refresh photo), just edit the field. It's published live; the website picks up changes within a minute or two.

### 4.2 Found a serious issue — move back to In review

If the issue is significant enough that the listing shouldn't be live while you fix it (e.g. price is wrong by 20%, a legal flag has come up):

1. Set **Status** back to `in_review`. Save.
2. The listing immediately disappears from the public website.
3. Add a review item with `blocksPublish: true` describing what needs handling.
4. Work it like any in-review listing. Re-publish when fixed.

### 4.3 Found an issue but want to leave it live for now

You can add a `blocksPublish: true` review item to a published listing. The listing stays live (`status` doesn't change just because a review item is added), but it now shows up in the **Published but blocked** view as an anomaly.

This is the safety-net case. The view is meant to be empty in normal operation. If something lands there, the team should triage it: either resolve the blocker, untick `blocksPublish` (downgrade to a note), or move the listing back to **In review**.

### 4.4 Taking a listing off the site

Two reasons to unpublish:

- **Temporary** — the listing might come back. Set **Status** to `unpublished`.
- **Permanent** — the listing won't come back (sold via off-market, owner withdrew, dev cancelled). Set **Status** to `archived`.

Both states drop the listing from the public website. The difference is intent: `archived` says "don't expect to revive this." Both appear in the **Unpublished** desk view together.

To bring an unpublished listing back: set **Status** to `published` (or `in_review` first if it needs work).

---

## 5. Field reference (cheat sheet)

The five fields the lifecycle revolves around:

| Field | Lives on | What it controls |
|---|---|---|
| **Status** (top-level) | All gateable docs (property, development, unit, unit type) | Lifecycle. Public site shows only `published`. |
| **Review items** (top-level) | All gateable docs | Things to look at. `blocksPublish` items gate publish. |
| **Pricing → Availability status** | Pricing-bearing docs | How the unit appears in the inventory table; `withdrawn` removes it. |
| **Pricing → Price confirmed** | Pricing-bearing docs | Public site renders POA when this is unticked. |
| **Internal {…}** | All gateable docs | Categorically private (commission, fees & tax, notes, sources, Drive links). Never visible to the public. |

Anything inside the `Internal` group is private by design — it never reaches the website regardless of `status`. You can record sensitive operational detail there freely.

---

## 6. Common scenarios

**A development has 30 units, half are sold.**
Mark the sold units' `pricing.availabilityStatus = sold`. They render as locked rows. The development itself stays `published`. No need to unpublish anything.

**Pricing is unconfirmed but the rest is solid — can it go live?**
Yes. Set `priceConfirmed = false` so the site shows POA, and publish. Add a review item (`blocksPublish: false`, category Price) noting that price needs confirming when the seller responds. The site is honest about what it knows.

**A unit was published but the developer just sent a corrected floorplan.**
If the old floorplan is wrong/embarrassing: revert to `in_review`, swap the floorplan, re-publish. If it's just a refresh: replace the file in place, leave it published.

**Multiple reviewers want to work on the same listing.**
Sanity Studio shows when someone else has the document open. Coordinate over Slack — no built-in locking. Don't both edit at once. Assigning via a `blocksPublish: false` review item ("MJ working on pricing this week") is a lightweight way to claim it.

**Something appeared in "Published but blocked" — what do I do?**
Open it. Look at the blocking review item. Decide whether to:
- Resolve the blocker (delete the item) → returns to a clean published state.
- Downgrade it to a note (untick `blocksPublish`) → if the issue isn't actually publish-stopping.
- Move the listing to `in_review` → if the issue genuinely should take it off the site.

---

## 7. What you don't need to do

- **You don't need to manually sync anything to the public website.** Once `status = published` and validation passes, the website queries Sanity directly and picks up changes.
- **You don't need to track approvals.** Sanity stores full per-document history; we can see who changed what and when via the document's history panel.
- **You don't need to manage commission, fees & tax visibility.** Anything inside the **Internal** group is automatically excluded from public output — no flag to flip.
- **You don't need separate per-channel readiness states.** There's only one publish gate: `status = published` with no blocking review items. If we ever need embargoed launches, we'll add it deliberately.

---

## 8. When to ask for help

- **Validation error you don't understand** — drop the error message into Slack. They almost always point at a specific field.
- **A field that should be there isn't** — possibly a schema gap. Note the doc ID and ping a developer.
- **A doc shows "Unknown fields" warning** — usually a stale browser cache. Hard refresh first (Cmd/Ctrl+Shift+R). If it persists, it's a real schema gap; ping a developer.
- **You think a listing should publish but the validator refuses** — re-check the **Review items** list. Even a single `blocksPublish: true` item blocks the move to `published`.

---

## See also

- [`docs/sanity-gating.md`](./sanity-gating.md) — the architectural reference for the five-field model. More detail than you need day-to-day; useful when something is behaving unexpectedly.
- [`sanity/migrations/CHANGELOG.md`](../sanity/migrations/CHANGELOG.md) — record of one-shot data migrations.
