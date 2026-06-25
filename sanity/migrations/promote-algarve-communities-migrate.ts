#!/usr/bin/env node
/**
 * Promote the Portugal communities that sit under the Algarve location into
 * first-class Locations under Portugal, then retire Algarve.
 *
 * For each community C under Algarve:
 *   1. Create a new Location `places-location-<slug>` under Portugal (same name/slug),
 *      copying up C's map coordinates so the location's area map can render.
 *   2. Re-parent C under that new location and flag it `isCatchAll: true` — the
 *      community survives (every listing keeps its required `community` ref) but its
 *      URL segment collapses to the location level.
 *   3. Re-sync every listing referencing C so its derived location/country refs point
 *      at the new location / Portugal.
 * The generic Algarve catch-all bucket is drained by re-homing its listings into new
 * Locations (see REHOME_TARGETS) that are each created with their own catch-all
 * community, then the empty bucket is deleted. Finally Algarve is stripped from
 * featured/linked/associated arrays and deleted — but only once nothing references it
 * (if any catch-all listing was left unmapped, Algarve is retained and reported).
 *
 * Usage:
 *   pnpm --filter sanity migrate:promote-algarve-communities -- --dataset development
 *   pnpm --filter sanity migrate:promote-algarve-communities:dry-run -- --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { stablePlacesId } from './lib/placesIds';

loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local'));

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetArg = args.find((arg) => arg.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

const LISTING_TYPES = ['propertyListing', 'development'] as const;

const ALGARVE_CATCH_ALL_COMMUNITY_ID = 'places-community-catch-all-algarve';

/**
 * Catch-all listings to re-home into brand-new Locations. Each destination Location is
 * created with a single catch-all community to hold the listings (a listing must
 * reference a community). Hero/overview/coordinates are authored later in Studio.
 *
 * NOTE: these listing IDs are dataset-specific (captured from `development`). Before
 * running against another dataset, re-map them — query the Algarve catch-all bucket
 * (`location.community._ref == ALGARVE_CATCH_ALL_COMMUNITY_ID`) and assign each listing
 * to a destination. Unknown IDs are reported as "no revision found" and leave the
 * catch-all non-empty, which blocks Algarve deletion (safe, but a no-op for those rows).
 */
const REHOME_TARGETS: Array<{ slug: string; name: string; listingIds: string[] }> = [
	{
		slug: 'quinta-do-lago',
		name: 'Quinta do Lago',
		listingIds: [
			'ghi00132-azuya-algarve-review-only',
			'ghi00133-sutaya-quinta-do-lago-review-only'
		]
	},
	{
		slug: 'vilamoura',
		name: 'Vilamoura',
		listingIds: ['ghi00134-zestia-vilamoura-review-only']
	}
];

type Reference = { _type: 'reference'; _ref: string; _key?: string };

type CommunityDoc = {
	_id: string;
	name: string;
	slug: string;
	isCatchAll?: boolean;
	coordinates?: { _type: 'geopoint'; lat?: number; lng?: number; alt?: number };
};

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
		useCdn: false
	});
}

/** Strip the `drafts.` prefix so we always store/reference the published id. */
function publishedId(id: string): string {
	return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id;
}

/** Which of a doc's revisions actually exist — published id plus its `drafts.` twin. */
async function existingTargets(client: SanityClient, baseId: string): Promise<string[]> {
	const pub = publishedId(baseId);
	const ids = [pub, `drafts.${pub}`];
	return client.fetch<string[]>(`*[_id in $ids]._id`, { ids });
}

/** Apply the same patch to every existing revision of a document. */
async function patchAllTargets(
	client: SanityClient,
	baseId: string,
	patch: Record<string, unknown>
): Promise<number> {
	const targets = await existingTargets(client, baseId);
	if (targets.length === 0) {
		console.warn(`  no existing revision to patch for ${publishedId(baseId)}`);
		return 0;
	}
	for (const id of targets) {
		console.log(`  patch ${id}`);
		if (!dryRun) await client.patch(id).set(patch).commit();
	}
	return targets.length;
}

