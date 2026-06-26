<script lang="ts">
	import { goto } from '$app/navigation';
	import { PROPERTY_TYPES } from '$lib/listing/filterOptions';
	import {
		DEFAULT_LISTING_SEARCH_PARAMS,
		serializeListingSearchParams
	} from '$lib/listing/searchParams';
	import Select from '$lib/components/ui/Select.svelte';

	type CountryOption = {
		_id: string;
		name: string;
		slug: string;
		flagUrl?: string | null;
	};

	type LocationOption = {
		_id: string;
		name: string;
		slug: string;
		countrySlug: string;
	};

	type CommunityOption = {
		_id: string;
		name: string;
		slug: string;
		locationSlug: string;
		countrySlug: string;
	};

	type Props = {
		countries: CountryOption[];
		locations: LocationOption[];
		communities: CommunityOption[];
	};

	let { countries, locations, communities }: Props = $props();

	/* Budget bands. Each band emits the listing-search price params the destination
	   location page already understands (minPrice / maxPrice); the band is just a
	   friendlier surface than two number inputs. €, since the portfolio is ES + PT. */
	const BUDGET_BANDS = [
		{ value: 'b1', label: 'Up to €500k', min: null, max: 500_000 },
		{ value: 'b2', label: '€500k – €1M', min: 500_000, max: 1_000_000 },
		{ value: 'b3', label: '€1M – €2M', min: 1_000_000, max: 2_000_000 },
		{ value: 'b4', label: '€2M – €5M', min: 2_000_000, max: 5_000_000 },
		{ value: 'b5', label: '€5M+', min: 5_000_000, max: null }
	] as const;

	/* Spain is the larger, lead portfolio, so it's the default selection; fall back to the
	   first country if Spain isn't in the dataset (e.g. a future market reshuffle). */
	const initialCountrySlug = $derived(
		countries.find((country) => country.slug === 'spain')?.slug ?? countries[0]?.slug ?? ''
	);

	let countrySlug = $state('');
	let locationSlug = $state('');
	let communitySlug = $state('');
	let propertyType = $state('');
	let budget = $state('');

	let sheet = $state<HTMLDialogElement>();

	$effect(() => {
		if (!countrySlug && initialCountrySlug) {
			countrySlug = initialCountrySlug;
		}
	});

	const selectedCountry = $derived(countries.find((country) => country.slug === countrySlug));

	const filteredLocations = $derived(
		locations.filter((location) => location.countrySlug === countrySlug)
	);

	const filteredCommunities = $derived(
		communities.filter(
			(community) =>
				community.countrySlug === countrySlug && community.locationSlug === locationSlug
		)
	);

	/* Filters live on the location page's results grid; the country page is an editorial
	   index with nothing to filter. So Community, Property type and Budget only become
	   live once a Location is chosen — Country alone still navigates, as before. */
	const hasLocation = $derived(Boolean(locationSlug));
	const communityDisabled = $derived(!hasLocation || filteredCommunities.length === 0);

	const selectedLocationName = $derived(
		filteredLocations.find((location) => location.slug === locationSlug)?.name ?? ''
	);

	/* Summary shown on the collapsed mobile trigger, so a returning visitor sees their
	   current selection rather than a generic prompt. */
	const compactSummary = $derived(
		[selectedCountry?.name, selectedLocationName || 'anywhere'].filter(Boolean).join(' · ')
	);

	/* Option lists for the shared Select (desktop). */
	const countryOpts = $derived(countries.map((c) => ({ label: c.name, value: c.slug })));
	const locationOpts = $derived(filteredLocations.map((l) => ({ label: l.name, value: l.slug })));
	const communityOpts = $derived(filteredCommunities.map((c) => ({ label: c.name, value: c.slug })));
	const typeOpts = PROPERTY_TYPES.map((t) => ({ label: t.label, value: t.value }));
	const budgetOpts = BUDGET_BANDS.map((b) => ({ label: b.label, value: b.value }));

	function handleCountryChange() {
		locationSlug = '';
		communitySlug = '';
		propertyType = '';
		budget = '';
	}

	function handleLocationChange() {
		communitySlug = '';
		propertyType = '';
		budget = '';
	}

	function destinationHref(): string | null {
		if (!countrySlug) return null;

		let path = `/${countrySlug}`;

		// Country alone → the country index page, no filters to carry.
		if (!locationSlug) return path;

		path += `/${locationSlug}`;

		const band = BUDGET_BANDS.find((option) => option.value === budget);
		const query = serializeListingSearchParams({
			...DEFAULT_LISTING_SEARCH_PARAMS,
			community: communitySlug || null,
			propertyType: (propertyType || null) as (typeof DEFAULT_LISTING_SEARCH_PARAMS)['propertyType'],
			minPrice: band?.min ?? null,
			maxPrice: band?.max ?? null
		}).toString();

		return query ? `${path}?${query}` : path;
	}

	function search() {
		const href = destinationHref();
		if (href) goto(href);
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		search();
	}

	function openSheet() {
		sheet?.showModal();
	}

	function closeSheet() {
		sheet?.close();
	}

	function searchFromSheet() {
		closeSheet();
		search();
	}
