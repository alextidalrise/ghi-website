<script lang="ts">
	type Props = {
		/** 0–5. Fractional values are honoured, so an aggregate of 4.8 reads truthfully. */
		rating: number;
		/** Accessible name. Omit on decorative runs that sit beside a visible number. */
		label?: string;
		size?: 'sm' | 'lg';
	};

	let { rating, label, size = 'sm' }: Props = $props();

	const pct = $derived(Math.max(0, Math.min(100, (rating / 5) * 100)));
</script>

<!-- Two stacked runs: a hairline outline beneath, a gold run above clipped to the score.
     A fractional rating therefore fills a star partially rather than rounding away the
     truth of it — 4.8 is not 5. -->
<span
	class="stars stars--{size}"
	style="--fill: {pct}%"
	role={label ? 'img' : 'presentation'}
	aria-label={label}
>
	{#snippet run()}
		{#each { length: 5 } as _, i (i)}
			<svg viewBox="0 0 20 20" aria-hidden="true">
				<path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.61.94-5.5-4-3.9 5.53-.81z" />
			</svg>
		{/each}
	{/snippet}

	<span class="stars__track" aria-hidden="true">{@render run()}</span>
	<span class="stars__fill" aria-hidden="true">{@render run()}</span>
</span>

<style>
	.stars {
		position: relative;
		display: inline-flex;
		width: max-content;
		line-height: 0;
	}

	.stars__track,
	.stars__fill {
		display: inline-flex;
		gap: 0.15em;
	}

	.stars__fill {
		position: absolute;
		inset: 0;
		/* The score, painted over the outline and cut to width. */
		clip-path: inset(0 calc(100% - var(--fill)) 0 0);
	}

	.stars svg {
		width: 1em;
		height: 1em;
		flex: none;
	}

	/* The empty run is a hairline outline, not a grey fill: a "missing" star should read
	   as absent, not as a second colour competing with the gold. */
	.stars__track svg path {
		fill: none;
		stroke: var(--border);
		stroke-width: 1.4;
	}

	.stars__fill svg path {
		fill: var(--gold);
	}

	.stars--sm {
		font-size: 0.8rem;
	}

	.stars--lg {
		font-size: 1rem;
	}
</style>
