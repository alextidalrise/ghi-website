<script lang="ts">
	import type { PublicDevelopment } from '$lib/sanity/transforms';

	type Props = {
		development: PublicDevelopment;
	};

	let { development }: Props = $props();

	const amenities = $derived.by(() => {
		const shared = (development.sharedAmenities ?? [])
			.filter((item) => item?.label)
			.map((item) => ({
				label: item.label!,
				value: item.value ?? null
			}));

		const contentAmenities = (development.content?.amenities ?? []).map((label) => ({
			label,
			value: null as string | null
		}));

		const seen = new Set<string>();
		return [...shared, ...contentAmenities].filter((item) => {
			const key = `${item.label}:${item.value ?? ''}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	});
</script>

{#if amenities.length > 0}
	<section class="amenities content-wrap" aria-labelledby="shared-amenities-heading">
		<h2 id="shared-amenities-heading">Shared amenities</h2>
		<ul class="amenities__list">
			{#each amenities as amenity (`${amenity.label}-${amenity.value ?? ''}`)}
				<li>
					{amenity.label}{#if amenity.value}
						<span class="amenities__value"> — {amenity.value}</span>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.amenities {
		padding-block: var(--space-xl);
	}

	.amenities h2 {
		margin-bottom: var(--space-md);
	}

	.amenities__list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		list-style: none;
	}

	.amenities__list li {
		font-size: var(--text-ui);
		padding: 0.45rem 0.85rem;
		border: 1px solid var(--border);
		background: var(--linen);
		color: var(--green);
	}

	.amenities__value {
		color: var(--muted);
	}
</style>
