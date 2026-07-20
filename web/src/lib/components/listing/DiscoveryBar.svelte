<script lang="ts">
	import { goto } from '$app/navigation';
	import { priceBandLabel, trackSearchSubmitted } from '$lib/analytics';
	import { PROPERTY_TYPES } from '$lib/listing/filterOptions';
	import {
		DEFAULT_LISTING_SEARCH_PARAMS,
		serializeListingSearchParams
	} from '$lib/listing/searchParams';
	import Select from '$lib/components/ui/Select.svelte';
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	import {
		cleanFeatureLabel,
		DEFAULT_FEATURE_FILTER,
		featureLabelKey,
		toFeatureOptions,
		type FeatureFilterSettings
	} from '$lib/listing/featureHighlights';
	import type { ListingFacetRow } from '$lib/sanity/queries';

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
		/** Per-listing facet rows; Property type / Budget / Features narrow to the chosen location. */
		facetRows?: ListingFacetRow[];
		/**
		 * When set, the bar is locked to this country: the country selector is removed and
		 * the country is fixed to this slug. Used on the country page, where the country is
		 * already the page's subject — the visitor only refines Location and below. The
		 * country name still surfaces in the lead ("Find your home in Spain") and, on mobile,
		 * as the collapsed trigger's flag.
		 */
		scopedCountrySlug?: string;
		/** Editor-managed Features-filter controls (Sanity site settings). */
		featureFilter?: FeatureFilterSettings;
	};

	let {
		countries,
		locations,
		communities,
		facetRows = [],
		scopedCountrySlug,
		featureFilter = DEFAULT_FEATURE_FILTER
	}: Props = $props();

	const isScoped = $derived(Boolean(scopedCountrySlug));

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

	/* When scoped to a country page, that country is fixed. Otherwise Spain is the larger,
	   lead portfolio, so it's the default selection; fall back to the first country if Spain
	   isn't in the dataset (e.g. a future market reshuffle). */
	const initialCountrySlug = $derived(
		scopedCountrySlug ??
			countries.find((country) => country.slug === 'spain')?.slug ??
			countries[0]?.slug ??
			''
	);

	// Seed the fixed country synchronously (SSR too) when scoped, so the lead reads
	// "…in Spain" and the location menu is populated on first paint rather than filling
	// in after hydration. The country is fixed for the page's life, so capturing the
	// initial prop value is deliberate. The homepage (unscoped) keeps '' and defaults to
	// Spain via the effect below.
	// svelte-ignore state_referenced_locally
	let countrySlug = $state(scopedCountrySlug ?? '');
	let locationSlug = $state('');
	let communitySlug = $state('');
	let propertyType = $state('');
	let budget = $state('');
	let features = $state<string[]>([]);

	let sheet = $state<HTMLDialogElement>();
	/* The sheet's Features row is a disclosure, collapsed by default like the native-select
	   rows above it — its options stay hidden until the visitor opens it. */
	let featuresOpen = $state(false);

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

	const selectedLocationName = $derived(
		filteredLocations.find((location) => location.slug === locationSlug)?.name ?? ''
	);

	/* The country's display name, for the lead line and (mobile) the trigger flag. */
	const scopedCountryName = $derived(selectedCountry?.name ?? '');

	/* Lead: on a country page the scope is spoken ("… in Spain") rather than shown as a
	   selector; on the homepage it stays the plain prompt. */
	const leadText = $derived(
		isScoped && scopedCountryName ? `Find your home in ${scopedCountryName}` : 'Find your home'
	);

	/* Summary shown on the collapsed mobile trigger, so a returning visitor sees their
	   current selection rather than a generic prompt. Scoped to a country, the country name
	   is already the page — the summary carries the location refinement only. */
	const compactSummary = $derived(
		isScoped
			? selectedLocationName || 'Any location'
			: [selectedCountry?.name, selectedLocationName || 'anywhere'].filter(Boolean).join(' · ')
	);

	/* On a country page, country-only "search" would just reload the current page, so the
	   action waits for a Location — the minimum meaningful refinement here. The homepage,
	   which navigates country → country page, keeps search always live. */
	const searchDisabled = $derived(isScoped && !hasLocation);

	/* Cross-filtering (faceted search): Community, Property type, Budget and Features all
	   constrain each other, in any order. Each menu lists only what stays reachable given
	   every OTHER active selection, so picking a feature (e.g. Sauna) narrows the type/budget/
	   community menus to sauna listings, exactly as picking a type narrows Budget.

	   Each facet's own value is deliberately excluded from its own predicate set, which keeps
	   the menu from collapsing to just the chosen value — and guarantees that any option the
	   user can see still yields a non-empty result, so selections never go stale. */
	const rowFeatureKeys = (row: ListingFacetRow) =>
		new Set(row.featureLabels.map((label) => featureLabelKey(cleanFeatureLabel(label))));

	const matchesCommunity = (row: ListingFacetRow) =>
		!communitySlug || row.communitySlug === communitySlug;
	const matchesType = (row: ListingFacetRow) =>
		!propertyType || row.propertyTypes.includes(propertyType);
	const matchesBudget = (row: ListingFacetRow) => {
		if (!budget) return true;
		const band = BUDGET_BANDS.find((b) => b.value === budget);
		if (!band) return true;
		return (
			row.price != null &&
			(band.min == null || row.price >= band.min) &&
			(band.max == null || row.price <= band.max)
		);
	};
	const matchesFeatures = (row: ListingFacetRow) => {
		if (features.length === 0) return true;
		const keys = rowFeatureKeys(row);
		// OR semantics — a listing matches if it has ANY of the selected features (as the grid does).
		return features.some((feature) => keys.has(feature));
	};

	/* Location scope (or the whole catalogue before a location is picked — the dependent
	   fields are disabled until then, but stay populated). */
	const locationRows = $derived(
		hasLocation
			? facetRows.filter(
					(row) => row.countrySlug === countrySlug && row.locationSlug === locationSlug
				)
			: facetRows
	);
	/* Rows feeding each facet's options: all OTHER facets applied, this facet left open. */
	const communityScopedRows = $derived(
		locationRows.filter((r) => matchesType(r) && matchesBudget(r) && matchesFeatures(r))
	);
	const typeScopedRows = $derived(
		locationRows.filter((r) => matchesCommunity(r) && matchesBudget(r) && matchesFeatures(r))
	);
	const budgetScopedRows = $derived(
		locationRows.filter((r) => matchesCommunity(r) && matchesType(r) && matchesFeatures(r))
	);
	const featureScopedRows = $derived(
		locationRows.filter((r) => matchesCommunity(r) && matchesType(r) && matchesBudget(r))
	);

	const availableCommunitySlugs = $derived(
		new Set(communityScopedRows.map((row) => row.communitySlug).filter(Boolean))
	);
	const availableTypeValues = $derived(new Set(typeScopedRows.flatMap((row) => row.propertyTypes)));
	const bandHasListing = (band: (typeof BUDGET_BANDS)[number]) =>
		budgetScopedRows.some(
			(row) =>
				row.price != null &&
				(band.min == null || row.price >= band.min) &&
				(band.max == null || row.price <= band.max)
		);

	/* Global Features presence decides whether the field renders at all; the cross-filtered
	   list feeds its menu once a location is chosen. Both apply the editor-managed
	   Features-filter controls (min listings, cap, block/allow lists) so the menu stays a
	   curated set of genuine, shared traits rather than the enrichment pipeline's one-off
	   free-text ("Architecture by …", "92 Fully Furnished Apartments"). */
	const globalFeatureOptions = $derived(
		toFeatureOptions(
			facetRows.flatMap((row) => row.featureLabels),
			featureFilter
		)
	);
	const featureOpts = $derived(
		toFeatureOptions(
			featureScopedRows.flatMap((row) => row.featureLabels),
			featureFilter
		)
	);

	/* Features go live once a location is chosen and its cross-filtered menu is non-empty —
	   the same gate the desktop bar and the sheet's disclosure share. */
	const featuresDisabled = $derived(!hasLocation || featureOpts.length === 0);

	/* Right-hand summary on the collapsed Features row, mirroring how the select rows show
	   their current value: the single feature's label, a count when several, else "Any". */
	const featuresSummary = $derived(
		features.length === 0
			? 'Any'
			: features.length === 1
				? (featureOpts.find((option) => option.value === features[0])?.label ?? '1 selected')
				: `${features.length} selected`
	);

	/* Option lists for the shared Select (desktop). */
	const countryOpts = $derived(countries.map((c) => ({ label: c.name, value: c.slug })));
	const locationOpts = $derived(filteredLocations.map((l) => ({ label: l.name, value: l.slug })));
	const communityOpts = $derived(
		filteredCommunities
			.filter((c) => availableCommunitySlugs.has(c.slug))
			.map((c) => ({ label: c.name, value: c.slug }))
	);
	const typeOpts = $derived(
		PROPERTY_TYPES.filter((t) => availableTypeValues.has(t.value)).map((t) => ({
			label: t.label,
			value: t.value
		}))
	);
	const budgetOpts = $derived(
		BUDGET_BANDS.filter(bandHasListing).map((b) => ({ label: b.label, value: b.value }))
	);

	/* Community is live only once a location is chosen, and greys out if cross-filtering
	   leaves no community with a matching listing. */
	const communityDisabled = $derived(!hasLocation || communityOpts.length === 0);

	function handleCountryChange() {
		locationSlug = '';
		communitySlug = '';
		propertyType = '';
		budget = '';
		features = [];
		featuresOpen = false;
	}

	function handleLocationChange() {
		communitySlug = '';
		propertyType = '';
		budget = '';
		features = [];
		featuresOpen = false;
	}

	/* Cross-filtered menus only ever surface options that keep a non-empty result, so the
	   facets stay mutually valid without resetting each other. The one gap is the multi-select
	   Features: changing another facet can drop a still-selected feature out of view (its
	   checkbox is gone but the value would linger in the URL), so prune features to what the
	   current menu actually offers. */
	$effect(() => {
		const visible = new Set(featureOpts.map((option) => option.value));
		if (features.some((feature) => !visible.has(feature))) {
			features = features.filter((feature) => visible.has(feature));
		}
	});

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
			maxPrice: band?.max ?? null,
			features: [...features]
		}).toString();

		return query ? `${path}?${query}` : path;
	}

	function search() {
		if (searchDisabled) return;
		const href = destinationHref();
		if (!href) return;

		// Single chokepoint: the bar's own button and the mobile sheet both land here.
		const band = BUDGET_BANDS.find((option) => option.value === budget);
		const allowedFeatures = new Set(featureOpts.map((option) => option.value));
		trackSearchSubmitted({
			placement: 'discovery_bar',
			country: countrySlug || null,
			location: locationSlug || null,
			community: communitySlug || null,
			propertyType: propertyType || null,
			priceBand: priceBandLabel(band?.min ?? null, band?.max ?? null),
			selectedFeatures: features.filter((feature) => allowedFeatures.has(feature))
		});

		goto(href);
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
	{#each communityOpts as community (community.value)}
		<option value={community.value}>{community.label}</option>
	{/each}
{/snippet}

{#snippet typeOptions()}
	<option value="">Any type</option>
	{#each typeOpts as type (type.value)}
		<option value={type.value}>{type.label}</option>
	{/each}
{/snippet}

{#snippet budgetOptions()}
	<option value="">Any budget</option>
	{#each budgetOpts as band (band.value)}
		<option value={band.value}>{band.label}</option>
	{/each}
{/snippet}

<div class="discovery">
	<p class="discovery__lead">{leadText}</p>

	<!-- ============ DESKTOP: inline bar (≥ 72rem) ============ -->
	<form class="bar" aria-label="Find properties by destination" onsubmit={handleSubmit}>
		<!-- The country chip is dropped when the bar is scoped to a country page: the country
		     is fixed and already the page's subject, so the tray leads on Location. -->
		{#if !isScoped}
			<Select
				variant="chip"
				label="Country"
				options={countryOpts}
				bind:value={countrySlug}
				onchange={handleCountryChange}
			>
				{#snippet flag()}{@render flagStamp(selectedCountry)}{/snippet}
			</Select>
		{/if}

		<div class="bar__tray fc-tray">
			<Select
				variant="tray"
				label="Location"
				placeholder="Anywhere"
				options={locationOpts}
				bind:value={locationSlug}
				onchange={handleLocationChange}
			/>
			<Select
				variant="tray"
				label="Community"
				placeholder="Any"
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
				disabled={!hasLocation || typeOpts.length === 0}
				title={!hasLocation ? 'Choose a location first' : undefined}
				bind:value={propertyType}
			/>
			<Select
				variant="tray"
				label="Budget"
				placeholder="Any budget"
				options={budgetOpts}
				disabled={!hasLocation || budgetOpts.length === 0}
				title={!hasLocation ? 'Choose a location first' : undefined}
				bind:value={budget}
			/>
			<!-- Features sit greyed-out from load, like Community/Type/Budget, and go live
			     once a location is chosen. The menu lists only that location's features. -->
			{#if globalFeatureOptions.length > 0}
				<MultiSelect
					variant="tray"
					label="Features"
					name="features"
					options={featureOpts}
					disabled={featuresDisabled}
					bind:value={features}
				/>
			{/if}

			<button
				class="bar__search"
				type="submit"
				aria-label="Search homes"
				disabled={searchDisabled}
				title={searchDisabled ? 'Choose a location to search' : undefined}
			>
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
			<p class="sheet__title">{leadText}</p>
			<button class="sheet__close" type="button" onclick={closeSheet} aria-label="Close">
				<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
					<path d="M4 4l12 12M16 4 4 16" stroke="currentColor" stroke-width="1.5" />
				</svg>
			</button>
		</div>

		<div class="sheet__fields">
			{#if !isScoped}
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
			{/if}

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

			<p
				class="srow"
				class:is-empty={!propertyType}
				class:is-disabled={!hasLocation || typeOpts.length === 0}
			>
				<label class="srow__label" for="sh-type">Property type</label>
				<select id="sh-type" bind:value={propertyType} disabled={!hasLocation || typeOpts.length === 0}>
					{@render typeOptions()}
				</select>
			</p>

			<p
				class="srow"
				class:is-empty={!budget}
				class:is-disabled={!hasLocation || budgetOpts.length === 0}
			>
				<label class="srow__label" for="sh-budget">Budget</label>
				<select id="sh-budget" bind:value={budget} disabled={!hasLocation || budgetOpts.length === 0}>
					{@render budgetOptions()}
				</select>
			</p>

			{#if globalFeatureOptions.length > 0}
				<!-- Features collapses like the select rows above: hidden by default, revealed on
				     tap. The disclosure header mirrors a select row (label + current value + chevron);
				     the checkbox grid unfolds beneath only when opened. -->
				<div class="srow srow--features" class:is-disabled={featuresDisabled}>
					<button
						type="button"
						class="srow__disclosure"
						aria-expanded={featuresOpen}
						aria-controls="sh-features-panel"
						disabled={featuresDisabled}
						onclick={() => (featuresOpen = !featuresOpen)}
					>
						<span class="srow__label">Features</span>
						<span class="srow__value" class:is-empty={features.length === 0}>
							{featuresSummary}
						</span>
						<span class="srow__chevron" class:is-open={featuresOpen} aria-hidden="true">
							<svg viewBox="0 0 14 9" fill="none">
								<path d="M1 1.5 7 7l6-5.5" stroke="currentColor" stroke-width="1.5" />
							</svg>
						</span>
					</button>
					{#if featuresOpen && !featuresDisabled}
						<fieldset id="sh-features-panel" class="srow__checks">
							<legend class="sr-only">Features</legend>
							{#each featureOpts as option (option.value)}
								<label class="srow__check">
									<input type="checkbox" bind:group={features} value={option.value} />
									<span>{option.label}</span>
								</label>
							{/each}
						</fieldset>
					{/if}
				</div>
			{/if}

			{#if !hasLocation}
				<p class="sheet__hint">Choose a location to filter by community, type, budget and features.</p>
			{/if}
		</div>

		<button
			class="sheet__search"
			type="button"
			onclick={searchFromSheet}
			disabled={searchDisabled}
		>
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
		/* Nested flex: without this the tray keeps its content's min-content as its
		   minimum and refuses to shrink, so a 5th cell (Features) shoves the search
		   button past the edge. min-width:0 lets the inner cells' own min-width:0 win. */
		min-width: 0;
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

	.bar__search:not(:disabled):hover {
		background: transparent;
		color: var(--green);
	}

	.bar__search:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 3px;
	}

	/* Scoped country page: the action waits for a Location. Reads as clearly inert —
	   the hairline outline of the resting round button with muted ink, no fill. */
	.bar__search:disabled {
		background: transparent;
		border-color: var(--border);
		color: var(--muted);
		cursor: not-allowed;
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

	/* Features is a collapsible disclosure, not an always-open list: it stacks a header row
	   (label + value + chevron, matching the select rows) above a checkbox grid that only
	   renders when opened. Column layout so the grid can unfold beneath the header. */
	.srow--features {
		flex-direction: column;
		align-items: stretch;
		gap: 0;
		min-inline-size: 0;
		/* The disclosure button carries the row padding so the whole header is a tap target. */
		padding-block: 0;
	}

	/* Header row: reuses .srow's label/value/chevron rhythm so a closed Features row is
	   indistinguishable from the Location/Budget select rows above it. */
	.srow__disclosure {
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

	.srow--features.is-disabled .srow__disclosure {
		cursor: not-allowed;
	}

	.srow__disclosure:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 3px;
	}

	/* Current value, right-aligned before the chevron — the multi-select echo of the native
	   selects' displayed value. Italic-muted when nothing is chosen, like .srow.is-empty. */
	.srow__value {
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

	.srow__value.is-empty {
		font-style: italic;
		color: var(--muted);
	}

	.srow__chevron {
		flex: none;
		display: flex;
		align-items: center;
		color: var(--muted);
		transition: transform var(--duration-hover) var(--ease);
	}

	.srow__chevron svg {
		width: 0.75rem;
		height: auto;
	}

	.srow__chevron.is-open {
		transform: rotate(180deg);
	}

	/* A tidy checklist rather than a ragged wrap: even columns that reflow with the sheet
	   width (2 up on a phone, 3+ on a wide sheet), rows on a shared baseline. Curated
	   labels (junk + per-listing measurements filtered upstream) keep it calm. Also resets
	   the fieldset's UA chrome (margin/padding/border). */
	.srow__checks {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
		gap: 0 1.25rem;
		margin: 0;
		padding: 0 0 0.5rem;
		border: 0;
		min-inline-size: 0;
	}

	.srow__check {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		/* 44px min row keeps each option a comfortable touch target even when its label
		   is a single short word. */
		min-height: 2.75rem;
		font-family: var(--sans);
		font-size: 0.9375rem;
		line-height: 1.3;
		color: var(--charcoal);
		cursor: pointer;
	}

	.srow__check input {
		flex: none;
		width: 1.125rem;
		height: 1.125rem;
		accent-color: var(--green);
		cursor: pointer;
	}

	.srow--features.is-disabled .srow__check {
		cursor: not-allowed;
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

	.sheet__search:disabled {
		background: transparent;
		border-color: var(--border);
		color: var(--muted);
		cursor: not-allowed;
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

		/* The Features grid unfolds rather than snapping in when the disclosure opens. */
		.srow--features .srow__checks {
			animation: features-unfold 0.24s var(--ease);
		}

		@keyframes features-unfold {
			from {
				opacity: 0;
				transform: translateY(-4px);
			}
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
