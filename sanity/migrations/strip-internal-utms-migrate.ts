#!/usr/bin/env node
/**
 * Remove campaign parameters from links that point at our own site.
 *
 * An internal `utm_*` measures nothing and costs something. `safePageLocation` rebuilds
 * `page_location` from a strict allowlist that excludes them, so they never reach our own
 * page-view data; meanwhile GA4 reads campaign parameters off the URLs it does see and
 * treats them as a fresh acquisition, overwriting the source the visitor actually arrived
 * from. The web app now strips them at render time (`web/src/lib/sanity/href.ts`), which
 * is the durable guard. This script cleans what is already stored, so the dataset stops
 * asserting an attribution scheme that does not exist.
 *
 * Two kinds of change, applied in this order:
 *
 *   1. Explicit replacements — a handful of hrefs where the right answer is not "the same
 *      link, minus the tags" but a different, working parameter. Listed in full below so
 *      the intent is reviewable rather than inferred.
 *   2. Generic strip — every other internal href loses its campaign parameters and keeps
 *      everything else byte-identical.
 *
 * External links are never touched. A partner's `utm_source=ghi` on their own domain is
 * their attribution, and rewriting it would break a relationship we do not own.
 *
 * Idempotent: a second run finds nothing, because a cleaned href no longer matches.
 *
 * Usage:
 *   pnpm --filter sanity migrate:strip-internal-utms:dry-run
 *   pnpm --filter sanity migrate:strip-internal-utms
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetIndex >= 0 ? args[datasetIndex + 1] : (process.env.SANITY_STUDIO_DATASET ?? 'development');

/**
 * Hosts that are ours. Kept in step with `PRODUCTION_HOSTS` in
 * `web/src/lib/analytics/config.ts` — this package cannot import from the web app, so the
 * list is duplicated deliberately rather than by accident.
 */
const OWN_HOSTS = ['golfhomesinternational.com', 'www.golfhomesinternational.com'];

/** Mirrors `CAMPAIGN_PARAM` in `web/src/lib/sanity/href.ts`. */
const CAMPAIGN_PARAM =
	/^(utm_[a-z_]+|gclid|dclid|fbclid|msclkid|twclid|ttclid|gbraid|wbraid|gad_source|gad_campaignid|gclsrc|mc_cid|mc_eid|_gl)$/i;

const SCHEME = /^([a-z][a-z0-9+.-]*):/i;
const AUTHORITY = /^(?:[a-z][a-z0-9+.-]*:)?\/\/([^/?#]*)/i;

/**
 * Hrefs whose replacement is a judgement, not a strip.
 *
 * The Atlas Bridge partner insight tagged its contact CTA with `utm_medium=partner-insight`
 * to record which partner sent the enquiry. `?partner=` already does that properly: the
 * contact page pre-frames the form from it and carries the slug onto the submission, so the
 * attribution lands on the lead rather than being thrown at GA4 and lost. The
 * front-line-collection link has no equivalent — a browse page has no enquiry to attribute
 * — so it is left to the generic strip.
 */
const EXPLICIT: Record<string, string> = {
	'/contact?utm_source=ghi-journal&utm_medium=partner-insight&utm_campaign=atlas-bridge-nhr':
		'/contact?partner=atlas-bridge-wealth'
};

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config', 'sanity', 'config.json');
	if (!existsSync(configPath)) return undefined;
	try {
		return (JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string }).authToken;
	} catch {
		return undefined;
	}
}

function createMigrationClient(): SanityClient {
	const token =
		process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();
	if (!token) {
		throw new Error('Missing Sanity token. Set SANITY_API_TOKEN or log in via sanity CLI.');
	}

	return createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-01-01',
		token,
		useCdn: false,
		// Drafts included: an unpublished article is exactly where a tagged link waits to
		// become a published one. The default 'published' perspective would hide them.
		perspective: 'raw'
	});
}

