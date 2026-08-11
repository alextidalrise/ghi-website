/**
 * Kyero feed dry run — parse + map a feed and REPORT what would be created and what
 * needs a human, WITHOUT touching Sanity. This validates the mapping layer against real
 * data and surfaces the reconciliation work (unresolved types, unseeded towns, data gaps)
 * before a single document is written.
 *
 *   pnpm --filter sanity kyero:dry-run                         # default feed URL
 *   pnpm --filter sanity kyero:dry-run -- --file path/to.xml   # a local fixture
 *   pnpm --filter sanity kyero:dry-run -- --url https://…      # another feed
 *
 * No token, no dataset, no writes. Read-only by construction.
 */

import { readFileSync } from 'node:fs';
import { parseFeed } from './parse';
import {
	mapPropertyType,
	mapTransactionType,
	mapPool,
	mapBuildStatus,
	positiveIntOrNull,
	positiveNumberOrNull,
	cleanDescription
} from './kyero-map';

const DEFAULT_URL = 'https://www.propertyportalmarketing.com/xml/murciaservices-kyero.xml';

function arg(flag: string): string | undefined {
	const i = process.argv.indexOf(flag);
	return i >= 0 ? process.argv[i + 1] : undefined;
}

function bump(map: Map<string, number>, key: string) {
	map.set(key, (map.get(key) ?? 0) + 1);
}

function pct(n: number, total: number): string {
	return total ? `${Math.round((n / total) * 100)}%` : '0%';
}