/** Delete every existing revision of a document (published + draft twin). */
async function deleteAllTargets(client: SanityClient, baseId: string): Promise<number> {
	const targets = await existingTargets(client, baseId);
	for (const id of targets) {
		console.log(`  delete ${id}`);
		if (!dryRun) await client.delete(id);
	}
	return targets.length;
}

function reference(refId: string): Reference {
	return { _type: 'reference', _ref: refId };
}

async function main() {
	console.log(
		`Promote Algarve communities → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const client = createClientOrThrow();
	const flags: string[] = [];

	// 1. Resolve Portugal + Algarve.
	const portugalRaw = await client.fetch<string | null>(
		`*[_type == "locationTaxonomy" && type == "country" && slug.current == "portugal"][0]._id`
	);
	const algarveRaw = await client.fetch<string | null>(
		`*[
			_type == "locationTaxonomy"
			&& type == "location"
			&& slug.current == "algarve"
			&& parent->slug.current == "portugal"
		][0]._id`
	);

	if (!portugalRaw) {
		console.error('Aborting — Portugal country taxonomy doc not found.');
		process.exitCode = 1;
		return;
	}
	if (!algarveRaw) {
		console.error('Aborting — Algarve location taxonomy doc not found under Portugal.');
		process.exitCode = 1;
		return;
	}
	const portugalId = publishedId(portugalRaw);
	const algarveId = publishedId(algarveRaw);
	console.log(`Portugal: ${portugalId}\nAlgarve:  ${algarveId}\n`);

	// 2. Communities under Algarve (dedupe draft/published twins by published id).
	const communityRows = await client.fetch<CommunityDoc[]>(
		`*[
			_type == "locationTaxonomy"
			&& type == "community"
			&& parent->slug.current == "algarve"
			&& parent->parent->slug.current == "portugal"
		]{ _id, name, "slug": slug.current, isCatchAll, coordinates }`
	);

	const communities = new Map<string, CommunityDoc>();
	for (const row of communityRows) {
		const id = publishedId(row._id);
		const existing = communities.get(id);
		// Prefer a revision that actually carries coordinates / a name.
		if (!existing || (!existing.coordinates && row.coordinates)) {
			communities.set(id, { ...row, _id: id });
		}
	}
	console.log(`Found ${communities.size} community(ies) under Algarve.\n`);

	// Sibling Portugal location slugs — guards against a community slug colliding with
	// an existing location (e.g. comporta / cascais).
	const siblingLocationSlugs = new Set(
		await client.fetch<string[]>(
			`*[_type == "locationTaxonomy" && type == "location" && parent->slug.current == "portugal"]
				.slug.current`
		)
	);

	// 3. Partition: real communities to promote vs catch-all bucket(s) to drain + delete.
	const targets: CommunityDoc[] = [];
	const catchAllCommunities: CommunityDoc[] = [];
	for (const community of communities.values()) {
		if (community.isCatchAll) {
			catchAllCommunities.push(community);
			continue;
		}
		if (!community.slug) {
			flags.push(`community ${community._id} has no slug — skipped.`);
			continue;
		}
		const newLocationId = stablePlacesId('location', community.slug);
		const collidesWithSibling =
			siblingLocationSlugs.has(community.slug) && community.slug !== 'algarve';
		const locationExists = await client.fetch<string | null>(`*[_id == $id][0]._id`, {
			id: newLocationId
		});
		if (collidesWithSibling || locationExists) {
			flags.push(
				`slug "${community.slug}" collides with an existing Portugal location ` +
					`(${newLocationId}) — community ${community._id} skipped.`
			);
			continue;
		}
		targets.push(community);
	}

	console.log(`Migration targets: ${targets.length}`);
	for (const t of targets) console.log(`  • ${t.name} (${t.slug})`);
	console.log('');

	// 4. Per-target: create location, re-parent + flag community, re-sync listings.
	// Track every listing we touch so the Algarve-deletion check can be evaluated
	// predictively (dry-run included), not just against the un-mutated dataset.
	const touchedListingIds = new Set<string>();
	let listingsResynced = 0;
	for (const community of targets) {
		const newLocationId = stablePlacesId('location', community.slug);
		console.log(`→ ${community.name}: create ${newLocationId}`);
		const locationDoc = {
			_id: newLocationId,
			_type: 'locationTaxonomy' as const,
			name: community.name,
			slug: { _type: 'slug' as const, current: community.slug },
			type: 'location' as const,
			parent: reference(portugalId),
			...(community.coordinates ? { coordinates: community.coordinates } : {})
		};
		if (!dryRun) await client.createIfNotExists(locationDoc);

		console.log(`  re-parent community ${community._id} → ${newLocationId}, isCatchAll: true`);
		await patchAllTargets(client, community._id, {
			parent: reference(newLocationId),
			isCatchAll: true
		});

		// Re-sync listings: location stays the same community; derived chain is now
		// the new location / Portugal.
		const listings = await client.fetch<string[]>(
			`*[_type in $types && location.community._ref == $cid]._id`,
			{ types: LISTING_TYPES, cid: community._id }
		);
		for (const listingId of listings) {
			console.log(`  resync listing ${listingId}`);
			if (!dryRun) {
				await client
					.patch(listingId)
					.set({
						'location.location': reference(newLocationId),
						'location.country': reference(portugalId)
					})
					.commit();
			}
			touchedListingIds.add(publishedId(listingId));
			listingsResynced += 1;
		}
	}
	console.log(`\nListings resynced: ${listingsResynced}\n`);

	// 4b. Re-home catch-all listings into brand-new Locations (each born with a single
	// catch-all community to hold them).
	if (!catchAllCommunities.some((c) => c._id === ALGARVE_CATCH_ALL_COMMUNITY_ID)) {
		flags.push(
			`expected catch-all ${ALGARVE_CATCH_ALL_COMMUNITY_ID} was not found under Algarve.`
		);
	}
	let listingsRehomed = 0;
	const rehomeLocationIds: string[] = [];
	for (const target of REHOME_TARGETS) {
		const locationId = stablePlacesId('location', target.slug);
		const communityId = stablePlacesId('community', target.slug);
		rehomeLocationIds.push(locationId);
		console.log(`→ ${target.name}: create ${locationId} + catch-all ${communityId}`);
		if (!dryRun) {
			await client.createIfNotExists({
				_id: locationId,
				_type: 'locationTaxonomy',
				name: target.name,
				slug: { _type: 'slug', current: target.slug },
				type: 'location',
				parent: reference(portugalId)
			});
			await client.createIfNotExists({
				_id: communityId,
				_type: 'locationTaxonomy',
				name: target.name,
				slug: { _type: 'slug', current: target.slug },
				type: 'community',
				parent: reference(locationId),
				isCatchAll: true
			});
		}
		for (const listingId of target.listingIds) {
			console.log(`  rehome listing ${listingId} → ${communityId}`);
			const patched = await patchAllTargets(client, listingId, {
				'location.community': reference(communityId),
				'location.location': reference(locationId),
				'location.country': reference(portugalId)
			});
			if (patched === 0) flags.push(`rehome listing ${listingId} — no revision found.`);
			else listingsRehomed += 1;
			touchedListingIds.add(publishedId(listingId));
		}
	}
	console.log(`\nListings rehomed: ${listingsRehomed}\n`);

	// 4c. Drain + delete the generic Algarve catch-all community(ies). "Leftover" excludes
	// the listings we just re-homed so the decision holds in dry-run too.
	const rehomedListingIds = REHOME_TARGETS.flatMap((t) => t.listingIds.map(publishedId));
	const retainedCatchAll: string[] = [];
	for (const community of catchAllCommunities) {
		const remaining = await client.fetch<number>(
			`count(*[
				_type in $types
				&& location.community._ref == $cid
				&& !(_id in $rehomed)
				&& !(_id in $rehomedDrafts)
			])`,
			{
				types: LISTING_TYPES,
				cid: community._id,
				rehomed: rehomedListingIds,
				rehomedDrafts: rehomedListingIds.map((id) => `drafts.${id}`)
			}
		);
		if (remaining === 0) {
			console.log(`Deleting drained catch-all community ${community._id}`);
			await deleteAllTargets(client, community._id);
		} else {
			retainedCatchAll.push(community._id);
			flags.push(
				`catch-all "${community.name}" (${community._id}) still holds ${remaining} listing ` +
					`revision(s) outside REHOME_TARGETS — retained; Algarve will NOT be deleted.`
			);
		}
	}

	// 5. Strip Algarve from featured / linked / associated arrays.
	console.log('Cleaning Algarve references…');
	await stripRefFromArray(client, portugalId, 'featuredLocations', algarveId);
	await stripRefFromArray(client, 'siteSettings', 'homepageFeaturedLocations', algarveId);

	const linkedDocs = await client.fetch<string[]>(
		`*[_type == "locationTaxonomy" && $algarveId in linkedLocations[].location._ref]._id`,
		{ algarveId }
	);
	for (const id of new Set(linkedDocs.map(publishedId))) {
		await stripRefFromArray(client, id, 'linkedLocations', algarveId, (entry) => {
			const e = entry as { location?: { _ref?: string } };
			return e.location?._ref === algarveId;
		});
	}

	const associatedDocs = await client.fetch<string[]>(
		`*[_type == "locationTaxonomy" && $algarveId in associatedLocations[]._ref]._id`,
		{ algarveId }
	);
	for (const id of new Set(associatedDocs.map(publishedId))) {
		await stripRefFromArray(client, id, 'associatedLocations', algarveId);
	}

	// 6. Delete Algarve only if nothing still references it. Exclude the docs this run
	// fixes (re-parented communities, drained catch-all, re-synced/re-homed listings,
	// stripped arrays) so the decision is correct in dry-run as well as on apply.
	const handledRefIds = new Set<string>([
		portugalId,
		'siteSettings',
		...targets.map((t) => t._id),
		...catchAllCommunities.map((c) => c._id),
		...touchedListingIds,
		...[...linkedDocs, ...associatedDocs].map(publishedId)
	]);
	const remainingRefsRaw = await client.fetch<string[]>(
		`*[references($algarveId) && _id != $algarveId && _id != "drafts." + $algarveId]._id`,
		{ algarveId }
	);
	const remainingRefs = remainingRefsRaw.filter((id) => !handledRefIds.has(publishedId(id)));
	const blockedByCatchAll = retainedCatchAll.length > 0;

	console.log('');
	if (remainingRefs.length === 0 && !blockedByCatchAll) {
		console.log(`Deleting Algarve (${algarveId})…`);
		await deleteAllTargets(client, algarveId);
	} else {
		console.log(
			`Retaining Algarve (${algarveId}) — ` +
				`${remainingRefs.length} doc(s) still reference it${blockedByCatchAll ? ' + non-empty catch-all' : ''}:`
		);
		for (const id of remainingRefs) console.log(`  • ${id}`);
	}

	// 7. Report-only: addressDisplay strings still naming Algarve (editorial follow-up).
	const algarveAddresses = await client.fetch<Array<{ _id: string; addr: string }>>(
		`*[_type in $types && location.addressDisplay match "*Algarve*"]{ _id, "addr": location.addressDisplay }`,
		{ types: LISTING_TYPES }
	);
	if (algarveAddresses.length) {
		console.log(`\naddressDisplay still mentions "Algarve" (${algarveAddresses.length}) — editorial pass:`);
		for (const a of algarveAddresses) console.log(`  • ${a._id}: ${a.addr}`);
	}

	if (flags.length) {
		console.log('\n⚑ Flagged for manual review:');
		for (const f of flags) console.log(`  • ${f}`);
	}

	// 8. Verification (enforced on apply only).
	const verify = await client.fetch<{
		danglingListings: number;
		algarveStillExists: boolean;
		badCommunities: number;
		missingLocations: number;
		rehomeMissing: number;
		catchAllRemaining: number;
	}>(
		`{
			"danglingListings": count(*[_type in $types && location.location._ref == $algarveId && location.community._ref in $communityIds]),
			"algarveStillExists": count(*[_id == $algarveId || _id == "drafts." + $algarveId]) > 0,
			"badCommunities": count(*[_id in $communityIds && (isCatchAll != true || parent->slug.current == "algarve")]),
			"missingLocations": count($newLocationIds) - count(*[_id in $newLocationIds && type == "location" && parent->slug.current == "portugal"]),
			"rehomeMissing": count($rehomeLocationIds) - count(*[_id in $rehomeLocationIds && type == "location" && parent->slug.current == "portugal"]),
			"catchAllRemaining": count(*[_type in $types && location.community._ref == $catchAllId && !(_id in $rehomed) && !(_id in $rehomedDrafts)])
		}`,
		{
			types: LISTING_TYPES,
			algarveId,
			catchAllId: ALGARVE_CATCH_ALL_COMMUNITY_ID,
			communityIds: targets.map((t) => t._id),
			newLocationIds: targets.map((t) => stablePlacesId('location', t.slug)),
			rehomeLocationIds,
			rehomed: REHOME_TARGETS.flatMap((t) => t.listingIds.map(publishedId)),
			rehomedDrafts: REHOME_TARGETS.flatMap((t) => t.listingIds.map((id) => `drafts.${publishedId(id)}`))
		}
	);

	console.log('\nPost-migration verification:');
	console.log(`  promoted locations present: ${targets.length - verify.missingLocations}/${targets.length}`);
	console.log(`  promoted communities re-parented + catch-all: ${targets.length - verify.badCommunities}/${targets.length}`);
	console.log(`  re-home locations present: ${rehomeLocationIds.length - verify.rehomeMissing}/${rehomeLocationIds.length}`);
	console.log(`  listings left on Algarve catch-all: ${verify.catchAllRemaining}`);
	console.log(`  migrated-community listings still pointing at Algarve: ${verify.danglingListings}`);
	console.log(`  Algarve still exists: ${verify.algarveStillExists}`);

	if (!dryRun) {
		const expectAlgarveGone = remainingRefs.length === 0 && !blockedByCatchAll;
		if (
			verify.danglingListings > 0 ||
			verify.badCommunities > 0 ||
			verify.missingLocations > 0 ||
			verify.rehomeMissing > 0 ||
			(expectAlgarveGone && (verify.algarveStillExists || verify.catchAllRemaining > 0))
		) {
			console.error('\nVerification failed.');
			process.exitCode = 1;
		}
	}

	console.log('\nDone.');
}

/**
 * Remove array entries that reference `targetId` from `field` on every revision of a
 * document, preserving the surviving entries (and their `_key`s). `match` defaults to
 * a plain reference array (`{ _ref }`); pass a predicate for object arrays.
 */
async function stripRefFromArray(
	client: SanityClient,
	baseId: string,
	field: string,
	targetId: string,
	match: (entry: unknown) => boolean = (entry) =>
		(entry as { _ref?: string })?._ref === targetId
): Promise<void> {
	const targets = await existingTargets(client, baseId);
	for (const id of targets) {
		// `field` is always one of our own literal constants — safe to interpolate.
		const current = await client.fetch<unknown[] | null>(`*[_id == $id][0].${field}`, {
			id
		});
		if (!Array.isArray(current) || current.length === 0) continue;
		const next = current.filter((entry) => !match(entry));
		if (next.length === current.length) continue;
		console.log(`  strip ${field} on ${id} (${current.length} → ${next.length})`);
		if (!dryRun) await client.patch(id).set({ [field]: next }).commit();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
