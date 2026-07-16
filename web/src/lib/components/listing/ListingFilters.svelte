<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { buildListingSearchHref, type ListingSearchParams } from '$lib/listing/searchParams';
	import {
		GOLF_RELEVANCE,
		MIN_BEDS_OPTIONS,
		PROPERTY_TYPES,
		SORT_OPTIONS,
		SORT_VALUES,
		type ListingSort
	} from '$lib/listing/filterOptions';
	import Select from '$lib/components/ui/Select.svelte';
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	import PriceMenu from '$lib/components/ui/PriceMenu.svelte';

	type CommunityOption = { label: string; value: string };
	type CourseOption = { label: string; value: string };
	type FeatureOption = { label: string; value: string };

	type Props = {
		basePath: string;
		searchParams: ListingSearchParams;
		communityOptions?: CommunityOption[];
		/** Golf course/club options. When non-empty, renders the Course filter. */
		courseOptions?: CourseOption[];
		/** Auto-derived feature-highlight options. When non-empty, renders the Features filter. */
		featureOptions?: FeatureOption[];
		/** Whether to show the generic golf-relevance filter (hidden on the frontline page). */
		showGolfRelevance?: boolean;
	};

	let {
		basePath,
		searchParams,
		communityOptions = [],
		courseOptions = [],
		featureOptions = [],
		showGolfRelevance = true
	}: Props = $props();

	let form: HTMLFormElement | undefined;
	let sheet = $state<HTMLDialogElement>();
	// Starts false to match SSR; flips true after mount so the mobile drawer (and the
	// hiding of the no-JS Apply button) only engage once JS is live — no hydration shift.
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	// The "Bedrooms" list already carries its own "Any beds" entry; drop it so the
	// Select's placeholder owns the empty state instead.
	const bedsOptions = MIN_BEDS_OPTIONS.filter((option) => option.value !== '');

	// Local, editable mirror of the applied params. Re-synced whenever navigation lands
	// new searchParams (and when the drawer closes without applying).
	let propertyType = $state('');
	let minBeds = $state('');
	let community = $state('');
	let sort = $state<ListingSort>('newest');
	let minPrice = $state<number | null>(null);
	let maxPrice = $state<number | null>(null);
	let golfRelevance = $state<string[]>([]);
	let golfCourse = $state<string[]>([]);
	let features = $state<string[]>([]);

	// Mobile sheet: the multi-select groups collapse like the single-select rows above them,
	// hidden until opened, mirroring the homepage DiscoveryBar's Features disclosure.
	let golfCourseOpen = $state(false);
	let golfRelevanceOpen = $state(false);
	let featuresOpen = $state(false);

	// Collapsed-disclosure summary for a multi-select group, echoing the select rows'
	// displayed value: the single choice's label, a count when several, else "Any".
	function summarise(selected: string[], options: { label: string; value: string }[]): string {
		if (selected.length === 0) return 'Any';
		if (selected.length === 1) {
			return options.find((option) => option.value === selected[0])?.label ?? '1 selected';
		}
		return `${selected.length} selected`;
	}

	function syncFromParams() {
		propertyType = searchParams.propertyType ?? '';
		minBeds = searchParams.minBeds != null ? String(searchParams.minBeds) : '';
		community = searchParams.community ?? '';
		sort = searchParams.sort;
		minPrice = searchParams.minPrice;
		maxPrice = searchParams.maxPrice;
		golfRelevance = [...searchParams.golfRelevance];
		golfCourse = [...searchParams.golfCourse];
		features = [...searchParams.features];
	}

	$effect(() => {
		// Track every applied field so a navigation re-syncs the editable mirror.
		searchParams.propertyType;
		searchParams.minBeds;
		searchParams.community;
		searchParams.sort;
		searchParams.minPrice;
		searchParams.maxPrice;
		searchParams.golfRelevance;
		searchParams.golfCourse;
		searchParams.features;
		syncFromParams();
	});

	const hasActiveFilters = $derived(
		searchParams.propertyType != null ||
			searchParams.community != null ||
			searchParams.minBeds != null ||
			searchParams.minPrice != null ||
			searchParams.maxPrice != null ||
			searchParams.golfRelevance.length > 0 ||
			searchParams.golfCourse.length > 0 ||
			searchParams.features.length > 0
	);

	// Active-filter count for the mobile trigger badge (sort isn't a filter).
	const activeCount = $derived(
		(searchParams.propertyType ? 1 : 0) +
			(searchParams.minBeds != null ? 1 : 0) +
			(searchParams.community ? 1 : 0) +
			(searchParams.minPrice != null || searchParams.maxPrice != null ? 1 : 0) +
			searchParams.golfRelevance.length +
			searchParams.golfCourse.length +
			searchParams.features.length
	);

	const sortLabel = $derived(
		SORT_OPTIONS.find((option) => option.value === searchParams.sort)?.label ?? 'Newest'
	);

	function nextParams(): ListingSearchParams {
		return {
			page: 1, // any filter change returns to the first page
			sort: (SORT_VALUES as readonly string[]).includes(sort) ? sort : 'newest',
			propertyType: (propertyType || null) as ListingSearchParams['propertyType'],
			minPrice: minPrice ?? null,
			maxPrice: maxPrice ?? null,
			minBeds: minBeds ? Number(minBeds) : null,
			community: community || null,
			golfRelevance: [...golfRelevance] as ListingSearchParams['golfRelevance'],
			golfCourse: [...golfCourse],
			features: [...features]
		};
	}

	/** JS path: build a clean href from local state and SPA-navigate. */
	function applyNow() {
		if (!browser) return;
		goto(buildListingSearchHref(basePath, nextParams()), { noScroll: true, keepFocus: true });
	}

	function onSubmit(event: SubmitEvent) {
		if (!browser) return; // no-JS: let the native GET form submit
		event.preventDefault();
		applyNow();
	}

	function openSheet() {
		// Start every group collapsed so the sheet opens as a calm, scannable list.
		golfCourseOpen = false;
		golfRelevanceOpen = false;
		featuresOpen = false;
		sheet?.showModal();
	}

	function closeSheet() {
		sheet?.close();
	}

	function applyFromSheet() {
		closeSheet();
		applyNow();
	}

	function clearAll() {
		closeSheet();
		if (browser) goto(basePath, { noScroll: true, keepFocus: true });
	}
