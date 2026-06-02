<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import {
		buildListingSearchHref,
		parseListingSearchParams,
		type ListingSearchParams
	} from '$lib/listing/searchParams';
	import {
		GOLF_RELEVANCE,
		MIN_BEDS_OPTIONS,
		PROPERTY_TYPES,
		SORT_OPTIONS
	} from '$lib/listing/filterOptions';

	type CommunityOption = { label: string; value: string };

	type Props = {
		basePath: string;
		searchParams: ListingSearchParams;
		communityOptions?: CommunityOption[];
	};

	let { basePath, searchParams, communityOptions = [] }: Props = $props();

	let form: HTMLFormElement | undefined;
	// Starts false to match SSR; flips true after mount so per-menu Apply buttons
	// can be hidden only once auto-apply is wired up (no hydration mismatch).
	let enhanced = $state(false);
	onMount(() => {
		enhanced = true;
	});

	const propertyTypeLabel = $derived(
		PROPERTY_TYPES.find((option) => option.value === searchParams.propertyType)?.label ?? null
	);
	const communityLabel = $derived(
		communityOptions.find((option) => option.value === searchParams.community)?.label ?? null
	);
	const bedsLabel = $derived(searchParams.minBeds ? `${searchParams.minBeds}+ beds` : null);
	const priceLabel = $derived(formatPriceRange(searchParams.minPrice, searchParams.maxPrice));
	const golfLabel = $derived(formatGolfLabel(searchParams.golfRelevance));
	const sortLabel = $derived(
		SORT_OPTIONS.find((option) => option.value === searchParams.sort)?.label ?? 'Newest'
	);

	const hasActiveFilters = $derived(
		searchParams.propertyType != null ||
			searchParams.community != null ||
			searchParams.minBeds != null ||
			searchParams.minPrice != null ||
			searchParams.maxPrice != null ||
			searchParams.golfRelevance.length > 0
	);

	function formatPriceShort(value: number): string {
		if (value >= 1_000_000) {
			const millions = value / 1_000_000;
			const text = millions % 1 === 0 ? String(millions) : millions.toFixed(2).replace(/0+$/, '');
			return `€${text}M`;
		}
		if (value >= 1000) return `€${Math.round(value / 1000)}k`;
		return `€${value}`;
	}

	function formatPriceRange(min: number | null, max: number | null): string | null {
		if (min != null && max != null) return `${formatPriceShort(min)}–${formatPriceShort(max)}`;
		if (min != null) return `${formatPriceShort(min)}+`;
		if (max != null) return `Up to ${formatPriceShort(max)}`;
		return null;
	}

	function formatGolfLabel(values: string[]): string | null {
		if (values.length === 0) return null;
		if (values.length === 1) {
			return GOLF_RELEVANCE.find((option) => option.value === values[0])?.label ?? null;
		}
		return `Golf (${values.length})`;
	}

	/** Progressive enhancement: derive clean params from the live form and SPA-navigate. */
	function submitForm() {
		if (!browser || !form) return;
		const usp = new URLSearchParams();
		for (const [key, value] of new FormData(form)) {
			if (typeof value === 'string' && value !== '') usp.append(key, value);
		}
		const url = new URL(`${basePath}?${usp.toString()}`, window.location.origin);
		const next = parseListingSearchParams(url);
		next.page = 1; // any filter change returns to the first page
		closeAll();
		goto(buildListingSearchHref(basePath, next), { noScroll: true, keepFocus: true });
	}

	function onSubmit(event: SubmitEvent) {
		if (!browser) return; // no-JS: let the native GET form submit
		event.preventDefault();
		submitForm();
	}

	function onControlChange() {
		// Auto-apply on selection once JS is available.
		submitForm();
	}

	function closeAll(except?: EventTarget | null) {
		if (!form) return;
		for (const node of form.querySelectorAll<HTMLDetailsElement>('details[open]')) {
			if (node !== except) node.open = false;
		}
	}

	/** Keep one menu open at a time. */
	function onToggle(event: Event) {
		const node = event.currentTarget as HTMLDetailsElement;
		if (node.open) closeAll(node);
	}

	function onWindowPointerDown(event: PointerEvent) {
		if (!form) return;
		if (!form.contains(event.target as Node)) closeAll();
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') closeAll();
	}
</script>

<svelte:window onpointerdown={onWindowPointerDown} onkeydown={onWindowKeydown} />

<form
	class="filter-bar"
	class:filter-bar--enhanced={enhanced}
	method="GET"
	action={basePath}
	bind:this={form}
	onsubmit={onSubmit}
	aria-label="Filter and sort properties"
