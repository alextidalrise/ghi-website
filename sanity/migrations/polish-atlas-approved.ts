/**
 * Polish pass on the Atlas Bridge Wealth draft, aligning it to the approved PDF mockup.
 * Fixes five things the initial wiring lost or mislabelled:
 *
 *   1. The opening line under "Meet our partner" is a large serif standfirst (the `lead`
 *      block style), not body prose — an intentional hierarchy step the mockup carries.
 *   2. The partnership-box portrait is the approved neutral-background headshot, not the
 *      earlier yellow-wall photo.
 *   3. "This week's partner insight" is a serif section title, not a small eyebrow label.
 *   4. The review sub-heads live under a dedicated "What to review" eyebrow section (the
 *      mockup's shoulder line that had gone missing).
 *   5. "A UK ISA is not automatically tax-free in Portugal" is a serif in-body heading
 *      (h3), not a section-level eyebrow.
 *
 * Idempotent: re-running detects the applied shape and makes no further change. Pass
 * `--dry-run` to preview. Operates on the draft only (the doc is unpublished).
 */
import { createClient } from '@sanity/client';
import fs from 'node:fs';

const DRAFT_ID = 'drafts.insight-meet-atlas-bridge-wealth-portugal-nhr-planning';
const OLD_PORTRAIT_REF = 'image-2b49ec578b4d38f28559745176273b0f12643a67-4284x5712-jpg';
const NEW_PORTRAIT_PATH =
  '/tmp/claude-1000/-home-ghi-website/615e7299-cc5a-4e61-8a29-4b5d9b778622/scratchpad/steve-source.png';
const ISA_HEADING = 'A UK ISA is not automatically tax-free in Portugal';

const dryRun = process.argv.includes('--dry-run');

const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}
const client = createClient({
  projectId: 's88o8sjb',
  dataset: 'development',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN,
  useCdn: false
});

type Block = Record<string, any>;
type Section = { _key: string; heading: string; headingStyle?: string; anchor?: { current?: string }; body: Block[] };

function isH3(b: Block) {
  return b._type === 'block' && b.style === 'h3';
}

async function run() {
  const doc: any = await client.getDocument(DRAFT_ID);
  if (!doc) throw new Error(`Draft not found: ${DRAFT_ID}`);
  const sections: Section[] = JSON.parse(JSON.stringify(doc.sections));

  const secPartner = sections.find((s) => s.anchor?.current === 'our-partnership-with-atlas-bridge-wealth');
  const secInsight = sections.find((s) => s.anchor?.current === 'this-weeks-partner-insight');
  const secReview = sections.find(
    (s) =>
      s.anchor?.current === 'uk-isa-not-automatically-tax-free-in-portugal' ||
      s.anchor?.current === 'what-to-review'
  );
  if (!secPartner || !secInsight || !secReview) {
    throw new Error('Expected sections not found — has the draft structure changed?');
  }

  const alreadyApplied =
    secInsight.headingStyle === 'serif' &&
    !secInsight.body.some(isH3) &&
    secReview.anchor?.current === 'what-to-review' &&
    secPartner.body[0]?.style === 'lead';

  // ---- Item 1: lead standfirst -------------------------------------------------------
  const firstBlock = secPartner.body.find((b) => b._type === 'block');
  if (firstBlock && firstBlock.style === 'normal') firstBlock.style = 'lead';

  // ---- Item 3 + 4 + 5: re-home the review sub-heads ----------------------------------
  // Everything from the first in-body h3 onward moves out of "This week's partner insight"
  // and into the "What to review" section; the intro paragraphs stay behind.
  const splitAt = secInsight.body.findIndex(isH3);
  if (splitAt > -1) {
    const moved = secInsight.body.slice(splitAt);
    secInsight.body = secInsight.body.slice(0, splitAt);

    const isaHeadingBlock: Block = {
      _type: 'block',
      _key: 'polish-h3-uk-isa',
      style: 'h3',
      markDefs: [],
      children: [{ _type: 'span', _key: 'polish-h3-uk-isa-span', text: ISA_HEADING, marks: [] }]
    };
    // What-to-review body: moved review flow → the ISA heading (demoted) → its original prose.
    secReview.body = [...moved, isaHeadingBlock, ...secReview.body];
  }
  secReview.heading = 'What to review';
  secReview.anchor = { ...(secReview.anchor || {}), _type: 'slug', current: 'what-to-review' } as any;
  secReview.headingStyle = 'eyebrow';

  // ---- Item 3: promote the insight section title to serif ----------------------------
  secInsight.headingStyle = 'serif';

  // ---- Item 2: swap in the approved portrait -----------------------------------------
  const profile = secPartner.body.find((b) => b._type === 'insightPartnerProfile');
  const currentRef = profile?.portrait?.asset?.asset?._ref;
  let portraitAction = 'unchanged';
  if (profile && currentRef === OLD_PORTRAIT_REF) {
    if (dryRun) {
      portraitAction = `would upload ${NEW_PORTRAIT_PATH} and re-point portrait`;
    } else {
      const asset = await client.assets.upload('image', fs.createReadStream(NEW_PORTRAIT_PATH), {
        filename: 'steve-thompson-atlas-bridge-wealth-neutral.png'
      });
      profile.portrait.asset.asset._ref = asset._id;
      portraitAction = `uploaded ${asset._id}`;
    }
  }

  // ---- Report ------------------------------------------------------------------------
  console.log('Sections after transform:');
  for (const s of sections) {
    console.log(`  • "${s.heading}" [${s.headingStyle}] #${s.anchor?.current}`);
    for (const b of s.body) {
      console.log(
        b._type === 'block'
          ? `      ${b.style.padEnd(6)} ${(b.children || []).map((c: any) => c.text).join('').slice(0, 52)}`
          : `      <${b._type}>`
      );
    }
  }
  console.log(`\nPortrait: ${portraitAction}`);
  console.log(`Already applied (pre-run): ${alreadyApplied}`);

  if (dryRun) {
    console.log('\n[dry-run] no write performed.');
    return;
  }
  await client.patch(DRAFT_ID).set({ sections }).commit();
  console.log('\n✓ Draft patched.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
