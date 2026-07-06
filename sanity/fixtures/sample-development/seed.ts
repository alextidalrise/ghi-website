#!/usr/bin/env node
/**
 * Seed a self-contained SAMPLE development that exercises the full
 * Development → Unit Type → Unit model, so the reshaped development page, the units
 * inventory table, and synthesized unit pages can be viewed against real infra.
 *
 * It creates its own throwaway location taxonomy (slugs prefixed `sample-…`) so it
 * never collides with production locations. Safe to delete with `--delete`.
 *
 * Requires a write token. Defaults to the `development` dataset (what the web dev
 * server reads — PUBLIC_SANITY_DATASET in web/.env.local). Pass --dataset to target
 * another dataset explicitly; only do so deliberately for `production`.
 *
 * Usage:
 *   SANITY_API_TOKEN=… pnpm --filter sanity sample:seed
 *   SANITY_API_TOKEN=… pnpm --filter sanity sample:seed:dry-run
 *   SANITY_API_TOKEN=… pnpm --filter sanity sample:delete
 *   SANITY_API_TOKEN=… pnpm --filter sanity sample:seed -- --dataset production   # explicit opt-in
 */
import { createClient, type IdentifiedSanityDocumentStub } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN = process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const deleteMode = args.includes('--delete');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetIndex >= 0 ? args[datasetIndex + 1] : (process.env.SANITY_STUDIO_DATASET ?? 'development');

const IMAGE_SOURCE = join(
	__dirname,
	'../../../web/static/design-system/assets/andalucia-golf-villa.png'
);

const IDS = {
	country: 'sample.country',
	location: 'sample.location',
	community: 'sample.community',
	development: 'sample.development.epic',
	type1: 'sample.unitType.1bed',
	type2: 'sample.unitType.2bed',
	type3: 'sample.unitType.penthouse'
};

const SLUGS = {
	country: 'sample-country',
	location: 'sample-coast',
	community: 'sample-quarter',
	development: 'epic-sample'
};

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config/sanity/config.json');
	if (!existsSync(configPath)) return undefined;
	try {
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string };
		return config.authToken;
	} catch {
		return undefined;
	}
}

function mediaAsset(assetId: string, altText: string, key: string) {
	return {
		_key: key,
		_type: 'mediaAssetMetadata' as const,
		asset: { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: assetId } },
		altText
	};
}

function ref(id: string, key?: string) {
	return { _type: 'reference' as const, _ref: id, ...(key ? { _key: key } : {}) };
}

function pricing(fields: Record<string, unknown>) {
	return {
		_type: 'pricingFields' as const,
		currency: 'EUR',
		priceConfirmed: true,
		...fields
	};
}

function specs(fields: Record<string, unknown>) {
	return { _type: 'specsFields' as const, builtAreaUnit: 'sqm', ...fields };
}

type RawUnit = {
	key: string;
	number: string;
	floor: number;
	beds: number;
	area: number;
	price: number;
	status: string;
	typeId: string;
};

const UNITS: RawUnit[] = [
	{ key: 'u-a1', number: 'A1.04', floor: 4, beds: 1, area: 62, price: 545_000, status: 'available', typeId: IDS.type1 },
	{ key: 'u-a2', number: 'A2.07', floor: 7, beds: 1, area: 64, price: 565_000, status: 'available', typeId: IDS.type1 },
	{ key: 'u-a3', number: 'A3.02', floor: 3, beds: 1, area: 60, price: 525_000, status: 'reserved', typeId: IDS.type1 },
	{ key: 'u-b1', number: 'B5.01', floor: 5, beds: 2, area: 95, price: 845_000, status: 'available', typeId: IDS.type2 },
	{ key: 'u-b2', number: 'B8.03', floor: 8, beds: 2, area: 98, price: 910_000, status: 'available', typeId: IDS.type2 },
	{ key: 'u-p1', number: 'P12.01', floor: 12, beds: 3, area: 168, price: 1_950_000, status: 'available', typeId: IDS.type3 }
];

