<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PublicMapPayload } from '$lib/sanity/transforms/mapPrivacy';
	import type { GolfPin } from '$lib/listing/mapPins';
	import { buildOsmExternalUrl } from '$lib/listing/osmEmbed';
	import { resolveMapStyleUrl, applyBrandWash, circlePolygon } from '$lib/listing/mapStyle';
	import 'maplibre-gl/dist/maplibre-gl.css';

	type Props = {
		map: PublicMapPayload | null | undefined;
		golfPins?: GolfPin[];
	};

	let { map, golfPins = [] }: Props = $props();

	const coords = $derived(map?.coordinates ?? null);
	const externalUrl = $derived(buildOsmExternalUrl(coords));

	let container: HTMLDivElement | null = $state(null);
	let mode: 'idle' | 'interactive' = $state('idle');
	let status: 'loading' | 'ready' | 'error' = $state('loading');

	// Non-reactive handle to the live map instance.
	let mapInstance: import('maplibre-gl').Map | null = null;
	let handlers: Array<{ enable: () => void; disable: () => void }> = [];

	const reduceMotion =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	function activate() {
		if (mode === 'interactive' || !mapInstance) return;
		for (const h of handlers) h.enable();
		mode = 'interactive';
		container?.querySelector<HTMLElement>('.maplibregl-canvas')?.focus();
	}

	onMount(() => {
		if (!coords || !container) return;

		let cancelled = false;

		(async () => {
			try {
				const maplibre = (await import('maplibre-gl')).default;
				if (cancelled || !container) return;

				const m = new maplibre.Map({
					container,
					style: resolveMapStyleUrl(),
					center: [coords.lng, coords.lat],
					zoom: 12.5,
					attributionControl: { compact: true },
					// Start as a calm, still image; handlers are enabled on "Explore".
					interactive: true,
					dragRotate: false,
					pitchWithRotate: false
				});
				mapInstance = m;

				// Disable every pan/zoom handler up front; activate() re-enables them.
				handlers = [
					m.dragPan,
					m.scrollZoom,
					m.boxZoom,
					m.keyboard,
					m.doubleClickZoom,
					m.touchZoomRotate
				];
				for (const h of handlers) h.disable();

				// Only a total load failure (bad key, blocked host, dead network) should
				// show the fallback. If the style hasn't loaded within the window, flip to
				// error; otherwise non-fatal sub-resource errors below are ignored.
				const loadTimeout = setTimeout(() => {
					if (!cancelled && status === 'loading') status = 'error';
				}, 8000);

				m.on('load', () => {
					if (cancelled) return;
					clearTimeout(loadTimeout);
					applyBrandWash(m);

					// Collapse the (legally required) attribution to its compact "ⓘ" form;
					// the OSM/MapTiler credit stays one tap away, styling handles the rest.
					container
						?.querySelector('.maplibregl-ctrl-attrib')
						?.classList.remove('maplibregl-compact-show');

					// Property area: a soft disc, never a precise pin (privacy: area_only).
					m.addSource('property-area', { type: 'geojson', data: circlePolygon(coords) });
					m.addLayer({
						id: 'property-area-fill',
						type: 'fill',
						source: 'property-area',
						paint: { 'fill-color': '#1f3d34', 'fill-opacity': 0.08 }
					});
					m.addLayer({
						id: 'property-area-line',
						type: 'line',
						source: 'property-area',
						paint: { 'line-color': '#1f3d34', 'line-width': 1.25, 'line-opacity': 0.45 }
					});

					const bounds = new maplibre.LngLatBounds([coords.lng, coords.lat], [coords.lng, coords.lat]);

					for (const pin of golfPins) {
						bounds.extend([pin.coordinates.lng, pin.coordinates.lat]);
						addGolfMarker(maplibre, m, pin);
					}

					// Frame the area disc plus every pin in one calm view.
					bounds.extend([coords.lng - 0.018, coords.lat - 0.018]);
					bounds.extend([coords.lng + 0.018, coords.lat + 0.018]);
					m.fitBounds(bounds, { padding: 56, maxZoom: 14.5, animate: false });

					status = 'ready';
				});

				// MapLibre fires 'error' for non-fatal sub-resource failures too — one
				// 403'd font-glyph range, a missing tile. Those must NOT blank a map that
				// otherwise renders; log and move on. Total failures are caught by the
				// load timeout above and the import catch below.
				m.on('error', (e) => {
					console.warn('[area-map] maplibre error', e.error);
				});
			} catch {
				if (!cancelled) status = 'error';
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	function addGolfMarker(
		maplibre: typeof import('maplibre-gl'),
		m: import('maplibre-gl').Map,
		pin: GolfPin
	) {
		const el = document.createElement('div');
		el.className = 'golf-pin';
		el.setAttribute('role', 'button');
		el.setAttribute('tabindex', '0');
		el.setAttribute('aria-label', `Golf course: ${pin.name}`);

		const dot = document.createElement('span');
		dot.className = 'golf-pin__dot';
		const label = document.createElement('span');
		label.className = 'golf-pin__label';
		label.textContent = pin.name;
		el.append(dot, label);

		const popupHtml = `
			<div class="golf-popup">
				<p class="golf-popup__name">${escapeHtml(pin.name)}</p>
				${pin.href ? `<a class="golf-popup__link" href="${pin.href}">View course →</a>` : ''}
			</div>`;

		const popup = new maplibre.Popup({ offset: 16, closeButton: false, className: 'golf-popup-wrap' }).setHTML(popupHtml);

		const marker = new maplibre.Marker({ element: el, anchor: 'bottom' })
			.setLngLat([pin.coordinates.lng, pin.coordinates.lat])
			.setPopup(popup)
			.addTo(m);

		const toggle = () => marker.togglePopup();
		el.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				toggle();
			}
		});
	}

	function escapeHtml(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	onDestroy(() => {
		mapInstance?.remove();
		mapInstance = null;
	});
</script>

{#if coords}
	<figure class="area-map" class:area-map--idle={mode === 'idle'}>
		<div class="area-map__frame">
			<div class="area-map__canvas" bind:this={container} aria-hidden={status !== 'ready'}></div>

			{#if status === 'error'}
				<div class="area-map__state area-map__state--error">
					<p>The map couldn't load. {#if externalUrl}<a href={externalUrl} target="_blank" rel="noopener noreferrer">Open the area in OpenStreetMap →</a>{/if}</p>
				</div>
			{:else if status === 'loading'}
				<div class="area-map__state" aria-hidden="true">
					<span class="area-map__spinner"></span>
				</div>
			{:else if mode === 'idle'}
				<!-- Static-first: the styled map sits still until the visitor chooses to explore. -->
				<div class="area-map__veil">
					<button type="button" class="area-map__explore" onclick={activate}>Explore map</button>
				</div>
			{/if}
		</div>

		<figcaption class="area-map__footer">
			{#if map?.level === 'area_only'}
				<p class="area-map__note">Map shows the community area, not the exact property location.</p>
			{/if}
		</figcaption>
	</figure>
{/if}

<style>
	.area-map {
		margin: 0;
	}

	.area-map__frame {
		position: relative;
		border: 1px solid var(--border);
		background: var(--white);
		overflow: hidden;
	}

	.area-map__canvas {
		width: 100%;
		height: min(28rem, 62vw);
	}

	.area-map__state {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: var(--space-md);
		background: var(--white);
	}

	.area-map__state--error p {
		font-size: var(--text-ui);
		color: var(--muted);
		text-align: center;
		max-width: 30ch;
	}

	.area-map__state--error a {
		color: var(--green);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.area-map__spinner {
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid var(--border);
		border-top-color: var(--green);
		border-radius: 50%;
		animation: area-map-spin 0.8s linear infinite;
	}

	@keyframes area-map-spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* The "explore" affordance: a gentle veil + a single pill. pointer-events stay
	   off the veil so golf pins are tappable before the map is unlocked; only the
	   button captures clicks. */
	.area-map__veil {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		pointer-events: none;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--green) 4%, transparent),
			color-mix(in srgb, var(--green) 12%, transparent)
		);
		transition: opacity var(--duration-hover) var(--ease);
	}

	.area-map__explore {
		pointer-events: auto;
		font-family: var(--sans);
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		background: var(--white);
		border: 1px solid var(--green);
		padding: 0.7rem 1.6rem;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.area-map__explore:hover,
	.area-map__explore:focus-visible {
		background: var(--green);
		color: var(--white);
	}

	.area-map__footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem var(--space-md);
		margin-top: 0.65rem;
	}

	.area-map__note {
		font-size: var(--text-small);
		color: var(--muted);
	}

	/* Golf pins + popups are mounted imperatively by MapLibre, so they live outside
	   this component's scoped styles — target them globally. */
	:global(.golf-pin) {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
		transform: translateY(-2px);
	}

	:global(.golf-pin__dot) {
		width: 0.7rem;
		height: 0.7rem;
		background: var(--gold);
		border: 1px solid var(--green);
		box-shadow: 0 1px 3px rgba(31, 61, 52, 0.35);
		flex: none;
	}

	:global(.golf-pin__label) {
		font-family: var(--sans);
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.01em;
		color: var(--green);
		background: color-mix(in srgb, var(--white) 88%, transparent);
		padding: 0.1rem 0.35rem;
		max-width: 11rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		box-shadow: 0 1px 2px rgba(31, 61, 52, 0.18);
	}

	:global(.golf-pin:hover .golf-pin__dot),
	:global(.golf-pin:focus-visible .golf-pin__dot) {
		background: var(--green);
		border-color: var(--gold);
	}

	:global(.golf-pin:focus-visible) {
		outline: 2px solid var(--green);
		outline-offset: 2px;
	}

	:global(.golf-popup-wrap .maplibregl-popup-content) {
		border: 1px solid var(--border);
		border-radius: 0;
		box-shadow: 0 6px 20px rgba(31, 61, 52, 0.16);
		padding: 0.75rem 0.9rem;
		font-family: var(--sans);
	}

	:global(.golf-popup__name) {
		font-family: var(--serif);
		font-size: 1rem;
		color: var(--green);
		margin: 0;
	}

	:global(.golf-popup__link) {
		display: inline-block;
		margin-top: 0.5rem;
		font-size: var(--text-ui);
		color: var(--green);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	:global(.golf-popup__link:hover) {
		color: var(--gold);
	}

	/* Attribution: required, but muted to fine print. Collapsed to a small "ⓘ"
	   on load (see the load handler); the credit expands on tap. */
	:global(.area-map__frame .maplibregl-ctrl-attrib) {
		background: color-mix(in srgb, var(--white) 78%, transparent);
		margin: 0;
	}

	:global(.area-map__frame .maplibregl-ctrl-attrib-button) {
		opacity: 0.55;
	}

	:global(.area-map__frame .maplibregl-ctrl-attrib-inner) {
		font-size: 0.625rem;
		color: var(--muted);
	}

	:global(.area-map__frame .maplibregl-ctrl-attrib-inner a) {
		color: var(--muted);
		text-decoration: none;
	}

	:global(.area-map__frame .maplibregl-ctrl-attrib-inner a:hover) {
		color: var(--green);
		text-decoration: underline;
	}

	@media (prefers-reduced-motion: reduce) {
		.area-map__veil,
		.area-map__explore {
			transition: none;
		}
		.area-map__spinner {
			animation-duration: 1.6s;
		}
	}
</style>
