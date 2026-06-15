<script lang="ts">
	import { fade } from 'svelte/transition';
	import { buildPublicImageUrl } from '$lib/sanity/image';
	import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';

	type Props = {
		floorplans: MediaAssetInput[] | null | undefined;
		title: string;
	};

	let { floorplans, title }: Props = $props();

	// Floorplans are line drawings, so every request is fit:'clip' (contain, no
	// crop) and the plan sits on a white matte for legibility on any background.
	const PREVIEW_WIDTHS = [420, 640, 840];
	const LIGHTBOX_WIDTHS = [1000, 1500, 2000, 2600];
	const PREVIEW_SIZES = '(min-width: 1024px) 21rem, 100vw';
	const LIGHTBOX_SIZES = '100vw';

	function buildSrcset(asset: MediaAssetInput, widths: number[], quality: number): string {
		const parts: string[] = [];
		for (const w of widths) {
			const url = buildPublicImageUrl(asset, { width: w, fit: 'clip', quality });
			if (url) parts.push(`${url} ${w}w`);
		}
		return parts.join(', ');
	}

	type Plan = {
		asset: MediaAssetInput;
		key: string;
		label: string;
		alt: string;
	};

	const plans = $derived.by((): Plan[] => {
		const list = floorplans ?? [];
		const collected: Plan[] = [];
		const multiple = list.length > 1;

		list.forEach((asset, i) => {
			if (!buildPublicImageUrl(asset, { width: 240, fit: 'clip' })) return;
			const caption = asset.altText?.trim();
			const ordinal = collected.length + 1;
			const label = caption || (multiple ? `Floor ${ordinal}` : 'Floorplan');
			const alt = caption
				? caption
				: multiple
					? `Floor ${ordinal} plan, ${title}`
					: `Floorplan, ${title}`;
			collected.push({ asset, key: asset.asset?._ref ?? `floorplan-${i}`, label, alt });
		});

		return collected;
	});

	const total = $derived(plans.length);
	const first = $derived(plans[0] ?? null);

	const previewSrc = $derived(
		first ? buildPublicImageUrl(first.asset, { width: 640, fit: 'clip', quality: 82 }) : null
	);
	const previewSrcset = $derived(first ? buildSrcset(first.asset, PREVIEW_WIDTHS, 82) : '');

	// --- Lightbox --------------------------------------------------------
	let activeIndex = $state(0);
	let lightboxOpen = $state(false);
	let dialogEl = $state<HTMLDialogElement | null>(null);
	let prefersReducedMotion = $state(false);

	const active = $derived(plans[activeIndex] ?? null);
	const activeSrc = $derived(
		active ? buildPublicImageUrl(active.asset, { width: 1500, fit: 'clip', quality: 88 }) : null
	);
	const activeSrcset = $derived(active ? buildSrcset(active.asset, LIGHTBOX_WIDTHS, 88) : '');
	const fadeDuration = $derived(prefersReducedMotion ? 0 : 200);

	const triggerLabel = $derived(
		total > 1 ? `View floorplans, ${total} plans` : 'View floorplan fullscreen'
	);

	$effect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => (prefersReducedMotion = mq.matches);
		update();
		mq.addEventListener('change', update);
		return () => mq.removeEventListener('change', update);
	});

	// Lock background scroll while the lightbox owns the viewport.
	$effect(() => {
		if (!lightboxOpen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});

	// Preload the neighbouring plan so paging between floors feels instant.
	$effect(() => {
		if (!lightboxOpen || total < 2) return;
		const nextPlan = plans[(activeIndex + 1) % total];
		const url = buildPublicImageUrl(nextPlan.asset, { width: 1500, fit: 'clip', quality: 88 });
		if (url) new Image().src = url;
	});

	function prev() {
		if (total === 0) return;
		activeIndex = (activeIndex - 1 + total) % total;
	}

	function next() {
		if (total === 0) return;
		activeIndex = (activeIndex + 1) % total;
	}

	function openLightbox() {
		if (total === 0) return;
		activeIndex = 0;
		lightboxOpen = true;
		dialogEl?.showModal();
	}

	function closeLightbox() {
		dialogEl?.close();
	}

	function onDialogClose() {
		lightboxOpen = false;
	}

	function onDialogKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			next();
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			prev();
		}
	}

	// Click on the backdrop (outside the figure) closes the lightbox.
	function onSurfaceClick(event: MouseEvent) {
		if (event.target === event.currentTarget) closeLightbox();
	}

	// --- Touch swipe (lightbox) ------------------------------------------
	let pointerStartX = 0;
	let pointerActive = false;

	function onPointerDown(event: PointerEvent) {
		if (event.pointerType !== 'touch') return;
		pointerStartX = event.clientX;
		pointerActive = true;
	}

	function onPointerUp(event: PointerEvent) {
		if (!pointerActive) return;
		pointerActive = false;
		const dx = event.clientX - pointerStartX;
		if (Math.abs(dx) < 40) return;
		if (dx < 0) next();
		else prev();
	}

	function onPointerCancel() {
		pointerActive = false;
	}