>
	<div class="filter-bar__group">
		<details class="pill" class:pill--active={priceLabel} ontoggle={onToggle}>
			<summary class="pill__trigger">
				<span class="pill__label">Price</span>
				{#if priceLabel}<span class="pill__value">{priceLabel}</span>{/if}
				<span class="pill__chevron" aria-hidden="true"></span>
			</summary>
			<div class="pill__menu pill__menu--wide">
				<div class="price-fields">
					<label class="price-field">
						<span>Min</span>
						<input
							type="number"
							name="minPrice"
							min="0"
							step="50000"
							inputmode="numeric"
							value={searchParams.minPrice ?? ''}
							placeholder="No min"
						/>
					</label>
					<label class="price-field">
						<span>Max</span>
						<input
							type="number"
							name="maxPrice"
							min="0"
							step="50000"
							inputmode="numeric"
							value={searchParams.maxPrice ?? ''}
							placeholder="No max"
						/>
					</label>
				</div>
				<button class="pill__apply" type="submit">Apply price</button>
			</div>
		</details>

		<details class="pill" class:pill--active={propertyTypeLabel} ontoggle={onToggle}>
			<summary class="pill__trigger">
				<span class="pill__label">Property type</span>
				{#if propertyTypeLabel}<span class="pill__value">{propertyTypeLabel}</span>{/if}
				<span class="pill__chevron" aria-hidden="true"></span>
			</summary>
			<fieldset class="pill__menu option-list" data-auto>
				<legend class="sr-only">Property type</legend>
				<label class="option">
					<input
						type="radio"
						name="propertyType"
						value=""
						checked={searchParams.propertyType == null}
						onchange={onControlChange}
					/>
					<span>Any type</span>
				</label>
				{#each PROPERTY_TYPES as option (option.value)}
					<label class="option">
						<input
							type="radio"
							name="propertyType"
							value={option.value}
							checked={searchParams.propertyType === option.value}
							onchange={onControlChange}
						/>
						<span>{option.label}</span>
					</label>
				{/each}
				<button class="pill__apply" type="submit">Apply</button>
			</fieldset>
		</details>

		<details class="pill" class:pill--active={bedsLabel} ontoggle={onToggle}>
			<summary class="pill__trigger">
				<span class="pill__label">Bedrooms</span>
				{#if bedsLabel}<span class="pill__value">{bedsLabel}</span>{/if}
				<span class="pill__chevron" aria-hidden="true"></span>
			</summary>
			<fieldset class="pill__menu option-list" data-auto>
				<legend class="sr-only">Minimum bedrooms</legend>
				{#each MIN_BEDS_OPTIONS as option (option.value)}
					<label class="option">
						<input
							type="radio"
							name="minBeds"
							value={option.value}
							checked={String(searchParams.minBeds ?? '') === option.value}
							onchange={onControlChange}
						/>
						<span>{option.label}</span>
					</label>
				{/each}
				<button class="pill__apply" type="submit">Apply</button>
			</fieldset>
		</details>

		{#if communityOptions.length > 0}
			<details class="pill" class:pill--active={communityLabel} ontoggle={onToggle}>
				<summary class="pill__trigger">
					<span class="pill__label">Community</span>
					{#if communityLabel}<span class="pill__value">{communityLabel}</span>{/if}
					<span class="pill__chevron" aria-hidden="true"></span>
				</summary>
				<fieldset class="pill__menu option-list option-list--scroll" data-auto>
					<legend class="sr-only">Community</legend>
					<label class="option">
						<input
							type="radio"
							name="community"
							value=""
							checked={searchParams.community == null}
							onchange={onControlChange}
						/>
						<span>All communities</span>
					</label>
					{#each communityOptions as option (option.value)}
						<label class="option">
							<input
								type="radio"
								name="community"
								value={option.value}
								checked={searchParams.community === option.value}
								onchange={onControlChange}
							/>
							<span>{option.label}</span>
						</label>
					{/each}
					<button class="pill__apply" type="submit">Apply</button>
				</fieldset>
			</details>
		{/if}

		<details class="pill" class:pill--active={golfLabel} ontoggle={onToggle}>
			<summary class="pill__trigger">
				<span class="pill__label">Golf</span>
				{#if golfLabel}<span class="pill__value">{golfLabel}</span>{/if}
				<span class="pill__chevron" aria-hidden="true"></span>
			</summary>
			<fieldset class="pill__menu option-list">
				<legend class="sr-only">Golf relevance</legend>
				{#each GOLF_RELEVANCE as option (option.value)}
					<label class="option">
						<input
							type="checkbox"
							name="golfRelevance"
							value={option.value}
							checked={searchParams.golfRelevance.includes(option.value)}
						/>
						<span>{option.label}</span>
					</label>
				{/each}
				<button class="pill__apply" type="submit">Apply</button>
			</fieldset>
		</details>
	</div>

	<div class="filter-bar__sort">
		{#if hasActiveFilters}
			<a class="filter-bar__reset" href={basePath}>Clear all</a>
		{/if}
		<details class="pill pill--sort" ontoggle={onToggle}>
			<summary class="pill__trigger">
				<span class="pill__label">Sort</span>
				<span class="pill__value">{sortLabel}</span>
				<span class="pill__chevron" aria-hidden="true"></span>
			</summary>
			<fieldset class="pill__menu pill__menu--right option-list" data-auto>
				<legend class="sr-only">Sort by</legend>
				{#each SORT_OPTIONS as option (option.value)}
					<label class="option">
						<input
							type="radio"
							name="sort"
							value={option.value}
							checked={searchParams.sort === option.value}
							onchange={onControlChange}
						/>
						<span>{option.label}</span>
					</label>
				{/each}
				<button class="pill__apply" type="submit">Apply</button>
			</fieldset>
		</details>
	</div>
</form>

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

	.filter-bar__group {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs) var(--space-sm);
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

	/* --- Pill + dropdown --- */
	.pill {
		position: relative;
	}

	.pill__trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.5ch;
		min-height: 2.75rem;
		padding: 0.5rem 0.875rem;
		border: 1px solid var(--border);
		background: var(--white);
		color: var(--charcoal);
		font-family: var(--sans);
		font-size: var(--text-ui);
		white-space: nowrap;
		cursor: pointer;
		list-style: none;
		user-select: none;
		transition: border-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.pill__trigger::-webkit-details-marker {
		display: none;
	}

	.pill__trigger:hover,
	.pill__trigger:focus-visible {
		border-color: var(--green);
		color: var(--green);
	}

	.pill[open] > .pill__trigger {
		border-color: var(--green);
		color: var(--green);
	}

	.pill--active > .pill__trigger {
		border-color: var(--green);
		color: var(--green);
	}

	.pill__value {
		color: var(--green);
		font-weight: 500;
	}

	.pill--active > .pill__trigger .pill__label {
		color: var(--muted);
	}

	.pill__chevron {
		width: 0.5rem;
		height: 0.5rem;
		margin-left: 0.25rem;
		border-right: 1px solid currentColor;
		border-bottom: 1px solid currentColor;
		transform: translateY(-1px) rotate(45deg);
		transition: transform var(--duration-hover) var(--ease);
	}

	.pill[open] > .pill__trigger .pill__chevron {
		transform: translateY(2px) rotate(225deg);
	}

	.pill__menu {
		position: absolute;
		top: calc(100% + 0.375rem);
		left: 0;
		/* Sits above the results grid below; semantic dropdown layer. */
		z-index: 50;
		display: grid;
		gap: var(--space-xs);
		min-width: 12rem;
		max-width: min(20rem, 90vw);
		margin: 0;
		padding: var(--space-sm);
		border: 1px solid var(--green);
		background: var(--white);
		box-shadow: 0 16px 40px -24px rgba(31, 61, 52, 0.45);
	}

	.pill__menu--right {
		left: auto;
		right: 0;
	}

	.pill__menu--wide {
		min-width: 16rem;
	}

	/* Fieldsets carry the menu chrome via .pill__menu; strip their intrinsic width floor. */
	fieldset.pill__menu {
		min-inline-size: 0;
	}

	.option-list--scroll {
		max-height: 16rem;
		overflow-y: auto;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.4375rem 0.375rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--charcoal);
		cursor: pointer;
	}

	.option:hover {
		color: var(--green);
	}

	.option input {
		accent-color: var(--green);
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.price-fields {
		display: flex;
		gap: var(--space-sm);
	}

	.price-field {
		display: grid;
		gap: var(--space-xs);
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--muted);
	}

	.price-field input {
		width: 100%;
		padding: 0.5rem 0;
		border: 0;
		border-bottom: 1px solid var(--border);
		background: transparent;
		color: var(--charcoal);
		font: inherit;
		font-size: var(--text-ui);
	}

	.price-field input:focus {
		outline: 0;
		border-color: var(--green);
	}

	.pill__apply {
		margin-top: var(--space-xs);
		padding: 0.625rem 1rem;
		border: 1px solid var(--green);
		background: var(--green);
		color: var(--on-green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		cursor: pointer;
		transition: background-color var(--duration-hover) var(--ease);
	}

	.pill__apply:hover,
	.pill__apply:focus-visible {
		background: var(--charcoal);
		border-color: var(--charcoal);
	}

	/* Single-select menus auto-apply on change once enhanced, so their Apply button
	   is redundant. Price (range) and Golf (multi) keep theirs. The button stays in
	   the no-JS DOM as the submit affordance. */
	.filter-bar--enhanced [data-auto] .pill__apply {
		display: none;
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

	@media (max-width: 760px) {
		.filter-bar__sort {
			margin-left: 0;
			width: 100%;
			justify-content: space-between;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pill__trigger,
		.pill__chevron,
		.filter-bar__reset,
		.pill__apply {
			transition: none;
		}
	}
</style>
