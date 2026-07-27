# Mailchimp implementation

Written against **Mailchimp Standard**. HubSpot remains the CRM; nothing here
touches contact sync, which is out of scope.

---

## Upload as a template, not as Code Your Own

Two ways to get custom HTML into Mailchimp, and the choice has consequences.

| | Template | Code Your Own |
|---|---|---|
| Marketer can edit inside locked regions | yes, via `mc:edit` | no |
| Link Checker available | yes | **no** |
| Reusable across campaigns | yes | no |
| API can post section-by-section | yes (`template.sections`) | whole-HTML only |

**Use the template route.** It gives marketers safe editing, restores Link
Checker, and gives the future agent a section-keyed API surface. The raw-HTML
path stays working as the agent's alternative, so both are supported from one
source.

Upload: **Content → Email templates → Create template → Code your own → Paste in
code**, then paste `build_production/<name>.html`.

---

## Editable regions

`mc:edit` names are a **contract**, not decoration. They are what a marketer sees
in the builder *and* the keys the Mailchimp API accepts under
`template.sections`. Renaming one breaks any campaign or automation built against
it.

| Region | Component | Contents |
|---|---|---|
| `hero_image` | `x-figure` | Lead image and its alt text |
| `lead` | `x-section` | Greeting, overline, h1, lead copy, primary CTA |
| `cta_section` | `x-band` | The green band: heading, copy, secondary CTA |
| `body` | `x-section` | Closing note |

**Locked, never editable:** the `<head>`, the preheader, the masthead, and the
entire footer. A marketer cannot remove the unsubscribe link, the address or the
permission reminder by editing content, and `bin/validate.mjs` fails the build
if they go missing from the source.

Adding a region means adding an `edit` prop in the template and documenting it
here in the same commit.

---

## Merge tags

The full registry with per-tag notes lives in `lib/merge-tags.mjs`. The validator
checks every `*|...|*` against it, so a typo like `*|UNSUBSCRIBE|*` fails the
build instead of shipping literal text to an inbox.

### Required in the footer

| Tag | Purpose |
|---|---|
| `*|UNSUB|*` | Unsubscribe URL. Legal requirement. |
| `*|UPDATE_PROFILE|*` | Preference centre. |
| `*|LIST:ADDRESS|*` | Physical mailing address, from audience settings. |
| `*|ARCHIVE_PAGE_URL|*` | View in browser. |

`*|LIST:ADDRESS|*` is used rather than a hard-coded address so it stays correct
by construction when the office moves.

`*|ARCHIVE|*` emits a complete `<a>` element, not a URL, so it cannot be wrapped
in our own anchor. `*|ARCHIVE_PAGE_URL|*` gives the bare URL, which is what the
footer uses so the link carries brand styling and a localised label.

### Personalisation

**Always wrap a contact merge tag in a conditional.** A bare `*|FNAME|*` renders
"Dear ," for every contact missing the field, which on an imported audience is
most of them.

```html
*|IF:FNAME|*Dear *|FNAME|*,*|ELSE:|*Dear reader,*|END:IF|*
```

`bin/validate.mjs` fails an unguarded `FNAME`, `LNAME`, `PHONE`, `ADDRESS` or
`BIRTHDAY`, and separately checks that every `*|IF:|*` is balanced. An unclosed
conditional makes Mailchimp swallow the rest of the email.

### Before the first real send

**Audience merge tags are per-audience.** `FNAME` exists because someone created
it on that audience; nothing guarantees it. Confirm the real field list under
**Audience → Settings → Audience fields and \*|MERGE|\* tags** and reconcile
`lib/merge-tags.mjs` with it. This has not been done yet: we do not have access
to the live audience.

---

## Preview text

The email carries its own hidden preheader div rather than relying on
Mailchimp's preview-text field. The trailing zero-width entity run is load
bearing: without it Gmail pulls the first sentence of body copy in after the
preheader, which reads as a duplicated headline in the inbox list.

If someone also fills Mailchimp's preview-text field, the two compete. Leave it
empty, or keep them identical.

---

## Known Mailchimp limitations

### Link Checker

Not available for Code Your Own campaigns. Using the template route restores it,
but it is not sufficient on its own: it does not check that a destination
*accepts* tracking parameters, only that it resolves. Run the independent check
as well:

```bash
pnpm --filter email validate:links
```

### Merge tags do not populate in test sends

Contact-specific tags render blank in an ordinary test send. This causes more
false "personalisation is broken" reports than any other single thing.

Check them properly with **Preview & Test → Enter preview mode → Live merge tag
info**, choosing a real subscriber. Or send to a controlled live segment of
internal addresses. The validator lists which tags will be blank in a test send
so the reviewer knows what to ignore.

### Mailchimp rewrites the source after upload

Every `href` becomes a click-tracking URL, and Mailchimp injects its own footer
markup. This happens *after* we hand the file over, so:

- **Compiled size understates delivered size.** Roughly 150 bytes per link.
- **The compiled file is not what lands in the inbox.** Size and link checks are
  only conclusive against the delivered source.

Pull the delivered source back and re-run:

```bash
node bin/validate.mjs --delivered ~/Downloads/delivered.html
```

Getting the delivered source: send a test to yourself, open in Gmail, **Show
original**, save the HTML part.

### Tracking parameter collision

Mailchimp appends `mc_cid` and `mc_eid` to every link, and can additionally
append UTM parameters if the campaign's Google Analytics option is enabled.
Campaign links in this system already carry their own UTMs in the content, so
**leave Mailchimp's GA option off** or the parameters double up.

The build deliberately does not append UTMs itself: doing so would also rewrite
`*|UNSUB|*` and `*|ARCHIVE|*`, appending a query string to a string Mailchimp has
not resolved into a URL yet.

### Ampersands

Write a plain `&` in template hrefs. Writing `&amp;` produces `&amp;amp;` in the
output, which ships a literal `&amp;` in the query string. Every UTM value after
the first then becomes part of the previous one's value and the campaign reports
as untagged traffic. The validator fails on this.

---

### Web fonts must load via `<link>`, not `@import`

Mailchimp's template importer parses every `@import` inside a `<style>` block
server-side and **errors if it cannot fetch the imported file** — "Cannot find a
CSS file at ...". A real email client would simply ignore an `@import` it does
not support. The build therefore requests the Google Fonts via a `<link>` in the
layout `<head>` (`src/layouts/main.html`), which the importer leaves alone. Apple
Mail honours `<link>` identically; everything else falls back to Georgia/Arial
regardless. Do not move the font request back into the CSS as an `@import`.

### The footer's company and address come from Audience settings

`*|LIST:COMPANY|*` and `*|LIST:ADDRESS|*` resolve from **Audience → Settings**,
not from the template. If they are unset the footer renders blank there, and the
physical address is a legal sending requirement. Confirm both before the first
send. `*|CURRENT_YEAR|*` is automatic.

## Send checklist

1. `pnpm --filter email check` passes.
2. `pnpm --filter email validate:links` passes.
3. Upload to Mailchimp as a template.
4. Paste the reviewed `.txt` into the plain-text tab. Do not accept Mailchimp's
   auto-generated version without reading it.
5. Set subject and leave preview text empty.
6. Confirm Google Analytics tracking is **off** (our links carry UTMs).
7. Inbox Preview on the top clients by audience data.
8. Test send, then live-merge preview for personalisation.
9. Pull the delivered source, run `--delivered`, confirm under 102KB.
10. Confirm the footer is present and the unsubscribe link resolves.
