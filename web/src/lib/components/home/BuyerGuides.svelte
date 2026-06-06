<script lang="ts">
	import BuyerGuideCard from './BuyerGuideCard.svelte';

	// Static content for now. Copy and coverage points drawn from the buyer-guide
	// brief; the PDFs themselves are delivered by HubSpot once provisioned (the
	// form posts to /api/newsletter with a `guide` field — see BuyerGuideCard).
	const guides = [
		{
			guide: 'spain' as const,
			country: 'Spain',
			title: 'Buying in Spain',
			tone: 'green' as const,
			points: ['NIE, lawyer and notary', 'ITP, IBI and capital gains', 'Non-resident mortgages']
		},
		{
			guide: 'portugal' as const,
			country: 'Portugal',
			title: 'Buying in Portugal',
			tone: 'gold' as const,
			points: ['NIF, fiscal representative and deed', 'IMT, IMI and the NHR scheme', 'Mortgages and currency']
		}
	];
</script>

<section class="guides" aria-labelledby="guides-heading">
	<div class="guides__head">
		<h2 id="guides-heading" class="guides__heading">The complete buyer's guide</h2>
		<p class="guides__intro">
			What to know before you buy in Spain or Portugal: the process, the costs, the tax and the
			mortgage. Free, with no obligation.
		</p>
	</div>

	<div class="guides__grid">
		{#each guides as g (g.guide)}
			<BuyerGuideCard
				guide={g.guide}
				country={g.country}
				title={g.title}
				points={g.points}
				tone={g.tone}
			/>
		{/each}
	</div>

	<p class="guides__reassurance">No spam. Unsubscribe anytime.</p>
</section>

<style>
	.guides__head {
		max-width: 40rem;
		margin-bottom: var(--space-lg);
	}

	.guides__intro {
		margin-top: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.6;
		color: var(--muted);
		max-width: 36rem;
	}

	.guides__grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-lg);
		align-items: stretch;
	}

	.guides__reassurance {
		margin-top: var(--space-md);
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--muted);
	}

	@media (max-width: 720px) {
		.guides__grid {
			grid-template-columns: 1fr;
		}
	}
</style>
