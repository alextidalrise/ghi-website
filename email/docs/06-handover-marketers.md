# Handover: sending a campaign

For whoever writes and sends GHI email. No code required for the common case.

---

## What you can change, and where

The email has **locked** parts and **editable** parts.

**Locked** (you cannot change these, and that is deliberate): the green header
with the logo, and the entire green footer with the unsubscribe link, the
address and the "you are receiving this because..." line. Those are legal
requirements. The build refuses to produce a campaign without them.

**Editable regions**, which appear as named blocks in the Mailchimp builder:

| Region | What it holds |
|---|---|
| `hero_image` | The photograph at the top, and its description |
| `lead` | Greeting, small label, main headline, opening copy, main button |
| `cta_section` | The green block: heading, copy, gold button |
| `body` | The closing note |

---

## Writing rules that matter

**Subject line:** under 60 characters or it truncates in most inbox lists.

**Preview text:** under 140 characters. It is the line that appears next to the
subject in the inbox. Do not restate the subject; say the next thing.

**Headline:** under about 90 characters. Longer wraps to four lines on a phone.

**Button labels:** under 28 characters, and a verb plus an object. "View the
collection" works. "Learn more" does not say what happens; "Click here" is
meaningless to a screen reader reading links out of context.

**Links in body copy** are underlined. That is not a style choice we can drop:
email has no hover state, so without the underline colour would be the only
signal that something is a link, which fails accessibility rules.

**Image descriptions (alt text)** are required on every photograph. Write what
you would say to someone describing the picture: *"A villa above the fairway at
dusk, with La Concha and the Sierra Blanca beyond"*, not *"property image"*.
Many recipients, especially on Outlook and corporate Gmail, have images switched
off by default, so the description is what they get instead of the photograph.

**Never put important words inside a picture.** If the images do not load, the
words vanish.

---

## Personalisation

To use someone's first name, it must be wrapped so it degrades gracefully:

```
*|IF:FNAME|*Dear *|FNAME|*,*|ELSE:|*Dear reader,*|END:IF|*
```

A bare `*|FNAME|*` produces "Dear ," for every contact whose first name we do not
have, which on an imported list is most of them. The build refuses to ship one.

**Names look empty in a test send.** This is the single most common false alarm.
Mailchimp does not fill in contact fields for test sends. To see it working:
**Preview & Test → Enter preview mode → Live merge tag info**, then pick a real
subscriber.

---

## The one green block

An email gets **one** green block in the body, and it should be the single most
important moment: the thing you most want the reader to do.

The green header already spends the brand's budget for heavy colour, and the
footer is green too. Adding a second green block makes the email read as one
heavy slab and burns the only landing point the design has. The build will
reject it.

If a section needs to feel distinct and the green block is already used, ask for
a hairline rule or more space around it instead. That is what they are for.

Same with the small tracked capital labels (like "ANDALUCÍA"): **one per email**.
One reads as a considered brand mark. One above every section reads as a
template.

---

## Sending

1. Ask a developer to build the campaign, or follow
   [07-agent-integration.md](07-agent-integration.md) if the automated route is
   live by then.
2. In Mailchimp: **Content → Email templates**, find the GHI template.
3. Edit only inside the named regions.
4. **Plain-text tab:** paste in the reviewed `.txt` file the developer gives you.
   Do not accept Mailchimp's automatic version without reading it. It drops link
   context and can lose footer structure.
5. **Turn off** the Google Analytics tracking option. Our links already carry
   tracking parameters and the two double up.
6. Run **Inbox Preview** on the clients your audience actually uses.
7. Send a test to yourself. Read it on a phone.
8. Check the footer is there and the unsubscribe link works.
9. Send.

---

## If something looks wrong

| Symptom | Usually |
|---|---|
| Names are blank | Test sends do not fill them. Use live merge preview. |
| "[Message clipped]" in Gmail | The email is over ~102KB. Tell a developer; it needs measuring against the delivered file, not the source. |
| Photograph missing | Images blocked by the client, or the image was not uploaded to the CDN. The description should still read sensibly. |
| Colours look wrong on a phone | Some clients force their own dark mode. The green header and footer are designed to survive it; the white middle may shift. This is expected, not broken. |
| Buttons look square in Outlook | Correct. The brand has square corners everywhere. |
| Serif headline looks different | Outlook and Gmail substitute Georgia for our display font. Expected and designed for. |

---

## What to send a developer

- The campaign brief and copy
- The photograph, or which Sanity asset to use
- The destination URLs
- Which language
- The send date

They will produce the HTML, the plain-text version, and the QA screenshots.
