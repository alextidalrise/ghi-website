#!/usr/bin/env node
/**
 * Turn the Nobu / Monte Rei article's "Assess now / Wait for Nobu" comparison into two
 * explicit buyer routes, each with one next step and a stated outcome.
 *
 * The old block was an `insightCardGrid`: two headings and two bodies, no action. That
 * left the reader who had just decided with nothing to do at the point of deciding —
 * the page's only enquiry sat ~1,200 words further down, inside a property section, and
 * served just one of the two routes. The second route was worse than unserved: it read
 * "Wait for the Nobu release", and waiting is the absence of a next step.
 *
 * Five edits:
 *
 *   1. `insightCardGrid` → `insightRoutes` in "Buy now or wait…".
 *   2. The aid moves up to sit directly after "The answer depends on what the buyer values
 *      most." It had inherited the card grid's slot three paragraphs lower, which put the
 *      section's answer behind its reasoning. Now the hinge sentence poses the choice, the
 *      aid presents it, and the two paragraphs that follow expand one route each in the
 *      same order. No prose is added, removed or reworded.
 *   3. The inline CTA is aligned to route one — same label ("Request a shortlist") and now
 *      the same destination (`/contact?enquiry=monte-rei-shortlist`). It previously kept a
 *      blank-form `/contact?utm_…` href, so the reprise opened a blank form asking the reader
 *      to retype what they had just clicked. One label + one destination makes it a true
 *      reprise of the route rather than a competing third ask. See CTA_BUTTON_HREF for why
 *      the UTM params are dropped rather than carried.
 *   4. The hero note stops ending route two on "wait" and names the register action, so
 *      the thesis note and the decision aid use the same words for the same path.
 *   5. "The GHI view" does the same at the closing position.
 *
 * Both route actions point at `/contact?enquiry=<key>` (see `$lib/contact/enquiryTopics`),
 * so the form opens on what the reader clicked rather than blank — the same courtesy
 * `?partner=` already extends to an introduction request.
 *
 * Every claim in the new copy is traceable to text already in the document or to a
 * promise the contact page already publishes ("We reply within one working day, usually
 * sooner" / "Your details stay with us and never go to a sales list"). No property,
 * pricing, availability or development claim is added.
 *
 * Idempotent: re-running against an already-migrated document reports no change.
 *
 * Usage:
 *   pnpm --filter sanity migrate:nobu-routes -- --dataset development
 *   pnpm --filter sanity migrate:nobu-routes -- --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local'));

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const SLUG = 'nobu-monte-rei-property-buyers';

/** The section holding the buy-now-or-wait decision, and the card grid being replaced. */
const DECISION_SECTION_KEY = 'sec0047';
const CARD_GRID_KEY = 'grid0014';

/**
 * "The answer depends on what the buyer values most." — the sentence the decision aid
 * answers, so the aid is pinned directly after it. Stated as an anchor rather than an index
 * so an editor adding a paragraph elsewhere in the section does not move the block.
 */
const DECISION_ANCHOR_KEY = 'b0040';

/** The section holding the inline enquiry CTA. */
const CTA_SECTION_KEY = 'sec0072';

/**
 * "The GHI view" — the last thing a route-two reader is told before the enquiry band. It
 * ended on "should wait", which leaves that reader with no action at the closing position
 * while the decision aid above offers one. Same two-verb formulation as the hero note, so
 * the piece opens and closes on the same words.
 */
const GHI_VIEW_SPAN_KEY = 'sp0096';
const GHI_VIEW_TEXT_FROM =
	'Buyers specifically seeking Nobu branding should wait for formal residential sales and ownership documentation.';
const GHI_VIEW_TEXT_TO =
	'Buyers specifically seeking Nobu branding should register for updates and wait for formal residential sales and ownership documentation.';