</script>

<form
	class="lf"
	class:lf--ready={mounted}
	method="GET"
	action={basePath}
	bind:this={form}
	onsubmit={onSubmit}
	aria-label="Filter and sort properties"
>
	<!-- ===== Desktop bar / no-JS fallback ===== -->
	<div class="filter-bar">
		<!-- Core single-select narrowers share one tray, in the homepage design language. -->
		<div class="filter-bar__tray fc-tray">
			<PriceMenu bind:minPrice bind:maxPrice onchange={applyNow} />
			<Select
				variant="tray"
				label="Property type"
				placeholder="Any type"
				name="propertyType"
				options={[...PROPERTY_TYPES]}
				bind:value={propertyType}
				onchange={applyNow}
			/>
			<Select
				variant="tray"
				label="Bedrooms"
				placeholder="Any beds"
				name="minBeds"
				options={[...bedsOptions]}
				bind:value={minBeds}
				onchange={applyNow}
			/>
			{#if communityOptions.length > 0}
				<Select
					variant="tray"
					label="Community"
					placeholder="All communities"
					name="community"
					options={communityOptions}
					bind:value={community}
					onchange={applyNow}
				/>
			{/if}

			<!-- Golf is still a filter, so it shares the tray as a matching cell. -->
			{#if courseOptions.length > 0}
				<MultiSelect
					variant="tray"
					label="Golf course"
					name="golfCourse"
					options={courseOptions}
					bind:value={golfCourse}
					onchange={applyNow}
				/>
			{/if}
			{#if showGolfRelevance}
				<MultiSelect
					variant="tray"
					label="Golf"
					name="golfRelevance"
					options={[...GOLF_RELEVANCE]}
					bind:value={golfRelevance}
					onchange={applyNow}
				/>
			{/if}

			<!-- Standout feature highlights (auto-derived from live listings). -->
			{#if featureOptions.length > 0}
				<MultiSelect
					variant="tray"
					label="Features"
					name="features"
					options={featureOptions}
					bind:value={features}
					onchange={applyNow}
				/>
			{/if}
		</div>

		<!-- Reorder + reset live apart from the filters (Sort changes order, not the set). -->
		<div class="filter-bar__sort">
			{#if hasActiveFilters}
				<a class="filter-bar__reset" href={basePath}>Clear all</a>
			{/if}
			<Select
				variant="pill"
				align="end"
				label="Sort"
				name="sort"
				options={[...SORT_OPTIONS]}
				activeWhenSet={false}
				bind:value={sort}
				onchange={applyNow}
			/>
		</div>

		<!-- No-JS submit: hidden once JS auto-apply is live. -->
		<button class="fc-apply filter-bar__submit" type="submit" class:is-hidden={mounted}>
			Apply filters
		</button>
	</div>

	<!-- ===== Mobile trigger (JS only) ===== -->
	<button class="lf-trigger" type="button" onclick={openSheet} aria-haspopup="dialog">
		<span class="lf-trigger__icon" aria-hidden="true">
			<svg viewBox="0 0 20 20" fill="none">
				<path d="M2 5h16M5 10h10M8 15h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
			</svg>
		</span>
		<span class="lf-trigger__label">Filter &amp; sort</span>
		{#if activeCount > 0}<span class="lf-trigger__badge">{activeCount}</span>{/if}
		<span class="lf-trigger__meta">{sortLabel}</span>
		<span class="lf-trigger__chev" aria-hidden="true"></span>
	</button>
</form>

<!-- ===== Mobile sheet (JS only) ===== -->
<dialog
	class="lf-sheet"
	bind:this={sheet}
	onclose={syncFromParams}
	aria-label="Filter and sort properties"
>
	<div class="lf-sheet__head">
		<p class="lf-sheet__title">Filter &amp; sort</p>
		<button class="lf-sheet__close" type="button" onclick={closeSheet} aria-label="Close">
			<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
				<path d="M4 4l12 12M16 4 4 16" stroke="currentColor" stroke-width="1.5" />
			</svg>
		</button>
	</div>

	<div class="lf-sheet__body">
		<div class="lf-row">
			<span class="lf-row__label" id="lf-price-label">Price</span>
			<div class="lf-price" role="group" aria-labelledby="lf-price-label">
				<input
					type="number"
					inputmode="numeric"
					min="0"
					step="50000"
					placeholder="No min"
					aria-label="Minimum price"
					bind:value={minPrice}
				/>
				<span aria-hidden="true">–</span>
				<input
					type="number"
					inputmode="numeric"
					min="0"
					step="50000"
					placeholder="No max"
					aria-label="Maximum price"
					bind:value={maxPrice}
				/>
			</div>
		</div>

		<label class="lf-row">
			<span class="lf-row__label">Property type</span>
			<select class="lf-select" class:is-empty={!propertyType} bind:value={propertyType}>
				<option value="">Any type</option>
				{#each PROPERTY_TYPES as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</label>

		<label class="lf-row">
			<span class="lf-row__label">Bedrooms</span>
			<select class="lf-select" class:is-empty={!minBeds} bind:value={minBeds}>
				<option value="">Any beds</option>
				{#each bedsOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</label>

		{#if communityOptions.length > 0}
			<label class="lf-row">
				<span class="lf-row__label">Community</span>
				<select class="lf-select" class:is-empty={!community} bind:value={community}>
					<option value="">All communities</option>
					{#each communityOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>
		{/if}

		<!-- Multi-select groups collapse like the select rows above: hidden by default,
		     revealed on tap, options laid out two-up. Mirrors the homepage DiscoveryBar. -->
		{#if courseOptions.length > 0}
			<div class="lf-disclosure-row">
				<button
					type="button"
					class="lf-disclosure"
					aria-expanded={golfCourseOpen}
					aria-controls="lf-golf-course-panel"
					onclick={() => (golfCourseOpen = !golfCourseOpen)}
				>
					<span class="lf-row__label">Golf course</span>
					<span class="lf-disclosure__value" class:is-empty={golfCourse.length === 0}>
						{summarise(golfCourse, courseOptions)}
					</span>
					<span class="lf-disclosure__chev" class:is-open={golfCourseOpen} aria-hidden="true">
						<svg viewBox="0 0 14 9" fill="none">
							<path d="M1 1.5 7 7l6-5.5" stroke="currentColor" stroke-width="1.5" />
						</svg>
					</span>
				</button>
				{#if golfCourseOpen}
					<fieldset id="lf-golf-course-panel" class="lf-checks">
						<legend class="sr-only">Golf course</legend>
						{#each courseOptions as option (option.value)}
							<label class="lf-check">
								<input type="checkbox" bind:group={golfCourse} value={option.value} />
								<span>{option.label}</span>
							</label>
						{/each}
					</fieldset>
				{/if}
			</div>
		{/if}

		{#if showGolfRelevance}
			<div class="lf-disclosure-row">
				<button
					type="button"
					class="lf-disclosure"
					aria-expanded={golfRelevanceOpen}
					aria-controls="lf-golf-panel"
					onclick={() => (golfRelevanceOpen = !golfRelevanceOpen)}
				>
					<span class="lf-row__label">Golf</span>
					<span class="lf-disclosure__value" class:is-empty={golfRelevance.length === 0}>
						{summarise(golfRelevance, [...GOLF_RELEVANCE])}
					</span>
					<span class="lf-disclosure__chev" class:is-open={golfRelevanceOpen} aria-hidden="true">
						<svg viewBox="0 0 14 9" fill="none">
							<path d="M1 1.5 7 7l6-5.5" stroke="currentColor" stroke-width="1.5" />
						</svg>
					</span>
				</button>
				{#if golfRelevanceOpen}
					<fieldset id="lf-golf-panel" class="lf-checks">
						<legend class="sr-only">Golf</legend>
						{#each GOLF_RELEVANCE as option (option.value)}
							<label class="lf-check">
								<input type="checkbox" bind:group={golfRelevance} value={option.value} />
								<span>{option.label}</span>
							</label>
						{/each}
					</fieldset>
				{/if}
			</div>
		{/if}

		{#if featureOptions.length > 0}
			<div class="lf-disclosure-row">
				<button
					type="button"
					class="lf-disclosure"
					aria-expanded={featuresOpen}
					aria-controls="lf-features-panel"
					onclick={() => (featuresOpen = !featuresOpen)}
				>
					<span class="lf-row__label">Features</span>
					<span class="lf-disclosure__value" class:is-empty={features.length === 0}>
						{summarise(features, featureOptions)}
					</span>
					<span class="lf-disclosure__chev" class:is-open={featuresOpen} aria-hidden="true">
						<svg viewBox="0 0 14 9" fill="none">
							<path d="M1 1.5 7 7l6-5.5" stroke="currentColor" stroke-width="1.5" />
						</svg>
					</span>
				</button>
				{#if featuresOpen}
					<fieldset id="lf-features-panel" class="lf-checks">
						<legend class="sr-only">Features</legend>
						{#each featureOptions as option (option.value)}
							<label class="lf-check">
								<input type="checkbox" bind:group={features} value={option.value} />
								<span>{option.label}</span>
							</label>
						{/each}
					</fieldset>
				{/if}
			</div>
		{/if}

		<label class="lf-row lf-row--sort">
			<span class="lf-row__label">Sort by</span>
			<select class="lf-select" bind:value={sort}>
				{#each SORT_OPTIONS as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</label>
	</div>

	<div class="lf-sheet__foot">
		{#if hasActiveFilters}
			<button class="lf-clear" type="button" onclick={clearAll}>Clear all</button>
		{/if}
		<button class="lf-apply" type="button" onclick={applyFromSheet}>
			<span>Show properties</span>
			<svg viewBox="0 0 26 12" fill="none" aria-hidden="true">
				<path d="M0 6h23M19 1.5 24 6l-5 4.5" stroke="currentColor" stroke-width="1.5" />
			</svg>
		</button>
	</div>
</dialog>

<style>
	.filter-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm) var(--space-md);
		padding-block: var(--space-md);
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
	}

	/* The tray takes the lead width; sort + clear flow to the right and wrap underneath. */
	.filter-bar__tray {
		flex: 1 1 34rem;
	}

	.filter-bar__sort {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-left: auto;
	}

	.filter-bar__reset {
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--green);
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition: border-color var(--duration-hover) var(--ease);
	}

	.filter-bar__reset:hover,
	.filter-bar__reset:focus-visible {
		border-color: var(--gold);
	}

	.filter-bar__submit {
		flex: none;
	}

	.filter-bar__submit.is-hidden {
		display: none;
	}

	/* ===================== MOBILE TRIGGER ===================== */
	.lf-trigger {
		display: none;
		width: 100%;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.125rem;
		border: 1px solid var(--green);
		background: var(--white);
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		cursor: pointer;
		text-align: left;
	}

	.lf-trigger__icon {
		flex: none;
		display: flex;
	}

	.lf-trigger__icon svg {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* Editorial serif (with Playfair's handsome ampersand), echoing the homepage
	   trigger summary — reads considered, not like a generic app control. */
	.lf-trigger__label {
		font-family: var(--serif);
		font-weight: 400;
		font-size: 1.125rem;
		letter-spacing: 0;
	}

	.lf-trigger__badge {
		flex: none;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.35rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--green);
		color: var(--on-green);
		font-size: var(--text-small);
		font-weight: 500;
	}

	.lf-trigger__meta {
		margin-left: auto;
		color: var(--muted);
		font-family: var(--serif);
		font-style: italic;
		font-size: 1rem;
	}

	.lf-trigger__chev {
		flex: none;
		width: 0.5rem;
		height: 0.5rem;
		border-right: 1.5px solid var(--muted);
		border-bottom: 1.5px solid var(--muted);
		transform: translateY(-1px) rotate(45deg);
	}

	.lf-trigger:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 2px;
	}

	/* ===================== MOBILE SHEET ===================== */
	.lf-sheet {
		width: 100%;
		max-width: 34rem;
		max-height: 90vh;
		/* dvh accounts for the iOS Safari toolbar; falls back to vh on older engines. */
		max-height: 88dvh;
		margin: auto auto 0;
		padding: 0;
		border: 0;
		border-top: 2px solid var(--gold);
		background: var(--white);
		color: var(--charcoal);
		/* Flex column so the body scrolls between a fixed head and a sticky foot. */
		flex-direction: column;
	}

	.lf-sheet[open] {
		display: flex;
	}

	.lf-sheet::backdrop {
		background: oklch(0.18 0.02 165 / 0.55);
	}

	.lf-sheet__head {
		flex: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.25rem 0.75rem;
	}

	.lf-sheet__title {
		margin: 0;
		font-family: var(--serif);
		font-style: italic;
		font-size: 1.375rem;
		color: var(--green);
	}

	.lf-sheet__close {
		flex: none;
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--border);
		background: transparent;
		color: var(--charcoal);
		cursor: pointer;
	}

	.lf-sheet__close svg {
		width: 1.1rem;
		height: 1.1rem;
	}

	.lf-sheet__close:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 2px;
	}

	.lf-sheet__body {
		/* flex-basis: auto (not the 0% in `flex: 1`) so the body keeps its content height
		   when the dialog is content-sized — iOS Safari collapses a 0%-basis child to 0.
		   min-height: 0 still lets it shrink + scroll when content exceeds the cap. */
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0 1.25rem;
	}

	.lf-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin: 0;
		padding: 1rem 0;
		border-top: 1px solid var(--border);
	}

	.lf-sheet__body > .lf-row:first-child,
	.lf-sheet__body > .lf-disclosure-row:first-child {
		border-top: 0;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.lf-row__label {
		font-family: var(--sans);
		font-weight: 500;
		font-size: 0.6875rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
		flex: none;
	}

	/* Native selects in the sheet: editorial serif value, right-aligned (rtl pins the
	   value to the right reliably on iOS; options reset to ltr). Mirrors the home sheet. */
	.lf-select {
		flex: 1;
		min-width: 0;
		appearance: none;
		margin: 0;
		padding: 0 1.3em 0 0;
		border: 0;
		background: transparent;
		font-family: var(--serif);
		font-size: 1.1875rem;
		color: var(--charcoal);
		text-align: right;
		direction: rtl;
		cursor: pointer;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9' fill='none'%3E%3Cpath d='M1 1.5 7 7l6-5.5' stroke='%236B6B6B' stroke-width='1.5'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0 center;
		background-size: 0.6em auto;
	}

	.lf-select option {
		direction: ltr;
	}

	.lf-select.is-empty {
		font-style: italic;
		color: var(--muted);
	}

	.lf-select:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 3px;
	}

	.lf-price {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--muted);
	}

	.lf-price input {
		width: 6.5rem;
		padding: 0.4rem 0;
		border: 0;
		border-bottom: 1px solid var(--border);
		background: transparent;
		color: var(--charcoal);
		font-family: var(--sans);
		font-size: var(--text-ui);
		text-align: right;
	}

	.lf-price input:focus {
		outline: 0;
		border-color: var(--green);
	}

	/* Each multi-select group is a disclosure: a header row (label + value + chevron, matching
	   the select rows) over a checkbox grid that renders only when opened. The wrapper carries
	   the row divider so a closed group is indistinguishable from the select rows above it. */
	.lf-disclosure-row {
		border-top: 1px solid var(--border);
	}

	.lf-disclosure {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		padding: 1rem 0;
		border: 0;
		background: transparent;
		cursor: pointer;
		text-align: left;
	}

	.lf-disclosure:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 3px;
	}

	/* Current value, right-aligned before the chevron — the multi-select echo of the native
	   selects' displayed value. Italic-muted when nothing is chosen, like .lf-select.is-empty. */
	.lf-disclosure__value {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		text-align: right;
		font-family: var(--serif);
		font-size: 1.1875rem;
		color: var(--charcoal);
	}

	.lf-disclosure__value.is-empty {
		font-style: italic;
		color: var(--muted);
	}

	.lf-disclosure__chev {
		flex: none;
		display: flex;
		align-items: center;
		color: var(--muted);
		transition: transform var(--duration-hover) var(--ease);
	}

	.lf-disclosure__chev svg {
		width: 0.75rem;
		height: auto;
	}

	.lf-disclosure__chev.is-open {
		transform: rotate(180deg);
	}

	/* Options two-up, reflowing with the sheet width, matching the DiscoveryBar. Resets the
	   fieldset's UA chrome; the header above already carries the row padding. */
	.lf-checks {
		margin: 0;
		padding: 0 0 1rem;
		border: 0;
		min-inline-size: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
		gap: 0 1.25rem;
	}

	.lf-check {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		/* 44px min row keeps each option a comfortable touch target and puts the columns'
		   rows on a shared baseline. */
		min-height: 2.75rem;
		font-family: var(--sans);
		font-size: var(--text-body);
		color: var(--charcoal);
		cursor: pointer;
	}

	.lf-check input {
		flex: none;
		width: 1.1rem;
		height: 1.1rem;
		accent-color: var(--green);
	}

	.lf-row--sort {
		border-top-width: 1px;
	}

	.lf-sheet__foot {
		flex: none;
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: 1rem 1.25rem 1.5rem;
		border-top: 1px solid var(--border);
	}

	.lf-clear {
		flex: none;
		padding: 0.5rem 0;
		border: 0;
		background: transparent;
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		border-bottom: 1px solid transparent;
		cursor: pointer;
	}

	.lf-clear:hover,
	.lf-clear:focus-visible {
		border-color: var(--gold);
	}

	.lf-apply {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		min-height: 3.25rem;
		border: 1px solid var(--green);
		background: var(--green);
		color: var(--on-green);
		font-family: var(--sans);
		font-weight: 500;
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		cursor: pointer;
		transition: background-color var(--duration-hover) var(--ease);
	}

	.lf-apply svg {
		width: 1.5rem;
		height: 0.75rem;
	}

	.lf-apply:hover,
	.lf-apply:focus-visible {
		background: var(--charcoal);
		border-color: var(--charcoal);
	}

	/* ===================== RESPONSIVE SWAP ===================== */
	/* Below 60rem the inline tray gets cramped, so JS users get the trigger + drawer.
	   Without JS (no .lf--ready) the inline bar stays, collapsing to a 2-col grid as a
	   functional fallback. */
	@media (max-width: 60rem) {
		.filter-bar__tray {
			flex-basis: 100%;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1px;
			background: var(--border);
		}

		.filter-bar__tray > :global(.fc-field) {
			border-right: 0;
			background: var(--white);
		}

		.filter-bar__tray > :global(.fc-field--multi) {
			grid-column: 1 / -1;
		}

		.filter-bar__sort {
			margin-left: 0;
			width: 100%;
			justify-content: space-between;
		}

		.lf--ready .filter-bar {
			display: none;
		}

		.lf--ready .lf-trigger {
			display: flex;
		}
	}

	/* ===================== MOTION ===================== */
	@media (prefers-reduced-motion: no-preference) {
		.lf-sheet[open] {
			animation: lf-sheet-rise 0.34s var(--ease);
		}

		.lf-sheet[open]::backdrop {
			animation: lf-backdrop-fade 0.34s var(--ease);
		}

		/* Each group's grid unfolds rather than snapping in when its disclosure opens. */
		.lf-checks {
			animation: lf-unfold 0.24s var(--ease);
		}

		@keyframes lf-unfold {
			from {
				opacity: 0;
				transform: translateY(-4px);
			}
		}

		@keyframes lf-sheet-rise {
			from {
				transform: translateY(100%);
			}
		}

		@keyframes lf-backdrop-fade {
			from {
				opacity: 0;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.filter-bar__reset,
		.lf-apply {
			transition: none;
		}
	}
</style>