function isInternalHref(href: string): boolean {
	const trimmed = href.trim();
	const scheme = SCHEME.exec(trimmed)?.[1]?.toLowerCase();
	if (scheme && scheme !== 'http' && scheme !== 'https') return false;
	if (!scheme && !trimmed.startsWith('//')) return true;
	const authority = AUTHORITY.exec(trimmed)?.[1] ?? '';
	const hostname = authority.split('@').pop()?.split(':')[0]?.toLowerCase() ?? '';
	return OWN_HOSTS.includes(hostname);
}

function withoutCampaignParams(href: string): string {
	if (!isInternalHref(href)) return href;

	const hashAt = href.indexOf('#');
	const head = hashAt === -1 ? href : href.slice(0, hashAt);
	const hash = hashAt === -1 ? '' : href.slice(hashAt);

	const queryAt = head.indexOf('?');
	if (queryAt === -1) return href;

	const params = new URLSearchParams(head.slice(queryAt + 1));
	let removed = false;
	for (const key of [...params.keys()]) {
		if (CAMPAIGN_PARAM.test(key)) {
			params.delete(key);
			removed = true;
		}
	}
	if (!removed) return href;

	const query = params.toString();
	return `${head.slice(0, queryAt)}${query ? `?${query}` : ''}${hash}`;
}

/** The replacement for an href, or null when it is already correct. */
function cleaned(href: string): string | null {
	const explicit = EXPLICIT[href];
	if (explicit) return explicit;
	const stripped = withoutCampaignParams(href);
	return stripped === href ? null : stripped;
}

type Change = { id: string; type: string; rev: string; path: string; from: string; to: string };

/**
 * Walk a document for string values that are hrefs needing a change.
 *
 * Paths are built in Sanity patch syntax (`sections[7].body[1].buttonHref`) as we descend,
 * so a hit can be patched in place without replacing the whole document — which would risk
 * clobbering a concurrent edit in the studio.
 */
function findChanges(doc: Record<string, unknown>): Change[] {
	const changes: Change[] = [];

	function walk(node: unknown, path: string) {
		if (typeof node === 'string') {
			const next = cleaned(node);
			if (next !== null) {
				changes.push({
					id: String(doc._id),
					type: String(doc._type),
					rev: String(doc._rev),
					path,
					from: node,
					to: next
				});
			}
			return;
		}
		if (Array.isArray(node)) {
			node.forEach((child, i) => walk(child, `${path}[${i}]`));
			return;
		}
		if (node && typeof node === 'object') {
			for (const [key, child] of Object.entries(node)) {
				if (key.startsWith('_')) continue;
				walk(child, path ? `${path}.${key}` : key);
			}
		}
	}

	walk(doc, '');
	return changes;
}

async function main() {
	const client = createMigrationClient();
	console.log(`dataset: ${dataset}${dryRun ? '  (dry run)' : ''}\n`);

	const docs: Record<string, unknown>[] = await client.fetch(`*[!(_type match "sanity.*")]`);
	const changes = docs.flatMap(findChanges);

	if (changes.length === 0) {
		console.log(`Nothing to change across ${docs.length} documents.`);
		return;
	}

	for (const change of changes) {
		console.log(`${change.type}  ${change.id}\n  ${change.path}\n  - ${change.from}\n  + ${change.to}\n`);
	}

	if (dryRun) {
		console.log(`${changes.length} change(s) would be applied. Re-run without --dry-run.`);
		return;
	}

	// One transaction per document, guarded by the revision read above: if anyone edited the
	// document in between, the patch fails rather than writing against shifted array indices.
	const byDoc = new Map<string, Change[]>();
	for (const change of changes) {
		byDoc.set(change.id, [...(byDoc.get(change.id) ?? []), change]);
	}

	for (const [id, docChanges] of byDoc) {
		const set = Object.fromEntries(docChanges.map((c) => [c.path, c.to]));
		await client.patch(id).ifRevisionId(docChanges[0].rev).set(set).commit();
		console.log(`patched ${id} (${docChanges.length} href(s))`);
	}

	console.log(`\nDone. ${changes.length} href(s) cleaned.`);
}

void main().catch((error) => {
	console.error(error);
	process.exit(1);
});
