<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { GuideKeyFiguresBlock } from '$lib/guides/types';

	let { portableText }: { portableText: CustomBlockComponentProps<GuideKeyFiguresBlock> } = $props();

	const value = $derived(portableText.value);
	const caption = $derived(value.caption?.trim() || undefined);
	const rows = $derived(
		(value.rows ?? []).filter((row) => row && (row.label || row.value))
	);
</script>

{#if rows.length > 0}
	<div class="guide-figures" role="group" aria-label={caption ?? 'Key figures'}>
		{#if caption}
			<p class="guide-figures__caption">{caption}</p>
		{/if}
		<dl class="guide-figures__list">
			{#each rows as row, i (row._key ?? i)}
				<div class="guide-figures__row">
					<dt class="guide-figures__label">{row.label}</dt>
					<dd class="guide-figures__value">
						<span class="tabular-nums">{row.value}</span>
						{#if row.note?.trim()}
							<span class="guide-figures__note">{row.note}</span>
						{/if}
					</dd>
				</div>
			{/each}
		</dl>
	</div>
{/if}

<style>
	.guide-figures {
		margin-block: var(--space-lg);
		border-block: 1px solid var(--border);
	}

	.guide-figures__caption {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--gold);
		padding-block: var(--space-md) 0;
	}

	.guide-figures__list {
		margin: 0;
	}

	.guide-figures__row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
		gap: var(--space-md);
		align-items: baseline;
		padding-block: var(--space-md);
	}

	.guide-figures__row + .guide-figures__row {
		border-top: 1px solid var(--border);
	}

	.guide-figures__label {
		font-family: var(--sans);
		font-size: var(--text-body);
		color: var(--charcoal);
		margin: 0;
	}

	.guide-figures__value {
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-body);
		color: var(--green);
		font-weight: 400;
	}

	.guide-figures__note {
		display: block;
		margin-top: 0.15rem;
		font-size: var(--text-small);
		color: var(--muted);
		font-weight: 300;
	}

	@media (max-width: 30rem) {
		.guide-figures__row {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.25rem;
		}
	}
</style>
