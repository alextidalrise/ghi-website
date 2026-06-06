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
			points: ['NIE, lawyer and notary', 'ITP, IBI and capital gains', 'Non-resident mortgages']
		},
		{
			guide: 'portugal' as const,
			country: 'Portugal',
			title: 'Buying in Portugal',
			points: [
				'NIF, fiscal representative and deed',
				'IMT, IMI and the NHR scheme',
				'Mortgages and currency'
			]
		}
	];
</script>

<section class="guides" aria-labelledby="guides-heading">
	<div class="guides__inner">
		<header class="guides__head">
			<h2 id="guides-heading" class="guides__title">
				Everything to know <em>before you buy</em>
			</h2>
			<p class="guides__intro">
				The process, the costs, the tax and the mortgage, set out plainly for non-resident buyers in
				Spain and Portugal. Written by our team, yours with no obligation.
			</p>
		</header>

		<div class="guides__grid">
			{#each guides as g, i (g.guide)}
				<BuyerGuideCard
					guide={g.guide}
					country={g.country}
					title={g.title}
					points={g.points}
					revealDelay={i * 110}
				/>
			{/each}
		</div>

		<p class="guides__reassurance">No spam. Unsubscribe anytime.</p>
	</div>
</section>

<style>
	/* Emphasis Ladder tier 2: a full-bleed white band bracketed by hairline rules.
	   Width + the two --border rules are what separate it from the white editorial
	   default; green stays the page's one band (Frontline). */
	.guides {
		/* Full-bleed: escape the content column to the viewport edges. The page-level
		   overflow-x: clip on .site-main absorbs the scrollbar gutter (same technique
		   as the Frontline band). */
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		padding-block: clamp(3.5rem, 2rem + 6vw, 6rem);
		background: var(--white);
		border-block: 1px solid var(--border);
	}

	.guides__inner {
		max-width: var(--content-max);
		margin-inline: auto;
		padding-inline: var(--content-padding);
	}

	.guides__head {
		max-width: 44rem;
		margin-bottom: clamp(2rem, 1rem + 3vw, 3rem);
	}

	.guides__title {
		max-width: 18ch;
	}

	/* The select italic moment (tier-1 lever) without leaving the white default. */
	.guides__title em {
		font-style: italic;
		font-weight: 600;
	}

	.guides__intro {
		margin-top: var(--space-md);
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--muted);
		max-width: 52ch;
	}

	.guides__grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(1.25rem, 0.5rem + 2vw, 2rem);
		align-items: stretch;
	}

	.guides__reassurance {
		margin-top: var(--space-lg);
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