function buildUnit(assetId: string, u: RawUnit): IdentifiedSanityDocumentStub {
	return {
		_id: `sample.unit.${u.key}`,
		_type: 'unit',
		unitName: `Unit ${u.number}`,
		unitNumber: u.number,
		slug: { _type: 'slug', current: `unit-${u.number.replace(/\./g, '-').toLowerCase()}` },
		parentDevelopment: ref(IDS.development),
		parentUnitType: ref(u.typeId),
		listingKind: 'unit',
		floor: u.floor,
		phase: 'Riverside Phase',
		status: 'published',
		pricing: pricing({
			price: u.price,
			priceDisplay: String(u.price),
			availabilityStatus: u.status,
			completionStatus: 'completed'
		}),
		specs: specs({ bedrooms: u.beds, bathrooms: u.beds, builtArea: u.area })
	};
}

function buildUnitType(
	assetId: string,
	id: string,
	name: string,
	propertyType: string,
	bedrooms: number,
	areaFrom: number
): IdentifiedSanityDocumentStub {
	return {
		_id: id,
		_type: 'unitType',
		unitTypeName: name,
		propertyType,
		parentDevelopment: ref(IDS.development),
		listingKind: 'unit_type',
		status: 'published',
		pricing: pricing({ availabilityStatus: 'available' }),
		specs: specs({ bedrooms, builtArea: areaFrom }),
		gallery: [
			mediaAsset(assetId, `${name} — living space`, 'g1'),
			mediaAsset(assetId, `${name} — terrace`, 'g2')
		]
	};
}

function buildLocation(): IdentifiedSanityDocumentStub[] {
	return [
		{
			_id: IDS.country,
			_type: 'locationTaxonomy',
			name: 'Sampleland',
			slug: { _type: 'slug', current: SLUGS.country },
			type: 'country',
			breadcrumbLabel: 'Sampleland',
			publicDescription: 'Sample fixture country.'
		},
		{
			_id: IDS.location,
			_type: 'locationTaxonomy',
			name: 'Sample Coast',
			slug: { _type: 'slug', current: SLUGS.location },
			type: 'location',
			parent: ref(IDS.country),
			breadcrumbLabel: 'Sample Coast',
			publicDescription: 'Sample fixture location.'
		},
		{
			_id: IDS.community,
			_type: 'locationTaxonomy',
			name: 'Sample Quarter',
			slug: { _type: 'slug', current: SLUGS.community },
			type: 'community',
			parent: ref(IDS.location),
			breadcrumbLabel: 'Sample Quarter',
			publicDescription: 'Sample fixture community.',
			coordinates: { _type: 'geopoint', lat: 36.509, lng: -4.918 }
		}
	];
}

function buildDevelopment(assetId: string, includeChildren = true): IdentifiedSanityDocumentStub {
	return {
		_id: IDS.development,
		_type: 'development',
		ghiListingId: 'GHI09001',
		developmentName: 'Epic',
		title: 'Epic — Sample Quarter, Sample Coast',
		slug: { _type: 'slug', current: SLUGS.development },
		listingKind: 'development',
		developmentDisplayMode: 'units',
		developmentStatus: 'available',
		completionStatus: 'completed',
		developerName: 'Sample Estates',
		developmentComposition: ['Apartments', 'Penthouses'],
		location: {
			_type: 'locationFields',
			country: ref(IDS.country),
			location: ref(IDS.location),
			community: ref(IDS.community),
			addressDisplay: 'Riverside, Sample Coast'
		},
		pricing: pricing({ priceFrom: 525_000, priceTo: 1_950_000, availabilityStatus: 'available' }),
		availabilitySummary: '5 homes available',
		content: {
			_type: 'contentFields',
			shortDescription: 'A riverside collection of one- to three-bedroom homes with frontline golf.',
			aboutDescription: [
				{
					_type: 'block',
					_key: 'a1',
					style: 'normal',
					markDefs: [],
					children: [
						{
							_type: 'span',
							_key: 's1',
							marks: [],
							text: 'A landmark riverside collection pairing resort-grade amenities with frontline golf. One- to three-bedroom homes share a private spa, residents lounge, and landscaped podium gardens.'
						}
					]
				}
			]
		},
		sharedAmenities: ['Private spa', 'Residents lounge', 'Podium gardens', 'Concierge', 'Underground parking'].map(
			(label, index) => ({
				_key: `sa${index + 1}`,
				_type: 'featureHighlight',
				label,
				isHighlighted: true
			})
		),
		sharedGallery: [mediaAsset(assetId, 'Epic — riverside facade', 'sg1')],
		media: {
			_type: 'mediaFields',
			gallery: [mediaAsset(assetId, 'Epic — podium gardens', 'm1')]
		},
		golf: {
			_type: 'golfFields',
			golfRelevance: 'frontline_golf'
		},
		status: 'published',
		...(includeChildren
			? {
					unitTypes: [ref(IDS.type1, 'ut1'), ref(IDS.type2, 'ut2'), ref(IDS.type3, 'ut3')],
					units: UNITS.map((u) => ref(`sample.unit.${u.key}`, u.key))
				}
			: {})
	};
}

