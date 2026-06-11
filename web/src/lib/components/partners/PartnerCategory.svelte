<script lang="ts">
	import type { PartnerCategory } from '$lib/partners/partners';
	import PartnerCard from './PartnerCard.svelte';

	type Props = {
		category: PartnerCategory;
	};

	let { category }: Props = $props();
</script>

{#if category.partners.length > 0}
	<section class="category" aria-labelledby="category-{category.id}">
		<header class="category__head">
			<span class="category__monogram" aria-hidden="true">{category.monogram}</span>
			<div class="category__heading">
				<h2 id="category-{category.id}" class="category__name">{category.name}</h2>
				<p class="category__role">{category.role}</p>
			</div>
		</header>

		<!-- One partner fills the row as a full-width card; a second makes it a two-up
		     grid without changing the markup. Each card adapts its own internals. -->
		<div class="category__cards">
			{#each category.partners as partner (partner.slug)}
				<PartnerCard {partner} />
			{/each}
		</div>
	</section>
{/if}

<style>
	.category {
		min-width: 0;
	}

	.category__head {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	/* Uniform wayfinding monogram: a gold hairline square with the category initial in
	   the wordmark serif. Square corners per the brand rule (no circles), one consistent
	   treatment rather than the mockup's per-category colours. */
	.category__monogram {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 3.25rem;
		height: 3.25rem;
		border: 1px solid var(--gold);
		font-family: var(--serif);
		font-size: var(--text-h4);
		font-weight: 400;
		color: var(--green);
	}

	.category__heading {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.category__role {
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--muted);
	}

	.category__cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 28rem), 1fr));
		gap: var(--space-md);
	}
</style>