const ROUTES_BLOCK = {
	_key: 'routes0014',
	_type: 'insightRoutes',
	heading: 'Two routes from here',
	routes: [
		{
			_key: 'rt0015',
			_type: 'insightRoute',
			heading: 'Assess current Monte Rei opportunities',
			body: 'The apartments, linked villas and plots already at Monte Rei can be viewed and checked against current documentation. Assessing them does not depend on the Nobu announcement.',
			actionLabel: 'Request a shortlist',
			actionHref: '/contact?enquiry=monte-rei-shortlist',
			outcome:
				'Send your budget, intended use and timescale. GHI replies within one working day with what is currently available, and can arrange viewings.'
		},
		{
			_key: 'rt0016',
			_type: 'insightRoute',
			heading: 'Register for verified Nobu updates',
			body: 'Nothing has been released on price, ownership, service charges or delivery. Buyers who specifically want the Nobu brand are waiting on formal documentation, not on an opinion.',
			actionLabel: 'Register your interest',
			actionHref: '/contact?enquiry=nobu-monte-rei-updates',
			outcome:
				'Tell us you are following the Nobu residences. GHI passes on the residential terms once they are formally released, and nothing before that. Your details never go to a sales list.'
		}
	]
};

const CTA_BUTTON_LABEL = 'Request a shortlist';

/**
 * The inline CTA now opens the same pre-framed enquiry route one does, rather than a blank
 * `/contact`: two buttons that share the label "Request a shortlist" must share a destination
 * and behaviour, or the reprise sends the reader to a blank form to retype what they clicked.
 *
 * No UTM params. Internal links here carry no campaign tags at all — there is no scheme to
 * fold back in — and the site's render-time guard strips campaign params from same-origin
 * hrefs before they reach the page anyway, so a tagged href would render byte-identical to
 * this one while leaving the dataset asserting a behaviour the link does not have. Stored clean.
 */
const CTA_BUTTON_HREF = '/contact?enquiry=monte-rei-shortlist';

const HERO_NOTE_BODY =
	'Existing Monte Rei homes can be assessed now. Buyers specifically seeking Nobu branding should register for verified updates and wait for formal sales, ownership, service and delivery information.';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetArg = args.find((arg) => arg.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

type BodyBlock = { _key?: string; _type?: string; [key: string]: unknown };
type Section = { _key?: string; body?: BodyBlock[]; [key: string]: unknown };
type Insight = {
	_id: string;
	sections?: Section[];
	heroNote?: { _type?: string; heading?: string; body?: string } | null;
};

/**
 * Serialize with object keys sorted, at every depth. Sanity returns a document's fields in
 * its own order, not the order this file declares them, so a plain `JSON.stringify`
 * comparison reports a difference on every run and the migration never settles.
 */
function canonical(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
	if (value && typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
			.map(([key, nested]) => `${JSON.stringify(key)}:${canonical(nested)}`);
		return `{${entries.join(',')}}`;
	}
	return JSON.stringify(value) ?? 'null';
}

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config', 'sanity', 'config.json');
	if (!existsSync(configPath)) return undefined;
	try {
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string };
		return config.authToken;
	} catch {
		return undefined;
	}
}

