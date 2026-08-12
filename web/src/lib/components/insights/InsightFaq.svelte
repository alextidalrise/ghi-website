<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightFaqBlock, InsightFaqItem } from '$lib/insights/types';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightFaqBlock> } = $props();

	const items = $derived(
		(portableText.value.items ?? []).filter(
			(item): item is InsightFaqItem => Boolean(item?.question?.trim() && item?.answer?.trim())
		)
	);

	// `open` shows every question and answer at once as a ruled list; the default `accordion`
	// discloses each answer on demand. The FAQPage structured data (built server-side) is the
	// same for both, so switching the display never changes what the page emits for search.
	const isOpen = $derived(portableText.value.display === 'open');

	function paragraphs(answer: string | null | undefined): string[] {
		return (answer ?? '')
			.split(/\n\s*\n/)
			.map((para) => para.trim())
			.filter(Boolean);
	}
</script>

{#if items.length > 0}
	<div class="faq" class:faq--open={isOpen}>
		{#each items as item, index (item._key ?? index)}
			{#if isOpen}
				<!-- Static: no disclosure control, every answer shown. The question stays an <h3> so it
				     still lands in the document outline one step below the section heading. -->
				<div class="faq__item faq__item--open">
					<h3 class="faq__q faq__q--static">
						<span class="faq__q-text">{item.question}</span>
					</h3>
					<div class="faq__a">
						{#each paragraphs(item.answer) as para (para)}
							<p>{para}</p>
						{/each}
					</div>
				</div>
			{:else}
				<!-- No `name`: the group is a set of independent disclosures, so a reader can hold
				     several answers open at once. An exclusive accordion (shared `name`) would collapse
				     the last answer whenever the next is opened — hostile when questions are compared. -->
				<details class="faq__item">
					<summary class="faq__q">
						<!-- The question carries a real heading so it lands in the document outline one step
						     below the section `h2`, letting screen-reader users jump the Q&A by heading. It
						     sits inside `summary` (whose content model permits heading content) so the
						     disclosure control and the heading remain one accessible node. -->
						<h3 class="faq__q-text">{item.question}</h3>
						<svg class="faq__mark" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
							<path d="M3 5.5 7 9.5 11 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" fill="none" />
						</svg>
					</summary>
					<div class="faq__a">
						{#each paragraphs(item.answer) as para (para)}
							<p>{para}</p>
						{/each}
					</div>
				</details>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.faq {
		margin-block: var(--space-md);
		border-top: 1px solid var(--border);
	}

	.faq__item {
		border-bottom: 1px solid var(--border);
	}

	.faq__q {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-md);
		padding-block: var(--space-md);
		cursor: pointer;
		list-style: none;
		font-family: var(--serif);
		font-size: var(--text-h4);
		color: var(--green);
	}

	/* Remove the default disclosure triangle across engines. */
	.faq__q::-webkit-details-marker {
		display: none;
	}

	/* The question is a heading for the outline, not for restyling: fold its type back to
	   whatever the summary already computes (serif, --text-h4, --green), so promoting the
	   old <span> to <h3> changes the document outline and nothing on screen. */
	.faq__q-text {
		margin: 0;
		font: inherit;
		color: inherit;
	}

	.faq__mark {
		flex-shrink: 0;
		color: var(--gold);
		transform: translateY(-0.1em);
		transition: transform var(--duration-hover) var(--ease);
	}

	.faq__item[open] .faq__mark {
		transform: translateY(-0.1em) rotate(180deg);
	}

	.faq__a {
		padding-bottom: var(--space-md);
		max-width: 64ch;
	}

	.faq__a p {
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--charcoal);
		margin: 0;
	}

	.faq__a p + p {
		margin-top: var(--space-sm);
	}

	.faq__q:hover,
	.faq__item[open] .faq__q {
		color: var(--green);
	}

	/* Open display: the question is a static heading (no disclosure control, no cursor/chevron)
	   and its answer always shows. Padding mirrors the accordion's summary/answer rhythm so the
	   two displays sit at the same vertical cadence. */
	.faq__q--static {
		display: block;
		cursor: default;
		padding-block: var(--space-md) var(--space-xs);
	}

	.faq--open .faq__a {
		padding-bottom: var(--space-md);
	}

	@media (prefers-reduced-motion: reduce) {
		.faq__mark {
			transition: none;
		}
	}
</style>