</script>

{#snippet chevron(dir: 'left' | 'right')}
	<svg
		class="chevron"
		viewBox="0 0 24 24"
		width="22"
		height="22"
		fill="none"
		stroke="currentColor"
		stroke-width="1.6"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d={dir === 'left' ? 'M15 5 8 12l7 7' : 'M9 5l7 7-7 7'} />
	</svg>
{/snippet}

<section class="floorplan" aria-label="Floorplan">
	<div class="floorplan__head">
		<span class="floorplan__label">Floorplan</span>
		{#if total > 1}
			<span class="floorplan__count tabular-nums">{total} plans</span>
		{/if}
	</div>

	{#if total > 0 && previewSrc}
		<button type="button" class="floorplan__trigger" onclick={openLightbox} aria-label={triggerLabel}>
			<span class="floorplan__frame">
				<img
					class="floorplan__img"
					src={previewSrc}
					srcset={previewSrcset}
					sizes={PREVIEW_SIZES}
					alt={first?.alt ?? `Floorplan, ${title}`}
					loading="lazy"
					decoding="async"
				/>
				<span class="floorplan__expand" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5" />
					</svg>
				</span>
			</span>
			<span class="floorplan__view">
				View floorplan
				<span class="floorplan__arrow" aria-hidden="true">→</span>
			</span>
		</button>
	{:else}
		<div class="floorplan__frame floorplan__frame--empty">
			<span class="floorplan__empty">No floorplan available</span>
		</div>
	{/if}
</section>

{#if total > 0}
	<dialog
		bind:this={dialogEl}
		class="floorplan-lightbox"
		onclose={onDialogClose}
		onkeydown={onDialogKeydown}
		aria-label="Floorplan, fullscreen"
	>
		{#if lightboxOpen && active}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div class="floorplan-lightbox__surface" onclick={onSurfaceClick}>
				<button type="button" class="floorplan-lightbox__close" onclick={closeLightbox} aria-label="Close floorplan">
					<span aria-hidden="true">×</span>
				</button>

				<figure
					class="floorplan-lightbox__figure"
					onpointerdown={onPointerDown}
					onpointerup={onPointerUp}
					onpointercancel={onPointerCancel}
				>
					{#key activeIndex}
						<img
							class="floorplan-lightbox__img"
							src={activeSrc}
							srcset={activeSrcset}
							sizes={LIGHTBOX_SIZES}
							alt={active.alt}
							decoding="async"
							in:fade={{ duration: fadeDuration }}
						/>
					{/key}
				</figure>

				{#if total > 1}
					<span class="floorplan-lightbox__caption">{active.label}</span>
					<button type="button" class="floorplan-lightbox__nav floorplan-lightbox__nav--prev" onclick={prev} aria-label="Previous floor">
						{@render chevron('left')}
					</button>
					<button type="button" class="floorplan-lightbox__nav floorplan-lightbox__nav--next" onclick={next} aria-label="Next floor">
						{@render chevron('right')}
					</button>
					<span class="floorplan-lightbox__counter tabular-nums">{activeIndex + 1} / {total}</span>
				{/if}
			</div>
		{/if}
	</dialog>
{/if}

<style>
	.floorplan {
		padding-block: var(--space-md);
	}

	/* Overline header, matching the Key Facts rhythm directly above it. */
	.floorplan__head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-bottom: 0.85rem;
	}

	.floorplan__label {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.floorplan__count {
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--muted);
	}

	/* --- Trigger (preview) ---------------------------------------------- */
	.floorplan__trigger {
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		background: none;
		text-align: left;
		cursor: zoom-in;
		color: var(--green);
	}

	.floorplan__frame {
		position: relative;
		display: block;
		aspect-ratio: 4 / 3;
		background: var(--white);
		border: 1px solid var(--border);
		overflow: hidden;
		transition: border-color var(--duration-hover) var(--ease);
	}

	.floorplan__img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		/* Breathing room so the plan never butts against the hairline frame. */
		padding: clamp(0.75rem, 2vw, 1.25rem);
	}

	/* Corner affordance: a faint expand glyph at rest, brightening to gold on
	   intent. Always visible (not hover-gated) so touch users get the signal. */
	.floorplan__expand {
		position: absolute;
		top: var(--space-xs);
		right: var(--space-xs);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		color: var(--green);
		background: rgba(255, 255, 255, 0.86);
		border: 1px solid var(--border);
		transition:
			color var(--duration-hover) var(--ease),
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.floorplan__trigger:hover .floorplan__frame,
	.floorplan__trigger:focus-visible .floorplan__frame {
		border-color: var(--green);
	}

	.floorplan__trigger:hover .floorplan__expand,
	.floorplan__trigger:focus-visible .floorplan__expand {
		color: var(--white);
		background: var(--green);
		border-color: var(--green);
	}

	.floorplan__trigger:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 3px;
	}

	/* Caption row reads as the project's standard text-link. */
	.floorplan__view {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.85rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		color: var(--green);
		transition: color var(--duration-hover) var(--ease);
	}

	.floorplan__arrow {
		transition: transform var(--duration-hover) var(--ease);
	}

	.floorplan__trigger:hover .floorplan__view,
	.floorplan__trigger:focus-visible .floorplan__view {
		color: var(--gold);
	}

	.floorplan__trigger:hover .floorplan__arrow,
	.floorplan__trigger:focus-visible .floorplan__arrow {
		transform: translateX(3px);
	}

	/* --- Empty state ---------------------------------------------------- */
	/* No plan to show, so the slot drops the 4:3 reservation and becomes a
	   compact notice. The hairline frame keeps it part of the column system. */
	.floorplan__frame--empty {
		aspect-ratio: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-block: clamp(1.5rem, 4vw, 2.25rem);
		background: none;
		cursor: default;
	}

	.floorplan__empty {
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--muted);
	}

	/* --- Lightbox ------------------------------------------------------- */
	.floorplan-lightbox {
		width: 100vw;
		max-width: 100vw;
		height: 100vh;
		max-height: 100vh;
		margin: 0;
		padding: 0;
		border: 0;
		background: var(--hero-dark);
		color: var(--white);
	}

	.floorplan-lightbox::backdrop {
		background: rgba(14, 20, 16, 0.92);
	}

	.floorplan-lightbox__surface {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(1rem, 4vw, 3.5rem);
	}

	.floorplan-lightbox__figure {
		margin: 0;
		max-width: 100%;
		max-height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	/* White matte guarantees the plan reads on the dark scrim regardless of
	   whether the source has a transparent or white background. */
	.floorplan-lightbox__img {
		max-width: min(100%, 1100px);
		max-height: calc(100vh - 7rem);
		object-fit: contain;
		background: var(--white);
		padding: clamp(1rem, 3vw, 2rem);
		pointer-events: auto;
		touch-action: pan-y;
	}

	.floorplan-lightbox__close {
		position: absolute;
		top: clamp(0.75rem, 2vw, 1.5rem);
		right: clamp(0.75rem, 2vw, 1.5rem);
		width: 2.75rem;
		height: 2.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(245, 241, 232, 0.3);
		background: transparent;
		color: var(--white);
		font-size: 1.75rem;
		line-height: 1;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.floorplan-lightbox__close:hover,
	.floorplan-lightbox__close:focus-visible {
		background: rgba(245, 241, 232, 0.12);
		border-color: var(--gold);
	}

	.floorplan-lightbox__nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(245, 241, 232, 0.3);
		background: rgba(31, 61, 52, 0.6);
		color: var(--white);
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.floorplan-lightbox__nav:hover,
	.floorplan-lightbox__nav:focus-visible {
		background: var(--green);
		border-color: var(--gold);
	}

	.floorplan-lightbox__nav--prev {
		left: clamp(0.5rem, 2vw, 1.5rem);
	}

	.floorplan-lightbox__nav--next {
		right: clamp(0.5rem, 2vw, 1.5rem);
	}

	.floorplan-lightbox__caption {
		position: absolute;
		top: clamp(0.75rem, 2vw, 1.5rem);
		left: 50%;
		transform: translateX(-50%);
		font-family: var(--sans);
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		color: rgba(245, 241, 232, 0.92);
	}

	.floorplan-lightbox__counter {
		position: absolute;
		bottom: clamp(0.75rem, 2vw, 1.5rem);
		left: 50%;
		transform: translateX(-50%);
		font-size: var(--text-small);
		letter-spacing: var(--tracking-wide);
		color: rgba(245, 241, 232, 0.82);
	}

	@media (max-width: 760px) {
		/* Swipe is the gesture on a phone; arrows would cover the plan. */
		.floorplan-lightbox__nav {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.floorplan__frame,
		.floorplan__expand,
		.floorplan__view,
		.floorplan__arrow,
		.floorplan-lightbox__close,
		.floorplan-lightbox__nav {
			transition: none;
		}
	}
</style>
