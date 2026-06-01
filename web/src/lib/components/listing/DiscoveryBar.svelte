<script lang="ts">
	import { goto } from '$app/navigation';
	import { serializeListingSearchParams } from '$lib/listing/searchParams';
	import { GOLF_RELEVANCE, PROPERTY_TYPES, type GolfRelevanceValue, type PropertyTypeValue } from '$lib/listing/filterOptions';

	type CountryOption = {
		_id: string;
		name: string;
		slug: string;
	};

	type LocationOption = {
		_id: string;
		name: string;
		slug: string;
		countrySlug: string;
	};

	type Props = {
		countries: CountryOption[];
		locations: LocationOption[];
	};

	let { countries, locations }: Props = $props();

	const initialCountrySlug = $derived(countries[0]?.slug ?? '');

	let countrySlug = $state('');
	let locationSlug = $state('');
	let propertyType = $state<PropertyTypeValue | ''>('');
	let golfRelevance = $state<GolfRelevanceValue[]>([]);

	$effect(() => {
		if (!countrySlug && initialCountrySlug) {
			countrySlug = initialCountrySlug;
		}
	});

	const filteredLocations = $derived(
		locations.filter((location) => location.countrySlug === countrySlug)
	);

	function toggleGolfRelevance(value: GolfRelevanceValue, checked: boolean) {
		if (checked) {
			golfRelevance = [...golfRelevance, value];
		} else {
			golfRelevance = golfRelevance.filter((item) => item !== value);
		}
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!countrySlug) return;

		const basePath = locationSlug
			? `/${countrySlug}/${locationSlug}`
			: `/${countrySlug}`;

		const query = serializeListingSearchParams({
			page: 1,
			sort: 'title',
			propertyType: propertyType || null,
			minPrice: null,
			maxPrice: null,
			minBeds: null,
			golfRelevance
		}).toString();

		goto(query ? `${basePath}?${query}` : basePath);
	}
</script>

<form class="discovery-bar" aria-label="Find properties by destination" onsubmit={handleSubmit}>
	<div class="discovery-bar__fields">
		<label class="discovery-bar__field">
			<span>Country</span>
			<select bind:value={countrySlug} onchange={() => (locationSlug = '')}>
				{#each countries as country (country._id)}
					<option value={country.slug}>{country.name}</option>
				{/each}
			</select>
		</label>

		<label class="discovery-bar__field">
			<span>Location</span>
			<select bind:value={locationSlug}>
				<option value="">All locations</option>
				{#each filteredLocations as location (location._id)}
					<option value={location.slug}>{location.name}</option>
				{/each}
			</select>
		</label>

		<label class="discovery-bar__field">
			<span>Property type</span>
			<select bind:value={propertyType}>
				<option value="">Any type</option>
				{#each PROPERTY_TYPES as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</label>
	</div>

	<fieldset class="discovery-bar__golf">
		<legend>Golf relevance</legend>
		<div class="discovery-bar__checkboxes">
			{#each GOLF_RELEVANCE as option (option.value)}
				<label class="discovery-bar__checkbox">
					<input
						type="checkbox"
						value={option.value}
						checked={golfRelevance.includes(option.value)}
						onchange={(event) =>
							toggleGolfRelevance(option.value, (event.currentTarget as HTMLInputElement).checked)}
					/>
					<span>{option.label}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<button class="button button--primary discovery-bar__submit" type="submit">
		Explore properties
	</button>
</form>

<style>
	.discovery-bar {
		display: grid;
		gap: var(--space-lg);
		max-width: 48rem;
		padding: var(--space-lg);
		border: 1px solid oklch(0.95 0.01 85 / 0.25);
		background: oklch(0.18 0.03 165 / 0.55);
		backdrop-filter: blur(12px);
	}

	.discovery-bar__fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--space-md);
	}

	.discovery-bar__field {
		display: grid;
		gap: var(--space-xs);
	}

	.discovery-bar__field span,
	.discovery-bar__golf legend {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--gold);
	}

	.discovery-bar__field select {
		width: 100%;
		padding: 0.875rem 0;
		border: 0;
		border-bottom: 1px solid oklch(0.95 0.01 85 / 0.35);
		border-radius: 0;
		background: transparent;
		color: var(--on-green);
		font: inherit;
		appearance: none;
	}

	.discovery-bar__field select:focus {
		outline: 0;
		border-color: var(--gold);
	}

	.discovery-bar__golf {
		border: 0;
		margin: 0;
		padding: 0;
	}

	.discovery-bar__checkboxes {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm) var(--space-md);
		margin-top: var(--space-sm);
	}

	.discovery-bar__checkbox {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--on-green);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}

	.discovery-bar__submit {
		justify-self: start;
	}
</style>
