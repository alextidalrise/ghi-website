<script lang="ts">
	import { goto } from '$app/navigation';

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

	const initialCountrySlug = $derived(countries[0]?.slug ?? '');

	let countrySlug = $state('');
	let locationSlug = $state('');
	let communitySlug = $state('');

	$effect(() => {
		if (!countrySlug && initialCountrySlug) {
			countrySlug = initialCountrySlug;
		}
	});

	const filteredLocations = $derived(
		locations.filter((location) => location.countrySlug === countrySlug)
	);

	const filteredCommunities = $derived(
		communities.filter(
			(community) =>
				community.countrySlug === countrySlug && community.locationSlug === locationSlug
		)
	);

	const communityDisabled = $derived(!locationSlug || filteredCommunities.length === 0);

	function handleCountryChange() {
		locationSlug = '';
		communitySlug = '';
	}

	function handleLocationChange() {
		communitySlug = '';
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!countrySlug) return;

		let path = `/${countrySlug}`;
		if (locationSlug) {
			path += `/${locationSlug}`;
			if (communitySlug) {
				path += `/${communitySlug}`;
			}
		}

		goto(path);
	}
</script>

<form class="concierge" aria-label="Find properties by destination" onsubmit={handleSubmit}>
	<div class="concierge__request">
		<span class="concierge__lead-in">Show me homes in</span>

		<span class="concierge__token">
			<select aria-label="Country" bind:value={countrySlug} onchange={handleCountryChange}>
				{#each countries as country (country._id)}
					<option value={country.slug}>{country.name}</option>
				{/each}
			</select>
		</span>

		<span class="concierge__sep" aria-hidden="true"></span>

		<span class="concierge__token" class:is-default={!locationSlug}>
			<select aria-label="Location" bind:value={locationSlug} onchange={handleLocationChange}>
				<option value="">any location</option>
				{#each filteredLocations as location (location._id)}
					<option value={location.slug}>{location.name}</option>
				{/each}
			</select>
		</span>

		<span class="concierge__sep" aria-hidden="true"></span>

		<span class="concierge__token" class:is-default={!communitySlug} class:is-disabled={communityDisabled}>
			<select
				aria-label="Community"
				title={communityDisabled ? 'Choose a location first' : undefined}
				bind:value={communitySlug}
				disabled={communityDisabled}
			>
				<option value="">any community</option>
				{#each filteredCommunities as community (community._id)}
					<option value={community.slug}>{community.name}</option>
				{/each}
			</select>
		</span>
	</div>

	<button class="concierge__cta" type="submit">
		<span>View properties</span>
		<svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden="true">
			<path d="M0 6h23M19 1.5 24 6l-5 4.5" stroke="currentColor" stroke-width="1.5" />
		</svg>
	</button>
</form>

<style>
	.concierge {
		position: relative;
		display: grid;
		gap: var(--space-lg);
		max-width: 46rem;
		padding: clamp(var(--space-lg), 3vw, var(--space-2xl));
		/* Shares the Frontline band's depth language: a soft light gathers behind the
		   lead-in at top-left and settles into a deeper green at the base. The gradient
		   gives the panel dimension and separates it from the flat deep-green nav bar as
		   the page scrolls past. Origin is pulled in/up tighter than the full-bleed
		   Frontline band to suit the panel's narrower, taller proportion. */
		background:
			radial-gradient(135% 75% at 8% -8%, oklch(0.37 0.05 165) 0%, transparent 56%),
			linear-gradient(165deg, oklch(0.31 0.035 165) 0%, oklch(0.23 0.03 165) 100%);
		border: 1px solid var(--gold);
		/* Soft lift to seat the panel across the photo/page seam it bridges. */
		box-shadow: 0 36px 64px -40px oklch(0.08 0.02 165 / 0.9);
	}

	.concierge__request {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.2em 0.4em;
		font-family: var(--serif);
		font-weight: 400;
		font-size: clamp(1.5rem, 1.1rem + 1.7vw, 2.35rem);
		line-height: 1.25;
		letter-spacing: var(--tracking-tight);
	}

	.concierge__lead-in {
		color: var(--on-green);
	}

	.concierge__token {
		position: relative;
		display: inline-flex;
	}

	.concierge__token select {
		appearance: none;
		max-width: 100%;
		margin: 0;
		padding: 0 1.1em 0.04em 0;
		border: 0;
		border-bottom: 2px solid var(--gold);
		border-radius: 0;
		background: transparent;
		color: var(--gold);
		font: inherit;
		line-height: 1.15;
		cursor: pointer;
		transition:
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
		/* Gold chevron sized to the serif, sitting just after the value. */
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9' fill='none'%3E%3Cpath d='M1 1.5 7 7l6-5.5' stroke='%23D6C3A3' stroke-width='1.5'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.1em center;
		background-size: 0.6em auto;
	}

	.concierge__token select option {
		font-size: 1rem;
		color: var(--charcoal);
	}

	.concierge__token select:hover {
		color: oklch(0.86 0.06 85);
	}

	.concierge__token select:focus-visible {
		color: oklch(0.92 0.05 85);
		border-bottom-color: oklch(0.92 0.05 85);
		outline: 2px solid var(--on-green);
		outline-offset: 4px;
	}

	/* Default (unselected) tokens read as a quiet prompt, not a committed choice. */
	.concierge__token.is-default select {
		color: oklch(0.86 0.045 85 / 0.78);
		font-style: italic;
	}

	.concierge__token.is-disabled select {
		border-bottom-color: oklch(0.84 0.04 85 / 0.28);
		cursor: not-allowed;
	}

	.concierge__token.is-disabled select:hover {
		color: oklch(0.84 0.04 85 / 0.62);
	}

	.concierge__sep {
		align-self: center;
		width: 0.32em;
		height: 0.32em;
		border-radius: 50%;
		background: var(--gold);
		opacity: 0.55;
	}

	.concierge__cta {
		justify-self: start;
		display: inline-flex;
		align-items: center;
		gap: var(--space-md);
		min-height: 3.5rem;
		padding: 0 2.5rem;
		border: 1px solid var(--gold);
		border-radius: 0;
		background: var(--gold);
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.concierge__cta svg {
		transition: transform var(--duration-hover) var(--ease);
	}

	.concierge__cta:hover {
		background: transparent;
		color: var(--gold);
	}

	.concierge__cta:focus-visible {
		background: transparent;
		color: var(--gold);
		outline: 2px solid var(--on-green);
		outline-offset: 4px;
	}

	.concierge__cta:hover svg,
	.concierge__cta:focus-visible svg {
		transform: translateX(5px);
	}

	@media (max-width: 600px) {
		.concierge {
			max-width: none;
		}

		.concierge__sep {
			display: none;
		}

		.concierge__cta {
			justify-self: stretch;
			justify-content: center;
			padding: 0 1.5rem;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.concierge {
			opacity: 0;
			transform: translateY(18px);
			animation: concierge-rise 0.8s var(--ease) 0.15s forwards;
		}

		@keyframes concierge-rise {
			to {
				opacity: 1;
				transform: none;
			}
		}
	}
</style>
