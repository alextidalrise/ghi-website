import { env } from '$env/dynamic/public';
import type { Feature, Polygon } from 'geojson';
import type { GeoPoint } from '$lib/sanity/transforms/mapPrivacy';

/**
 * Resolve the MapLibre style URL for the area map.
 *
 * Both branches feed the same MapLibre GL renderer; only the tile/style source
 * differs. When `PUBLIC_MAPTILER_KEY` is set we use MapTiler's calm light style
 * (the brand-styled production source). With no key we fall back to OpenFreeMap,
 * a genuinely keyless, free MapLibre host, so the map still renders in dev and on
 * previews without an account. Drop a MapTiler key into the env to switch over —
 * no code change.
 */
const MAPTILER_KEY = env.PUBLIC_MAPTILER_KEY?.trim();

/** A neutral, light MapTiler style; override per brand in MapTiler's studio later. */
const MAPTILER_STYLE = 'dataviz';

/** Keyless, free vector basemap (light monochrome) — the no-account fallback. */
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

export function resolveMapStyleUrl(): string {
	if (MAPTILER_KEY) {
		return `https://api.maptiler.com/maps/${MAPTILER_STYLE}/style.json?key=${MAPTILER_KEY}`;
	}
	return OPENFREEMAP_STYLE;
}

/**
 * Light brand wash applied after the base style loads. Each recolour is guarded
 * so a missing layer (style sources differ) is skipped, never thrown — the base
 * style still renders, just untinted. Keeps the basemap from fighting the
 * white/green/gold palette without re-authoring a full style spec by hand.
 */
const BRAND_LAND = '#fbfaf7'; // near-white, a hair warmer than pure white
const BRAND_WATER = '#cfdcd3'; // desaturated green, reads as the brand's own hue

export function applyBrandWash(map: {
	getStyle: () => { layers?: Array<{ id: string; type: string }> };
	setPaintProperty: (layer: string, prop: string, value: unknown) => void;
}): void {
	const layers = map.getStyle().layers ?? [];
	for (const layer of layers) {
		const id = layer.id.toLowerCase();
		try {
			if (layer.type === 'background') {
				map.setPaintProperty(layer.id, 'background-color', BRAND_LAND);
			} else if (layer.type === 'fill' && (id.includes('water') || id.includes('ocean'))) {
				map.setPaintProperty(layer.id, 'fill-color', BRAND_WATER);
			} else if (layer.type === 'fill' && (id.includes('landcover') || id.includes('landuse') || id.includes('park') || id.includes('wood') || id.includes('green'))) {
				map.setPaintProperty(layer.id, 'fill-opacity', 0.35);
			}
		} catch {
			// Layer shape differs between MapTiler and OpenFreeMap — skip quietly.
		}
	}
}

/**
 * Surface more settlement labels — neighbourhoods, urbanisations, villages — on
 * the "dataviz" base style, which ships deliberately sparse (it's built as a quiet
 * backdrop for data overlays, so it gates everything below town tier to zoom 13+).
 * We do two things to place-label layers: lower the zoom gate, and tighten the
 * collision padding. Once the gate is open the limiter is MapLibre's collision
 * pass (which drops labels that would touch), so trimming the padding lets more of
 * the already-eligible neighbourhood names survive at our framing zoom. Their
 * text-size already clamps to a legible ~10px here. Guarded per layer so a
 * differing fallback style (OpenFreeMap) is skipped, never thrown.
 */
export function boostPlaceLabels(map: {
	getStyle: () => {
		layers?: Array<{ id: string; type: string; 'source-layer'?: string; minzoom?: number }>;
	};
	setLayerZoomRange: (layer: string, minzoom: number, maxzoom: number) => void;
	setLayoutProperty: (layer: string, prop: string, value: unknown) => void;
}): void {
	const layers = map.getStyle().layers ?? [];
	for (const layer of layers) {
		// Settlement labels live in the `place` source-layer in both styles' schemas.
		if (layer.type !== 'symbol' || layer['source-layer'] !== 'place') continue;
		// Only pull down tiers gated above our ~12–13 framing zoom (town/village/
		// neighbourhood); city/country are already visible and left untouched.
		if ((layer.minzoom ?? 0) < 11) continue;
		try {
			map.setLayerZoomRange(layer.id, 9, 24);
			// Default text-padding is 2px; halving it lets neighbouring names pack
			// closer before collision drops them — a touch more density, not clutter.
			map.setLayoutProperty(layer.id, 'text-padding', 1);
		} catch {
			// Layer set differs between MapTiler and OpenFreeMap — skip quietly.
		}
	}
}

/** A ~`radiusKm` GeoJSON circle polygon around a point, for the property-area disc. */
export function circlePolygon(center: GeoPoint, radiusKm = 1.4, steps = 128): Feature<Polygon> {
	const coords: [number, number][] = [];
	const latR = radiusKm / 110.574;
	const lngR = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
	for (let i = 0; i <= steps; i++) {
		const theta = (i / steps) * 2 * Math.PI;
		coords.push([center.lng + lngR * Math.cos(theta), center.lat + latR * Math.sin(theta)]);
	}
	return {
		type: 'Feature',
		geometry: { type: 'Polygon', coordinates: [coords] },
		properties: {}
	};
}