async function loadXml(): Promise<{ source: string; xml: string }> {
	const file = arg('--file');
	if (file) return { source: file, xml: readFileSync(file, 'utf8') };
	const url = arg('--url') ?? DEFAULT_URL;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Feed fetch failed: ${res.status} ${res.statusText}`);
	return { source: url, xml: await res.text() };
}

async function main() {
	const { source, xml } = await loadXml();
	const { feedVersion, properties } = parseFeed(xml);
	const total = properties.length;

	// ---- aggregate ----
	const typeMap = new Map<string, number>(); // "raw → mapped|UNRESOLVED"
	const rawTypeUnresolved = new Map<string, number>();
	const towns = new Map<string, number>(); // "Town (Province)"
	const provinces = new Map<string, number>();
	const currencies = new Map<string, number>();
	const freqs = new Map<string, number>();
	const flags = {
		emptyType: 0,
		zeroBeds: 0,
		zeroBaths: 0,
		poolUnknown: 0,
		zeroCoords: 0,
		missingDesc: 0,
		missingBuilt: 0,
		missingPlot: 0,
		hasVideo: 0,
		newBuild: 0,
		hasNotes: 0
	};
	let imgMin = Infinity;
	let imgMax = 0;
	let imgTotal = 0;

	for (const p of properties) {
		const mappedType = mapPropertyType(p.type);
		typeMap.set(`${p.type || '∅'} → ${mappedType ?? 'UNRESOLVED'}`, (typeMap.get(`${p.type || '∅'} → ${mappedType ?? 'UNRESOLVED'}`) ?? 0) + 1);
		if (!mappedType) rawTypeUnresolved.set(p.type || '∅', (rawTypeUnresolved.get(p.type || '∅') ?? 0) + 1);
		if (!p.type.trim()) flags.emptyType++;

		bump(towns, `${p.town || '∅'} (${p.province || 'no province'})`);
		if (p.province) bump(provinces, p.province);
		bump(currencies, p.currency || '∅');
		bump(freqs, p.priceFreq || '∅');

		if (positiveIntOrNull(p.beds) == null) flags.zeroBeds++;
		if (positiveIntOrNull(p.baths) == null) flags.zeroBaths++;
		if (mapPool(p.pool) === 'unknown') flags.poolUnknown++;
		if (positiveNumberOrNull(p.latitude) == null || positiveNumberOrNull(p.longitude) == null) flags.zeroCoords++;
		if (!cleanDescription(p.descEn)) flags.missingDesc++;
		if (positiveNumberOrNull(p.built) == null) flags.missingBuilt++;
		if (positiveNumberOrNull(p.plot) == null) flags.missingPlot++;
		if (p.videoUrl) flags.hasVideo++;
		if (mapBuildStatus(p.newBuild) === 'off_plan') flags.newBuild++;
		if (p.notes) flags.hasNotes++;

		const n = p.imageUrls.length;
		imgMin = Math.min(imgMin, n);
		imgMax = Math.max(imgMax, n);
		imgTotal += n;
	}

	// ---- report ----
	const H = (s: string) => `\n\x1b[1m${s}\x1b[0m`;
	console.log(`\x1b[1m\x1b[36mKYERO FEED DRY RUN\x1b[0m  (read-only — no Sanity writes)`);
	console.log(`source        : ${source}`);
	console.log(`feed_version  : ${feedVersion || '(none)'}`);
	console.log(`properties    : ${total}`);
	console.log(`currency      : ${[...currencies].map(([k, v]) => `${k}×${v}`).join(', ')}`);
	console.log(`price_freq    : ${[...freqs].map(([k, v]) => `${k}×${v}`).join(', ')}`);
	console.log(`new_build     : ${flags.newBuild} off-plan / ${total - flags.newBuild} resale  → all ingest as propertyListing`);

	console.log(H('PROPERTY TYPE MAPPING'));
	for (const [k, v] of [...typeMap].sort((a, b) => b[1] - a[1])) {
		const mark = k.includes('UNRESOLVED') ? '  \x1b[33m⚠ needs mapping\x1b[0m' : '';
		console.log(`  ${String(v).padStart(3)}  ${k}${mark}`);
	}

	console.log(H(`LOCATIONS — ${towns.size} distinct towns (all need community resolution; region not yet in taxonomy)`));
	for (const [k, v] of [...towns].sort((a, b) => b[1] - a[1])) {
		console.log(`  ${String(v).padStart(3)}  ${k}  \x1b[33m→ reconcile\x1b[0m`);
	}
	console.log(`  provinces: ${[...provinces].map(([k, v]) => `${k}×${v}`).join(', ') || '—'}`);

	console.log(H('DATA-QUALITY FLAGS (defensive handling — never publish a false value)'));
	const row = (label: string, n: number, note: string) =>
		console.log(`  ${String(n).padStart(3)}/${total} (${pct(n, total).padStart(4)})  ${label.padEnd(22)} ${note}`);
	row('empty <type>', flags.emptyType, '→ block: needs type mapping');
	row('missing built area', flags.missingBuilt, '→ specs.builtArea empty; review');
	row('missing plot area', flags.missingPlot, '→ specs.plotSize empty; review');
	row('beds unset/0', flags.zeroBeds, '→ leave unset + review flag');
	row('baths unset/0', flags.zeroBaths, '→ leave unset + review flag');
	row('pool unknown', flags.poolUnknown, '→ specs.pool = unknown');
	row('missing/0 coords', flags.zeroCoords, '→ fine: inherit community pin');
	row('missing desc.en', flags.missingDesc, '→ block: no public copy');
	row('has <notes>', flags.hasNotes, '→ internal only, never public');
	row('has video_url', flags.hasVideo, '→ media.videoUrl');

	const imgAvg = total ? (imgTotal / total).toFixed(1) : '0';
	console.log(H('IMAGES'));
	console.log(`  ${imgTotal} total · min ${imgMin === Infinity ? 0 : imgMin} / avg ${imgAvg} / max ${imgMax} per listing`);
	console.log(`  → each must be fetched and uploaded to Sanity (no URL-reference shortcut)`);

	console.log(H('SAMPLE — first 3 mapped listings'));
	for (const p of properties.slice(0, 3)) {
		const desc = cleanDescription(p.descEn);
		console.log(`  \x1b[36m${p.ref || p.id}\x1b[0m  ${mapPropertyType(p.type) ?? 'UNRESOLVED-TYPE'} · ${mapTransactionType(p.priceFreq)}`);
		console.log(`     price   €${Number(p.price).toLocaleString('en-GB')} ${p.currency}`);
		console.log(`     specs   ${positiveIntOrNull(p.beds) ?? '?'} bed · ${positiveIntOrNull(p.baths) ?? '?'} bath · ${positiveNumberOrNull(p.built) ?? '?'} m² built · pool ${mapPool(p.pool)} · ${mapBuildStatus(p.newBuild)}`);
		console.log(`     where   ${p.town || '∅'}, ${p.province || '∅'}  \x1b[33m(town → community: unresolved)\x1b[0m`);
		console.log(`     media   ${p.imageUrls.length} images${p.videoUrl ? ' + video' : ''}`);
		console.log(`     copy    "${desc.slice(0, 90).replace(/\n/g, ' ')}${desc.length > 90 ? '…' : ''}"`);
	}

	console.log(H('WHAT THIS RUN DID NOT DO'));
	console.log('  · no connection to Sanity, no token read, no documents written');
	console.log('  · next step: with D-2/D-3 confirmed, write these as DRAFT propertyListing docs');
	console.log('    into the `development` dataset, each carrying blocking review items for the');
	console.log('    unresolved items above.\n');
}

main().catch((err) => {
	console.error('\x1b[31mDry run failed:\x1b[0m', err.message);
	process.exit(1);
});
