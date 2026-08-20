/** Minimal value-type aliases mirroring the Sanity enums (schemas/constants/enums.ts). */

export type PropertyType = 'villa' | 'apartment' | 'penthouse' | 'townhouse' | 'plot' | 'finca' | 'development';
export type TransactionType = 'sale' | 'rent' | 'short_term' | 'other';
export type PoolType = 'private' | 'communal' | 'none' | 'unknown';
export type AreaUnit = 'sqm' | 'sqft';
export type PropertyBuildStatus = 'built' | 'off_plan';

/** A single `<property>` after parsing, before mapping — raw Kyero shape, normalised to flat fields. */
export interface KyeroProperty {
	id: string;
	ref: string;
	date: string;
	notes: string;
	price: string;
	currency: string;
	priceFreq: string;
	newBuild: string;
	type: string;
	town: string;
	province: string;
	country: string;
	latitude: string;
	longitude: string;
	beds: string;
	baths: string;
	pool: string;
	built: string;
	plot: string;
	videoUrl: string;
	descEn: string;
	descPl: string;
	urlEn: string;
	features: string[];
	imageUrls: string[];
}
