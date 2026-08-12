#!/usr/bin/env node
/**
 * Wire the approved "Meet Atlas Bridge Wealth" draft onto the insight capabilities added for it.
 *
 * The article was authored ahead of the blocks it needed, using the closest existing ones as
 * stand-ins and keying each so the intent is legible: `approved-five-questions` is a takeaways
 * box meant to be a numbered list, `approved-guide-figure` a figure meant to be a reference card,
 * `approved-disclaimer` a guideCallout meant to be a disclaimer, and the property cross-link is a
 * run of plain paragraphs meant to be a link band. This migration swaps each stand-in for the
 * real block WITHOUT touching a word of the approved copy, and turns on the co-brand hero.
 *
 * The partner record already carries its own logo (a horizontal wordmark), so the co-brand and
 * credential plates use it live. As a fallback only, if the partner had NO logo this script would
 * upload a clean recreation of its bridge mark — that branch is skipped when a logo is present.
 *
 *   pnpm --filter sanity exec tsx migrations/wire-atlas-cobrand-migrate.ts -- --dataset development --dry-run
 *   pnpm --filter sanity exec tsx migrations/wire-atlas-cobrand-migrate.ts -- --dataset development
 *
 * Targets the DRAFT only (the article has never been published), so nothing goes live until the
 * article is published from Studio. Idempotent: re-running against a wired draft reports no change.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- config -----------------------------------------------------------------
const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';

function loadEnvLocal() {
	try {
		const raw = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
		for (const line of raw.split('\n')) {
			const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
			if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
		}
	} catch {
		/* env.local optional if the vars are already exported */
	}
}
loadEnvLocal();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetArg = args.find((a) => a.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset = datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

const token = process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN;
if (!token) {
	console.error('No write token found (SANITY_API_TOKEN / SANITY_AUTH_TOKEN).');
	process.exit(1);
}

const client: SanityClient = createClient({
	projectId: PROJECT_ID,
	dataset,
	apiVersion: '2024-01-01',
	token,
	useCdn: false
});

const DRAFT_ID = 'drafts.insight-meet-atlas-bridge-wealth-portugal-nhr-planning';
const PARTNER_ID = 'partner-atlas-bridge-wealth';
const THOMPSON_ASSET = 'image-2b49ec578b4d38f28559745176273b0f12643a67-4284x5712-jpg';
const ARTICLE_URL =
	'https://www.atlasbridgewealth.com/post/your-nhr-is-ending-what-british-expats-in-portugal-should-consider-before-the-10-year-window-closes';

// A clean recreation of the Atlas Bridge Wealth cable-stay bridge mark. Brand green so it reads on
// the white partner cell; the article's plates knock it out to a light silhouette on green.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 122" fill="none" stroke="#1f3d34" stroke-width="1.8" stroke-linecap="round">
  <line x1="50" y1="6" x2="50" y2="102"/>
  <line x1="50" y1="17" x2="20" y2="96"/><line x1="50" y1="32" x2="31" y2="96"/><line x1="50" y1="48" x2="41" y2="96"/>
  <line x1="50" y1="17" x2="80" y2="96"/><line x1="50" y1="32" x2="69" y2="96"/><line x1="50" y1="48" x2="59" y2="96"/>
  <line x1="9" y1="96" x2="91" y2="96"/>
  <line x1="16" y1="110" x2="84" y2="110" stroke-width="1.3" opacity="0.55"/>
</svg>`;

// --- helpers ----------------------------------------------------------------
type Block = Record<string, unknown> & { _type: string; _key?: string };
type Section = { heading?: string; anchor?: unknown; headingStyle?: string; body?: Block[] };

const media = (ref: string, altText: string) => ({
	_type: 'mediaAssetMetadata',
	altText,
	asset: { _type: 'image', asset: { _type: 'reference', _ref: ref } }
});

const blockText = (b: Block) =>
	((b.children as Array<{ text?: string }> | undefined) ?? []).map((c) => c.text ?? '').join('');

/** Rebuild the article's sections deterministically. Idempotent: keyed on the stand-in blocks, so
 *  once a stand-in is gone the transform leaves the real block untouched. */
function transformSections(sections: Section[]): Section[] {
	return sections.map((section) => {
		const body = (section.body ?? []).slice();
		let headingStyle = section.headingStyle;
		let heading = section.heading;
		const anchorCurrent =
			typeof section.anchor === 'object' && section.anchor
				? (section.anchor as { current?: string }).current
				: undefined;

		// S0 — "Meet our partner": demote the heading to an eyebrow and fold the three partnership
		// paragraphs into a partner-profile panel (portrait + credential plate).
		if (anchorCurrent === 'our-partnership-with-atlas-bridge-wealth') {
			heading = 'Meet our partner';
			headingStyle = 'eyebrow';
			const paraKeys = ['approved-b-003', 'approved-b-004', 'approved-b-005'];
			const paras = paraKeys
				.map((k) => body.find((b) => b._key === k))
				.filter(Boolean)
				.map((b) => blockText(b as Block));
			const kept = body.filter((b) => !paraKeys.includes(b._key ?? ''));
			if (!kept.some((b) => b._type === 'insightPartnerProfile') && paras.length) {
				const profile: Block = {
					_type: 'insightPartnerProfile',
					_key: 'approved-partner-profile',
					heading: 'Our partnership with Atlas Bridge Wealth',
					body: paras.join('\n\n'),
					portrait: media(
						THOMPSON_ASSET,
						'Steve Thompson, Founder and Principal Adviser at Atlas Bridge Wealth'
					),
					personName: 'Steve Thompson',
					personRole: 'Founder and Principal Adviser, Atlas Bridge Wealth',
					partner: { _type: 'reference', _ref: PARTNER_ID }
				};
				// Insert after the intro (approved-b-002), else append.
				const at = kept.findIndex((b) => b._key === 'approved-b-002');
				if (at >= 0) kept.splice(at + 1, 0, profile);
				else kept.push(profile);
			}
			return { ...section, heading, headingStyle, body: kept };
		}

		// S1 — review section: eyebrow heading + filled pull quote.
		if (anchorCurrent === 'this-weeks-partner-insight') {
			headingStyle = 'eyebrow';
			const next = body.map((b) =>
				b._type === 'insightPullQuote' ? { ...b, variant: 'filled' } : b
			);
			return { ...section, headingStyle, body: next };
		}

		// S2 — ISA / property section: eyebrow heading only.
		if (anchorCurrent === 'uk-isa-not-automatically-tax-free-in-portugal') {
			return { ...section, headingStyle: 'eyebrow' };
		}

		// S3 — "The longer view": eyebrow heading + takeaways → numbered list.
		if (anchorCurrent === 'the-longer-view') {
			headingStyle = 'eyebrow';
			const next = body.map((b) => {
				if (b._type !== 'insightTakeaways') return b;
				const items = ((b.items as Array<{ _key?: string; label?: string; text?: string }>) ?? []).map(
					(it) => ({
						_type: 'insightNumberedItem',
						_key: it._key ?? undefined,
						heading: it.label ?? '',
						body: it.text ?? ''
					})
				);
				return {
					_type: 'insightNumberedList',
					_key: b._key,
					heading: (b.heading as string) ?? 'Five questions to ask now',
					items
				} as Block;
			});
			return { ...section, headingStyle, body: next };
		}

		// S4 — FAQ: eyebrow heading, open FAQ, figure → reference card.
		if (anchorCurrent === 'frequently-asked-questions') {
			headingStyle = 'eyebrow';
			const next = body.map((b) => {
				if (b._type === 'insightFaq') return { ...b, display: 'open' };
				if (b._type === 'insightFigure' && b._key === 'approved-guide-figure') {
					return {
						_type: 'insightReferenceCard',
						_key: b._key,
						eyebrow: 'Further reading',
						heading: 'Read the original Atlas Bridge Wealth article',
						description:
							'Your NHR Is Ending: What British Expats in Portugal Should Consider Before the 10-Year Window Closes.',
						image: b.image,
						linkLabel: 'Read on Atlas Bridge Wealth',
						linkHref: ARTICLE_URL
					} as Block;
				}
				return b;
			});
			return { ...section, headingStyle, body: next };
		}

		// S5 — closing: property paragraphs → link band, guideCallout → disclaimer. Heading stays serif.
		if (anchorCurrent === 'speak-with-atlas-bridge-wealth') {
			const bandKeys = [
				'approved-b-024',
				'approved-b-025',
				'approved-b-026',
				'approved-frontline-link'
			];
			let next = body.map((b) =>
				b._type === 'guideCallout' && b._key === 'approved-disclaimer'
					? ({
							_type: 'insightDisclaimer',
							_key: b._key,
							heading: 'Important information',
							body: b.body
						} as Block)
					: b
			);
			if (!next.some((b) => b._type === 'insightCtaCallout' && (b as Block).variant === 'linkBand')) {
				const band: Block = {
					_type: 'insightCtaCallout',
					_key: 'approved-property-linkband',
					variant: 'linkBand',
					eyebrow: 'Explore GHI property',
					heading: "Homes on the fairway's edge",
					body: 'Explore the Front Line Collection of homes directly on the fairway in Spain and Portugal.',
					buttonLabel: 'See our Front Line Collection',
					buttonHref: '/front-line-collection'
				};
				const at = next.findIndex((b) => b._key === 'approved-b-024');
				next = next.filter((b) => !bandKeys.includes(b._key ?? ''));
				if (at >= 0) next.splice(at, 0, band);
				else next.push(band);
			} else {
				next = next.filter((b) => !bandKeys.includes(b._key ?? ''));
			}
			return { ...section, body: next };
		}

		return section;
	});
}

// --- run --------------------------------------------------------------------
async function main() {
	console.log(`\nWiring Atlas co-brand — dataset "${dataset}"${dryRun ? ' (dry run)' : ''}\n`);

	// 1) Partner logo -----------------------------------------------------------
	const partner = await client.fetch<{ _id: string; logo?: unknown } | null>(
		`*[_id == $id][0]{ _id, logo }`,
		{ id: PARTNER_ID }
	);
	if (!partner) {
		console.error(`Partner ${PARTNER_ID} not found — aborting.`);
		process.exit(1);
	}
	if (partner.logo) {
		console.log('• Partner already has a logo — leaving it untouched.');
	} else if (dryRun) {
		console.log('• Would upload the recreated bridge-mark SVG and set it as the partner logo.');
	} else {
		const asset = await client.assets.upload('image', Buffer.from(LOGO_SVG), {
			filename: 'atlas-bridge-wealth-logo.svg',
			contentType: 'image/svg+xml'
		});
		await client
			.patch(PARTNER_ID)
			.set({ logo: media(asset._id, 'Atlas Bridge Wealth') })
			.commit();
		console.log(`• Uploaded logo asset ${asset._id} and set it on the partner.`);
	}

	// 2) The draft article ------------------------------------------------------
	const doc = await client.getDocument(DRAFT_ID);
	if (!doc) {
		console.error(`Draft ${DRAFT_ID} not found — aborting.`);
		process.exit(1);
	}

	const nextSections = transformSections((doc.sections as Section[]) ?? []);
	const heroFields = {
		heroLayout: 'coBrand',
		heroPartner: { _type: 'reference', _ref: PARTNER_ID },
		heroPartnerLabel: 'GHI Partner',
		heroSublabel: 'GHI Partner Insight'
	};

	const before = JSON.stringify({
		heroLayout: doc.heroLayout,
		heroPartner: doc.heroPartner,
		heroPartnerLabel: doc.heroPartnerLabel,
		heroSublabel: doc.heroSublabel,
		sections: doc.sections
	});
	const after = JSON.stringify({
		heroLayout: heroFields.heroLayout,
		heroPartner: heroFields.heroPartner,
		heroPartnerLabel: heroFields.heroPartnerLabel,
		heroSublabel: heroFields.heroSublabel,
		sections: nextSections
	});

	// Per-section block-type diff for the reviewer.
	(nextSections as Section[]).forEach((s, i) => {
		const oldTypes = (((doc.sections as Section[]) ?? [])[i]?.body ?? []).map((b) => b._type);
		const newTypes = (s.body ?? []).map((b) => b._type);
		const style = s.headingStyle ? ` [${s.headingStyle}]` : '';
		console.log(`\n  S${i} "${s.heading}"${style}`);
		if (oldTypes.join() !== newTypes.join())
			console.log(`     ${oldTypes.join(', ')}\n  →  ${newTypes.join(', ')}`);
		else console.log(`     ${newTypes.join(', ')} (block types unchanged)`);
	});

	if (before === after) {
		console.log('\n✓ Draft already wired — no change.\n');
		return;
	}

	if (dryRun) {
		console.log('\n(dry run) — no write performed.\n');
		return;
	}

	await client.patch(DRAFT_ID).set({ ...heroFields, sections: nextSections }).commit();
	console.log('\n✓ Draft wired. Review it in Studio, then publish when ready.\n');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