async function main() {
	console.log(`Sample development → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);

	if (!TOKEN && !dryRun) {
		console.error(
			'Missing write credentials. Set SANITY_API_TOKEN=… (write token) or run `pnpm exec sanity login`.'
		);
		process.exit(1);
	}

	const client = createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-05-01',
		token: TOKEN,
		useCdn: false
	});

	const allIds = [
		IDS.country,
		IDS.location,
		IDS.community,
		IDS.development,
		IDS.type1,
		IDS.type2,
		IDS.type3,
		...UNITS.map((u) => `sample.unit.${u.key}`)
	];

	if (deleteMode) {
		console.log(`Deleting ${allIds.length} sample documents…`);
		if (dryRun) {
			allIds.forEach((id) => console.log(`  [dry-run] delete ${id}`));
			return;
		}
		// Delete units/types/development before the location taxonomy they reference.
		for (const id of [...allIds].reverse()) {
			await client.delete(id).catch(() => client.delete({ query: '*[_id == $id]', params: { id } }));
			console.log(`  ✓ deleted ${id}`);
		}
		return;
	}

	let assetId = 'image-dry-run';
	if (!dryRun) {
		console.log('Uploading sample image…');
		const asset = await client.assets.upload('image', readFileSync(IMAGE_SOURCE), {
			filename: 'epic-sample.png'
		});
		assetId = asset._id;
		console.log(`  uploaded → ${assetId}`);
	}

	// Circular refs: unit types and units point at the development; development lists them.
	// Seed the development stub first, then children, then patch the parent refs.
	const documents: IdentifiedSanityDocumentStub[] = [
		...buildLocation(),
		buildDevelopment(assetId, false),
		buildUnitType(assetId, IDS.type1, '1-bed apartment', 'apartment', 1, 60),
		buildUnitType(assetId, IDS.type2, '2-bed apartment', 'apartment', 2, 95),
		buildUnitType(assetId, IDS.type3, '3-bed penthouse', 'penthouse', 3, 168),
		...UNITS.map((u) => buildUnit(assetId, u)),
		buildDevelopment(assetId)
	];

	console.log(`Upserting ${documents.length} documents…`);
	for (const doc of documents) {
		if (dryRun) {
			console.log(`  [dry-run] ${doc._type} ${doc._id}`);
			continue;
		}
		await client.createOrReplace(doc);
		console.log(`  ✓ ${doc._type} ${doc._id}`);
	}

	const base = `/${SLUGS.country}/${SLUGS.location}/${SLUGS.community}/${SLUGS.development}`;
	console.log('\nView (after `pnpm --filter web dev`):');
	console.log(`  Development:  ${base}`);
	console.log(`  A unit page:  ${base}/unit-a1-04`);
	console.log(`  Permalink:    /d/GHI09001`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
