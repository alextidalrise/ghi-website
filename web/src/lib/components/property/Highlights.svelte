<script lang="ts">
	import type { PublicContent } from '$lib/sanity/transforms';

	type Props = {
		content: PublicContent | null | undefined;
	};

	let { content }: Props = $props();

	/* The editor-curated standout features, authored and ordered in Sanity's
	   `featureHighlights` field ("handpicked … shown prominently"). We surface the
	   `label` only — `value` carries internal enrichment detail and never ships.
	   Order is the editor's; we preserve it, dedupe, and clean the one stray
	   provenance suffix the enrichment pipeline sometimes leaves behind. */
	const highlights = $derived.by((): string[] => {
		const seen = new Set<string>();
		const out: string[] = [];
		for (const highlight of content?.featureHighlights ?? []) {
			const label = highlight?.label
				?.trim()
				.replace(/[,\s]+per\s+source(?:\s+text)?\.?$/i, '')
				.trim();
			if (!label) continue;
			const key = label.toLowerCase();
			if (seen.has(key)) continue;
			seen.add(key);
			out.push(label);
		}
		return out;
	});
</script>

{#if highlights.length > 0}
	<section class="highlights" aria-labelledby="highlights-heading">
		<h2 id="highlights-heading">Highlights</h2>

		<!-- A hairline lattice (not a card grid): cells share 1px rules via the gap,
		     the same frame language as KeyFacts. Two columns where there's room, one
		     on phones; an odd final entry spans the full width so no empty cell is
		     left dangling. -->
		<ul class="highlights__grid">
			{#each highlights as feature, index (feature)}
				<li class="highlights__cell">
					<span class="highlights__inner" style="--reveal-delay: {index * 60}ms">
						<span class="highlights__mark" aria-hidden="true"></span>
						<span class="highlights__label">{feature}</span>
					</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.highlights {
		padding-block: var(--space-lg);
	}

	.highlights h2 {
		margin-bottom: var(--space-md);
	}

	/* The lattice: a 1px --border backdrop shows through the 1px grid gaps and the
	   outer frame, while white cells sit on top — giving every rule the same
	   hairline weight without per-cell borders (which would read as cards). */
	.highlights__grid {
		list-style: none;
		display: grid;
		grid-template-columns: 1fr;
		gap: 1px;
		background: var(--border);
		border: 1px solid var(--border);
	}

	@media (min-width: 600px) {
		.highlights__grid {
			grid-template-columns: 1fr 1fr;
		}

		/* An odd last entry runs full width rather than leaving a blank framed cell. */
		.highlights__cell:nth-child(odd):last-child {
			grid-column: 1 / -1;
		}
	}

	.highlights__cell {
		background: var(--white);
		padding: 0.8rem 1.15rem;
	}

	/* Mark and label share one baseline row: the gold square leads, the feature
	   reads beside it. Anchored to the top so the marker sits on the first line of a
	   two-line entry rather than floating to its centre. */
	.highlights__inner {
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
	}

	/* Gold as an accent mark, never a fill: a small square that warms the lattice
	   and leads each feature without reading as a bullet. Square corners per the
	   brand; nudged down to optically centre on the first text line. */
	.highlights__mark {
		flex: none;
		width: 0.375rem;
		height: 0.375rem;
		margin-top: 0.4rem;
		background: var(--gold);
	}

	.highlights__label {
		font-family: var(--sans);
		font-size: 1rem;
		font-weight: 400;
		line-height: 1.45;
		color: var(--green);
		text-wrap: balance;
	}

	/* Amenity-style labels can arrive lowercase ("sea views"); lift the first
	   letter while leaving proper nouns (La Concha, Gaggenau) untouched. */
	.highlights__label::first-letter {
		text-transform: uppercase;
	}

	/* Staggered entrance on the inner content only, so the static lattice rules
	   never shift. Default (and reduced-motion) state is fully visible — the
	   animation enhances, it doesn't gate. */
	@media (prefers-reduced-motion: no-preference) {
		.highlights__inner {
			opacity: 0;
			animation: highlight-reveal 0.5s var(--ease) forwards;
			animation-delay: var(--reveal-delay, 0ms);
		}

		@keyframes highlight-reveal {
			from {
				opacity: 0;
				transform: translateY(0.4rem);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}
</style>
