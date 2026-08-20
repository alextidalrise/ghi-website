#!/usr/bin/env node
/**
 * Wire the approved "GHI and Franke & de la Fuente" draft onto the two Franke variants:
 * the light co-brand hero plate and the ABW-style landscape team panel.
 *
 * Like the Atlas draft, this article was authored ahead of the blocks it needed, using the
 * closest existing ones as stand-ins in its "Meet our partner" section: an `insightFigure`
 * holding the landscape team photograph, followed by a `guideCallout` carrying the three
 * partnership paragraphs (titled "Our partnership with Franke & de la Fuente"). This migration
 * folds that pair into a single `insightPartnerProfile` in the TEAM layout — heading, then the
 * uncropped landscape team image, then the copy — WITHOUT touching a word, and switches the
 * co-brand hero to the light plate so the partner's dark wordmark stays legible.
 *
 * Why the light plate is required, not cosmetic: the co-brand/credential plates render the
 * partner's REVERSED mark (`logoAlt`) on brand green. Franke carries only its dark `logo`
 * (a wide wordmark) and has no `logoAlt`, so the default green plate would render blank. The
 * light plate uses the dark `logo` on white — the one surface this wordmark reads on.
 *
 *   pnpm --filter sanity exec tsx migrations/wire-franke-team-panel-migrate.ts -- --dataset development --dry-run
 *   pnpm --filter sanity exec tsx migrations/wire-franke-team-panel-migrate.ts -- --dataset development
 *
 * Targets the DRAFT only (the article has never been published), so nothing goes live until the
 * article is published from Studio. Idempotent: once the stand-ins are folded, re-running finds
 * the partner-profile already present and the plate already light, and reports no change.
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

const DRAFT_ID =
	'drafts.insight-franke-de-la-fuente-legal-tax-support-international-property-buyers';
const PARTNER_ID = 'partner-franke-de-la-fuente';
const PARTNER_SECTION_ANCHOR = 'meet-our-partner';
const FIGURE_KEY = 'fdlf-team-figure-005';
const CALLOUT_KEY = 'fdlf-partner-box-006';
const PROFILE_KEY = 'fdlf-partner-profile';

// --- helpers ----------------------------------------------------------------
type Block = Record<string, unknown> & { _type: string; _key?: string };
type Section = { heading?: string; anchor?: unknown; headingStyle?: string; body?: Block[] };

/** Fold the "Meet our partner" stand-ins (team figure + partnership callout) into a single
 *  team-layout partner profile. Idempotent: once the pair is gone, the section is left as-is. */
function transformSections(sections: Section[]): Section[] {
	return sections.map((section) => {
		const anchorCurrent =
			typeof section.anchor === 'object' && section.anchor
				? (section.anchor as { current?: string }).current
				: undefined;
		if (anchorCurrent !== PARTNER_SECTION_ANCHOR) return section;

		const body = (section.body ?? []).slice();
		if (body.some((b) => b._type === 'insightPartnerProfile')) return section;

		const figure = body.find((b) => b._type === 'insightFigure' && b._key === FIGURE_KEY);
		const callout = body.find((b) => b._type === 'guideCallout' && b._key === CALLOUT_KEY);
		if (!figure || !callout) return section;

		// The team panel: heading + uncropped landscape team photo + the partnership copy. The
		// figure's mediaAssetMetadata carries its own altText, so reuse it verbatim as teamImage.
		const profile: Block = {
			_type: 'insightPartnerProfile',
			_key: PROFILE_KEY,
			layout: 'teamLandscape',
			heading: (callout.title as string) ?? 'Our partnership with Franke & de la Fuente',
			body: callout.body,
			teamImage: figure.image,
			partner: { _type: 'reference', _ref: PARTNER_ID }
		};

		// Replace the figure in place with the profile; drop the now-folded callout.
		const next: Block[] = [];
		for (const b of body) {
			if (b._key === FIGURE_KEY) next.push(profile);
			else if (b._key === CALLOUT_KEY) continue;
			else next.push(b);
		}
		return { ...section, body: next };
	});
}

// --- run --------------------------------------------------------------------
async function main() {
	console.log(`\nWiring Franke team panel + light hero — dataset "${dataset}"${dryRun ? ' (dry run)' : ''}\n`);

	const partner = await client.fetch<{ _id: string; logo?: unknown; logoAlt?: unknown } | null>(
		`*[_id == $id][0]{ _id, logo, logoAlt }`,
		{ id: PARTNER_ID }
	);
	if (!partner) {
		console.error(`Partner ${PARTNER_ID} not found — aborting.`);
		process.exit(1);
	}
	if (!partner.logo) {
		console.error(
			`Partner ${PARTNER_ID} has no logo — the light plate needs the dark wordmark. Aborting.`
		);
		process.exit(1);
	}
	console.log(
		`• Partner logo present${partner.logoAlt ? '' : ' (no reversed logoAlt — light plate is correct)'}.`
	);

	const doc = await client.getDocument(DRAFT_ID);
	if (!doc) {
		console.error(`Draft ${DRAFT_ID} not found — aborting.`);
		process.exit(1);
	}

	const nextSections = transformSections((doc.sections as Section[]) ?? []);
	const heroFields = { heroPartnerPlate: 'light' as const };

	const before = JSON.stringify({
		heroPartnerPlate: doc.heroPartnerPlate,
		sections: doc.sections
	});
	const after = JSON.stringify({
		heroPartnerPlate: heroFields.heroPartnerPlate,
		sections: nextSections
	});

	// Per-section block-type diff for the reviewer.
	(nextSections as Section[]).forEach((s, i) => {
		const oldTypes = (((doc.sections as Section[]) ?? [])[i]?.body ?? []).map((b) => b._type);
		const newTypes = (s.body ?? []).map((b) => b._type);
		if (oldTypes.join() !== newTypes.join()) {
			console.log(`  S${i} "${s.heading}"`);
			console.log(`     ${oldTypes.join(', ')}\n  →  ${newTypes.join(', ')}`);
		}
	});
	console.log(
		`\n  hero plate: ${doc.heroPartnerPlate ?? '(unset → green default)'}  →  ${heroFields.heroPartnerPlate}`
	);

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
