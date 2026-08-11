/**
 * Parse a Kyero V3 XML feed into flat KyeroProperty records.
 *
 * Uses fast-xml-parser (handles CDATA-wrapped image URLs and HTML entities in copy).
 * Values are kept as strings — the mapping layer (kyero-map.ts) decides how to coerce.
 */

import { XMLParser } from 'fast-xml-parser';
import type { KyeroProperty } from './types';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	trimValues: true,
	parseTagValue: false, // keep prices/beds/etc as strings; the map layer coerces deliberately
	isArray: (name) => name === 'property' || name === 'image' || name === 'feature'
});

/** Read a child that may be a string, number, or missing → always a trimmed string. */
function str(v: unknown): string {
	if (v == null) return '';
	if (typeof v === 'object') return '';
	return String(v).trim();
}

export interface ParsedFeed {
	feedVersion: string;
	properties: KyeroProperty[];
}

export function parseFeed(xml: string): ParsedFeed {
	const doc = parser.parse(xml);
	const root = doc.root ?? doc.kyero ?? doc;
	const feedVersion = str(root?.kyero?.feed_version);
	const rawProps: any[] = root?.property ?? [];

	const properties: KyeroProperty[] = rawProps.map((p) => {
		const images: string[] = (p.images?.image ?? [])
			.map((img: any) => str(typeof img === 'object' ? img.url : img))
			.filter(Boolean);

		const features: string[] = (p.features?.feature ?? []).map((f: any) => str(f)).filter(Boolean);

		return {
			id: str(p.id),
			ref: str(p.ref),
			date: str(p.date),
			notes: str(p.notes),
			price: str(p.price),
			currency: str(p.currency),
			priceFreq: str(p.price_freq),
			newBuild: str(p.new_build),
			type: str(p.type),
			town: str(p.town),
			province: str(p.province),
			country: str(p.country),
			latitude: str(p.location?.latitude),
			longitude: str(p.location?.longitude),
			beds: str(p.beds),
			baths: str(p.baths),
			pool: str(p.pool),
			built: str(p.surface_area?.built),
			plot: str(p.surface_area?.plot),
			videoUrl: str(p.video_url),
			descEn: str(p.desc?.en),
			descPl: str(p.desc?.pl),
			urlEn: str(p.url?.en),
			features,
			imageUrls: images
		};
	});

	return { feedVersion, properties };
}