</script>

{#snippet flagStamp(country: CountryOption | undefined)}
	{#if country?.flagUrl}
		<img src={country.flagUrl} alt="" width="30" height="20" loading="lazy" decoding="async" />
	{:else if country?.slug === 'spain'}
		<svg viewBox="0 0 30 20" aria-hidden="true">
			<rect width="30" height="20" fill="#AA151B" />
			<rect y="5" width="30" height="10" fill="#F1BF00" />
		</svg>
	{:else if country?.slug === 'portugal'}
		<svg viewBox="0 0 30 20" aria-hidden="true">
			<rect width="30" height="20" fill="#DA291C" />
			<rect width="12" height="20" fill="#046A38" />
			<circle cx="12" cy="10" r="3.1" fill="#FFE12C" stroke="#046A38" stroke-width="0.7" />
		</svg>
	{:else}
		<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#1F3D34" /></svg>
	{/if}
{/snippet}

{#snippet locationOptions()}
	<option value="">Any location</option>
	{#each filteredLocations as location (location._id)}
		<option value={location.slug}>{location.name}</option>
	{/each}
{/snippet}

{#snippet communityOptions()}
	<option value="">Any community</option>
	{#each filteredCommunities as community (community._id)}
		<option value={community.slug}>{community.name}</option>
	{/each}
{/snippet}

{#snippet typeOptions()}
	<option value="">Any type</option>
	{#each PROPERTY_TYPES as type (type.value)}
		<option value={type.value}>{type.label}</option>
	{/each}
{/snippet}

{#snippet budgetOptions()}
	<option value="">Any budget</option>
	{#each BUDGET_BANDS as band (band.value)}
		<option value={band.value}>{band.label}</option>
	{/each}
{/snippet}

<div class="discovery">
	<p class="discovery__lead">Find your home</p>

	<!-- ============ DESKTOP: inline bar (≥ 72rem) ============ -->
	<form class="bar" aria-label="Find properties by destination" onsubmit={handleSubmit}>
		<Select
			variant="chip"
			label="Country"
			options={countryOpts}
			bind:value={countrySlug}
			onchange={handleCountryChange}
		>
			{#snippet flag()}{@render flagStamp(selectedCountry)}{/snippet}
		</Select>

		<div class="bar__tray fc-tray">
			<Select
				variant="tray"
				label="Location"
				placeholder="Any location"
				options={locationOpts}
				bind:value={locationSlug}
				onchange={handleLocationChange}
			/>
			<Select
				variant="tray"
				label="Community"
				placeholder="Any community"
				options={communityOpts}
				disabled={communityDisabled}
				title={communityDisabled ? 'Choose a location first' : undefined}
				bind:value={communitySlug}
			/>
			<Select
				variant="tray"
				label="Property type"
				placeholder="Any type"
				options={typeOpts}
				disabled={!hasLocation}
				title={!hasLocation ? 'Choose a location first' : undefined}
				bind:value={propertyType}
			/>
			<Select
				variant="tray"
				label="Budget"
				placeholder="Any budget"
				options={budgetOpts}
				disabled={!hasLocation}
				title={!hasLocation ? 'Choose a location first' : undefined}
				bind:value={budget}
			/>

			<button class="bar__search" type="submit" aria-label="Search homes">
				<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
					<circle cx="8.5" cy="8.5" r="6" stroke="currentColor" stroke-width="1.6" />
					<path d="M13 13l5 5" stroke="currentColor" stroke-width="1.6" />
				</svg>
			</button>
		</div>
	</form>

	<!-- ============ MOBILE: collapsed trigger (< 72rem) ============ -->
	<button class="trigger" type="button" onclick={openSheet} aria-haspopup="dialog">
		<span class="trigger__flag">{@render flagStamp(selectedCountry)}</span>
		<span class="trigger__summary">{compactSummary}</span>
		<span class="trigger__icon" aria-hidden="true">
			<svg viewBox="0 0 20 20" fill="none">
				<circle cx="8.5" cy="8.5" r="6" stroke="currentColor" stroke-width="1.6" />
				<path d="M13 13l5 5" stroke="currentColor" stroke-width="1.6" />
			</svg>
		</span>
		<span class="sr-only">Open property search</span>
	</button>

	<!-- ============ MOBILE: bottom sheet ============ -->
	<dialog class="sheet" bind:this={sheet} aria-label="Find properties by destination">
		<div class="sheet__head">
			<p class="sheet__title">Find your home</p>
			<button class="sheet__close" type="button" onclick={closeSheet} aria-label="Close">
				<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
					<path d="M4 4l12 12M16 4 4 16" stroke="currentColor" stroke-width="1.5" />
				</svg>
			</button>
		</div>

		<div class="sheet__fields">
			<p class="srow">
				<label class="srow__label" for="sh-country">Country</label>
				<span class="srow__control">
					<span class="srow__flag">{@render flagStamp(selectedCountry)}</span>
					<select id="sh-country" bind:value={countrySlug} onchange={handleCountryChange}>
						{#each countries as country (country._id)}
							<option value={country.slug}>{country.name}</option>
						{/each}
					</select>
				</span>
			</p>

			<p class="srow" class:is-empty={!locationSlug}>
				<label class="srow__label" for="sh-location">Location</label>
				<select id="sh-location" bind:value={locationSlug} onchange={handleLocationChange}>
					{@render locationOptions()}
				</select>
			</p>

			<p class="srow" class:is-empty={!communitySlug} class:is-disabled={communityDisabled}>
				<label class="srow__label" for="sh-community">Community</label>
				<select id="sh-community" bind:value={communitySlug} disabled={communityDisabled}>
					{@render communityOptions()}
				</select>
			</p>

			<p class="srow" class:is-empty={!propertyType} class:is-disabled={!hasLocation}>
				<label class="srow__label" for="sh-type">Property type</label>
				<select id="sh-type" bind:value={propertyType} disabled={!hasLocation}>
					{@render typeOptions()}
				</select>
			</p>

			<p class="srow" class:is-empty={!budget} class:is-disabled={!hasLocation}>
				<label class="srow__label" for="sh-budget">Budget</label>
				<select id="sh-budget" bind:value={budget} disabled={!hasLocation}>
					{@render budgetOptions()}
				</select>
			</p>

			{#if !hasLocation}
				<p class="sheet__hint">Choose a location to filter by community, type and budget.</p>
			{/if}
		</div>

		<button class="sheet__search" type="button" onclick={searchFromSheet}>
			<span>Search homes</span>
			<svg viewBox="0 0 26 12" fill="none" aria-hidden="true">
				<path d="M0 6h23M19 1.5 24 6l-5 4.5" stroke="currentColor" stroke-width="1.5" />
			</svg>
		</button>
	</dialog>
</div>

<style>
	.discovery {
		position: relative;
	}

	.discovery__lead {
		font-family: var(--serif);
		font-style: italic;
		font-weight: 400;
		font-size: clamp(1.1rem, 0.9rem + 0.8vw, 1.4rem);
		color: var(--on-green);
		margin: 0 0 var(--space-md);
		padding-left: 0.1em;
		text-shadow: 0 1px 12px oklch(0.18 0.02 165 / 0.55);
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

	/* ===================== DESKTOP BAR ===================== */
	.bar {
		display: none;
		align-items: stretch;
		gap: 0.625rem;
	}

	.bar__tray {
		flex: 1;
	}

	/* Round search action, sitting inside the gold tray on the right. */
	.bar__search {
		flex: none;
		align-self: center;
		width: 3.75rem;
		height: 3.75rem;
		margin: 0 0.4rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--green);
		border-radius: 50%;
		background: var(--green);
		color: var(--on-green);
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.bar__search svg {
		width: 1.1875rem;
		height: 1.1875rem;
	}

	.bar__search:hover {
		background: transparent;
		color: var(--green);
	}

	.bar__search:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 3px;
	}

	/* ===================== MOBILE TRIGGER ===================== */
	.trigger {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		width: 100%;
		padding: 0.875rem 0.875rem 0.875rem 1.125rem;
		border: 1px solid var(--gold);
		border-radius: 0;
		background: var(--white);
		box-shadow: 0 26px 50px -34px oklch(0.18 0.02 165 / 0.55);
		cursor: pointer;
		text-align: left;
	}

	.trigger__flag {
		flex: none;
		width: 1.625rem;
		height: 1.0625rem;
		border: 1px solid var(--border);
		overflow: hidden;
	}

	.trigger__flag :global(svg),
	.trigger__flag :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.trigger__summary {
		flex: 1;
		min-width: 0;
		font-family: var(--serif);
		font-size: 1.125rem;
		color: var(--charcoal);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.trigger__icon {
		flex: none;
		width: 2.875rem;
		height: 2.875rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--green);
		color: var(--on-green);
	}

	.trigger__icon svg {
		width: 1.0625rem;
		height: 1.0625rem;
	}

	.trigger:focus-visible {
		outline: 2px solid var(--on-green);
		outline-offset: 3px;
	}

	/* ===================== BOTTOM SHEET ===================== */
	.sheet {
		width: 100%;
		max-width: 32rem;
		margin: auto auto 0;
		padding: 0;
		border: 0;
		border-top: 2px solid var(--gold);
		background: var(--white);
		color: var(--charcoal);
	}

	.sheet::backdrop {
		background: oklch(0.18 0.02 165 / 0.55);
	}

	.sheet__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.25rem 0.5rem;
	}

	.sheet__title {
		margin: 0;
		font-family: var(--serif);
		font-style: italic;
		font-size: 1.375rem;
		color: var(--green);
	}

	.sheet__close {
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

	.sheet__close svg {
		width: 1.1rem;
		height: 1.1rem;
	}

	.sheet__fields {
		padding: 0.5rem 1.25rem 0;
	}

	.srow {
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 0;
		border-top: 1px solid var(--border);
	}

	.srow:first-child {
		border-top: 0;
	}

	.srow__label {
		font-family: var(--sans);
		font-weight: 500;
		font-size: 0.6875rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
		flex: none;
	}

	.srow__control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.srow__flag {
		flex: none;
		width: 1.5rem;
		height: 1rem;
		border: 1px solid var(--border);
		overflow: hidden;
	}

	.srow__flag :global(svg),
	.srow__flag :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.srow select {
		appearance: none;
		margin: 0;
		padding: 0 1.3em 0 0;
		border: 0;
		border-radius: 0;
		background: transparent;
		font-family: var(--serif);
		font-size: 1.1875rem;
		color: var(--charcoal);
		text-align: right;
		cursor: pointer;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9' fill='none'%3E%3Cpath d='M1 1.5 7 7l6-5.5' stroke='%236B6B6B' stroke-width='1.5'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0 center;
		background-size: 0.6em auto;
	}

	/* The Location/Community/Type/Budget selects sit directly in the row. They fill the space
	   between label and right edge (flex: 1, min-width: 0 so long Spain names never overflow),
	   and right-align their value via direction: rtl — iOS Safari ignores text-align on a native
	   select, so rtl is the only reliable way to pin the value right across browsers. Options are
	   reset to ltr so the open dropdown still reads left-to-right. The country select is nested in
	   .srow__control, so it's unaffected. */
	.srow > select {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		direction: rtl;
	}

	.srow > select option {
		direction: ltr;
	}

	.srow.is-empty select {
		font-style: italic;
		color: var(--muted);
	}

	.srow.is-disabled {
		opacity: 0.42;
	}

	.srow select:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 3px;
	}

	.sheet__hint {
		margin: 0;
		padding: 0.75rem 0 0;
		font-family: var(--sans);
		font-size: 0.8125rem;
		font-weight: 300;
		color: var(--muted);
	}

	.sheet__search {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		width: calc(100% - 2.5rem);
		margin: 1.25rem 1.25rem 1.5rem;
		min-height: 3.25rem;
		border: 1px solid var(--green);
		border-radius: 0;
		background: var(--green);
		color: var(--on-green);
		font-family: var(--sans);
		font-weight: 500;
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		cursor: pointer;
	}

	.sheet__search svg {
		width: 1.5rem;
		height: 0.75rem;
	}

	/* ===================== RESPONSIVE SWAP ===================== */
	/* Below 72rem the five-field bar would crowd, so the search collapses to the trigger
	   + sheet (the breakpoint the site nav also collapses at). */
	@media (min-width: 72rem) {
		.bar {
			display: flex;
		}

		.trigger {
			display: none;
		}
	}

	/* ===================== MOTION ===================== */
	@media (prefers-reduced-motion: no-preference) {
		.discovery {
			opacity: 0;
			transform: translateY(18px);
			animation: discovery-rise 0.8s var(--ease) 0.15s forwards;
		}

		@keyframes discovery-rise {
			to {
				opacity: 1;
				transform: none;
			}
		}

		.sheet[open] {
			animation: sheet-rise 0.34s var(--ease);
		}

		.sheet[open]::backdrop {
			animation: backdrop-fade 0.34s var(--ease);
		}

		@keyframes sheet-rise {
			from {
				transform: translateY(100%);
			}
		}

		@keyframes backdrop-fade {
			from {
				opacity: 0;
			}
		}
	}
</style>
