#!/usr/bin/env node
/**
 * Seed `coordinates` (geopoint) on community taxonomy docs and golf courses so the
 * listing-page area map renders in a dataset.
 *
 * The area map shows a ~1.4km "community area" disc (privacy: never an exact
 * property pin), so communities are anchored at their parent town's real
 * coordinates plus a small deterministic offset — distinct, area-level points that
 * sit truthfully within the town. Golf courses get their real exact location, since
 * those are pinned precisely on the map.
 *
 * Patches both the published id and its `drafts.` twin (dev preview-all reads
 * drafts), mirroring set-nueva-andalucia-hero-migrate.ts.
 *
 * Usage:
 *   pnpm --filter sanity migrate:seed-map-coordinates -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:seed-map-coordinates -- --dataset development
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

type LatLng = { lat: number; lng: number };

/** Real approximate town centres, keyed by the parent location's name. */
const LOCATION_COORDS: Record<string, LatLng> = {
	Marbella: { lat: 36.5101, lng: -4.8824 },
	'Nueva Andalucia': { lat: 36.4998, lng: -4.954 },
	Sotogrande: { lat: 36.288, lng: -5.292 },
	Estepona: { lat: 36.435, lng: -5.13 },
	Benahavis: { lat: 36.5217, lng: -5.0457 },
	'San Pedro de Alcantara': { lat: 36.4848, lng: -4.9986 },
	Algarve: { lat: 37.085, lng: -8.13 }
};

/**
 * Exact golf-course locations, keyed by published doc id. Approximate (good to
 * ~500m, invisible at the map's zoom) and illustrative — verify before relying on
 * them in production.
 */
const GOLF_COORDS: Record<string, LatLng> = {
	// Nueva Andalucía — the Golf Valley
	'golf-course-aloha-golf-club': { lat: 36.5083, lng: -4.9686 },
	'golf-course-los-naranjos-golf-club': { lat: 36.5036, lng: -4.9606 },
	'golf-course-real-club-de-golf-las-brisas': { lat: 36.4995, lng: -4.9669 },
	'golf-course-la-quinta-golf-and-country-club': { lat: 36.514, lng: -4.992 },
	'golf-course-magna-marbella-golf': { lat: 36.517, lng: -4.976 },
	// Marbella (town + east / Elviria)
	'golf-course-monte-paraiso-golf': { lat: 36.517, lng: -4.905 },
	'golf-course-rio-real-golf-club': { lat: 36.501, lng: -4.848 },
	'golf-course-marbella-golf-and-country-club': { lat: 36.505, lng: -4.824 },
	'golf-course-santa-maria-golf-and-country-club': { lat: 36.492, lng: -4.833 },
	'7b694733-f00b-4e45-a98d-ef9f3bdfe351': { lat: 36.4928, lng: -4.8267 }, // Santa Clara Golf Marbella
	// San Pedro de Alcántara
	'golf-course-guadalmina-golf': { lat: 36.466, lng: -5.02 },
	// Benahavís
	'golf-course-la-zagaleta-golf-club': { lat: 36.53, lng: -5.03 },
	'golf-course-los-arqueros-golf': { lat: 36.517, lng: -5.024 },
	'golf-course-marbella-club-golf-resort': { lat: 36.547, lng: -5.009 },
	'golf-course-monte-mayor-golf-club': { lat: 36.475, lng: -5.109 },
	'golf-course-villa-padierna-golf-club': { lat: 36.453, lng: -5.022 },
	// Estepona
	'golf-course-estepona-golf': { lat: 36.421, lng: -5.156 },
	'golf-course-valle-romano-golf': { lat: 36.436, lng: -5.167 },
	'golf-course-la-resina-golf-and-country-club': { lat: 36.455, lng: -5.056 },
	'golf-course-finca-cortesin-golf-club': { lat: 36.377, lng: -5.187 }, // Casares, adjacent
	// Sotogrande / San Roque
	'golf-course-real-club-valderrama': { lat: 36.279, lng: -5.292 },
	'golf-course-real-club-de-golf-sotogrande': { lat: 36.288, lng: -5.279 },
	'golf-course-la-reserva-club-sotogrande': { lat: 36.296, lng: -5.272 },
	'golf-course-san-roque-club': { lat: 36.262, lng: -5.336 }
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetArg = args.find((arg) => arg.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

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

function publishedId(id: string): string {
	return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id;
}

/** Deterministic ~150–650m scatter around the town centre, keyed by the doc id. */
function jitter(seed: string): LatLng {
	let h = 0;
	for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
	const angle = ((h % 360) * Math.PI) / 180;
	const radius = 0.0018 + ((h % 1000) / 1000) * 0.004; // degrees (~0.18–0.58 km)
	return { lat: radius * Math.sin(angle), lng: radius * Math.cos(angle) };
}

function geopoint({ lat, lng }: LatLng) {
	return { _type: 'geopoint', lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

type Doc = { _id: string; loc?: string | null };

async function main() {
	console.log(`Seed map coordinates → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);
	const client = createClientOrThrow();

	// --- Communities ---
	const communities = await client.fetch<Doc[]>(
		`*[_type == "locationTaxonomy" && type == "community"]{ _id, "loc": parent->name }`
	);
	let communityCount = 0;
	const unknownLocs = new Set<string>();
	for (const c of communities) {
		const anchor = c.loc ? LOCATION_COORDS[c.loc] : undefined;
		if (!anchor) {
			unknownLocs.add(c.loc ?? '(no parent)');
			console.warn(`  skip community ${c._id} — no coords for location "${c.loc}"`);
			continue;
		}
		const off = jitter(publishedId(c._id));
		const point = geopoint({ lat: anchor.lat + off.lat, lng: anchor.lng + off.lng });
		console.log(`  ${c._id} (${c.loc}) → ${point.lat}, ${point.lng}`);
		if (!dryRun) await client.patch(c._id).set({ coordinates: point }).commit();
		communityCount++;
	}

	// --- Golf courses ---
	// Well-known courses get exact coordinates; the rest fall back to their town's
	// anchor plus an offset (distinct from the community's own offset) so every
	// linked course still pins, in the right town.
	const courses = await client.fetch<Doc[]>(
		`*[_type == "golfCourse"]{ _id, "loc": community->parent->name }`
	);
	let courseCount = 0;
	for (const g of courses) {
		const exact = GOLF_COORDS[publishedId(g._id)];
		let coords: LatLng | undefined = exact;
		if (!coords) {
			const anchor = g.loc ? LOCATION_COORDS[g.loc] : undefined;
			if (anchor) {
				const off = jitter(`${publishedId(g._id)}#golf`);
				coords = { lat: anchor.lat + off.lat, lng: anchor.lng + off.lng };
			}
		}
		if (!coords) {
			console.warn(`  skip golf course ${g._id} — no exact coords and no town anchor (loc="${g.loc}")`);
			continue;
		}
		const point = geopoint(coords);
		console.log(`  ${g._id}${exact ? '' : ' (town-approx)'} → ${point.lat}, ${point.lng}`);
		if (!dryRun) await client.patch(g._id).set({ coordinates: point }).commit();
		courseCount++;
	}

	console.log(
		`Done. ${communityCount} community revisions, ${courseCount} golf-course revisions${dryRun ? ' (dry run — nothing written)' : ''}.`
	);
	if (unknownLocs.size > 0) {
		console.warn(`Unmapped locations skipped: ${[...unknownLocs].join(', ')}`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