function loadEnvFile(path: string): void {
	if (!existsSync(path)) return;
	for (const line of readFileSync(path, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const separator = trimmed.indexOf('=');
		if (separator <= 0) continue;
		const key = trimmed.slice(0, separator).trim();
		const value = trimmed.slice(separator + 1).trim();
		if (key && process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
}

function createClientOrThrow(): SanityClient {
	if (!TOKEN && !dryRun) {
		throw new Error('Missing write credentials. Set SANITY_API_TOKEN or log in via sanity CLI.');
	}

	return createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-01-01',
		token: TOKEN,
		useCdn: false,
		perspective: 'raw'
	});
}

/**
 * Rewrite one document's sections + hero note. Returns null when nothing needs changing,
 * so a re-run is a reported no-op rather than a redundant write.
 */
function migrate(doc: Insight): Partial<Insight> | null {
	const changes: string[] = [];
	const sections = (doc.sections ?? []).map((section) => {
		if (!section.body) return section;

		if (section._key === DECISION_SECTION_KEY) {
			const body = [...section.body];
			const before = changes.length;

			// Content. First run swaps the card grid out. Later runs reconcile the routes block
			// against ROUTES_BLOCK, so this file stays the source of truth for that copy and a
			// wording or link change is a re-run rather than a hand-edit in the Studio.
			const gridIndex = body.findIndex((block) => block._key === CARD_GRID_KEY);
			if (gridIndex >= 0) {
				body[gridIndex] = ROUTES_BLOCK;
				changes.push(`${DECISION_SECTION_KEY}: insightCardGrid → insightRoutes`);
			} else {
				const routesIndex = body.findIndex((block) => block._key === ROUTES_BLOCK._key);
				if (routesIndex >= 0 && canonical(body[routesIndex]) !== canonical(ROUTES_BLOCK)) {
					body[routesIndex] = ROUTES_BLOCK;
					changes.push(`${DECISION_SECTION_KEY}: insightRoutes content reconciled`);
				}
			}

			// Position. Both indexes are read from the array as it stands after the content step,
			// and the move is a no-op once the block already follows the anchor — so this settles
			// on a re-run rather than shuffling the block each time.
			const anchorIndex = body.findIndex((block) => block._key === DECISION_ANCHOR_KEY);
			const currentIndex = body.findIndex((block) => block._key === ROUTES_BLOCK._key);
			if (anchorIndex >= 0 && currentIndex >= 0 && currentIndex !== anchorIndex + 1) {
				const [block] = body.splice(currentIndex, 1);
				// Re-find: removing the block shifts the anchor left when it sat after it.
				body.splice(body.findIndex((b) => b._key === DECISION_ANCHOR_KEY) + 1, 0, block);
				changes.push(
					`${DECISION_SECTION_KEY}: insightRoutes moved directly after ${DECISION_ANCHOR_KEY}`
				);
			}

			if (changes.length === before) return section;
			return { ...section, body };
		}

		if (section._key === CTA_SECTION_KEY) {
			let touched = false;
			const body = section.body.map((block) => {
				if (block._type !== 'insightCtaCallout') return block;
				if (block.buttonLabel === CTA_BUTTON_LABEL && block.buttonHref === CTA_BUTTON_HREF) return block;
				touched = true;
				return { ...block, buttonLabel: CTA_BUTTON_LABEL, buttonHref: CTA_BUTTON_HREF };
			});
			if (!touched) return section;
			changes.push(`${CTA_SECTION_KEY}: inline CTA aligned to the shortlist enquiry (label + href)`);
			return { ...section, body };
		}

		// The GHI view's closing sentence. The span carries two sentences, so this rewrites the
		// first by substring and leaves the rest of the span — and the block's keys and marks —
		// exactly as authored.
		let sectionTouched = false;
		const body = section.body.map((block) => {
			const children = (block.children ?? null) as { _key?: string; text?: string }[] | null;
			if (!Array.isArray(children)) return block;

			let blockTouched = false;
			const next = children.map((child) => {
				if (child._key !== GHI_VIEW_SPAN_KEY) return child;
				if (typeof child.text !== 'string' || !child.text.includes(GHI_VIEW_TEXT_FROM)) return child;
				blockTouched = true;
				return { ...child, text: child.text.replace(GHI_VIEW_TEXT_FROM, GHI_VIEW_TEXT_TO) };
			});

			if (!blockTouched) return block;
			sectionTouched = true;
			return { ...block, children: next };
		});

		if (sectionTouched) {
			changes.push('sec0100: GHI view names the register action');
			return { ...section, body };
		}

		return section;
	});

	const patch: Partial<Insight> = {};

	if (changes.length > 0) patch.sections = sections;

	if (doc.heroNote && doc.heroNote.body !== HERO_NOTE_BODY) {
		patch.heroNote = { ...doc.heroNote, body: HERO_NOTE_BODY };
		changes.push('heroNote: route two names the register action');
	}

	if (changes.length === 0) return null;
	for (const change of changes) console.log(`    ${change}`);
	return patch;
}

async function main() {
	console.log(`Nobu / Monte Rei buyer routes → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);

	const client = createClientOrThrow();

	// Both the published document and its draft twin, whichever exist: the article is a
	// draft today, and a published copy must not be left with the old comparison.
	const docs = await client.fetch<Insight[]>(
		`*[_type == "insight" && slug.current == $slug]{ _id, sections, heroNote }`,
		{ slug: SLUG }
	);

	if (docs.length === 0) {
		throw new Error(`No insight with slug "${SLUG}" in ${dataset}.`);
	}

	let written = 0;
	for (const doc of docs) {
		console.log(`  ${doc._id}`);
		const patch = migrate(doc);
		if (!patch) {
			console.log('    already migrated — no change');
			continue;
		}
		if (!dryRun) {
			await client.patch(doc._id).set(patch).commit();
		}
		written += 1;
	}

	console.log(`Done. ${written} document${written === 1 ? '' : 's'} ${dryRun ? 'would be ' : ''}patched.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
