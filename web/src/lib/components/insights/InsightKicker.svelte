<script lang="ts">
	/** The article's category kicker: a gold diamond mark + tracked green caps. */
	let { label }: { label: string } = $props();
</script>

<span class="insight-kicker">
	<span class="insight-kicker__mark" aria-hidden="true">◆</span>{label}
</span>

<style>
	.insight-kicker {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--green);
	}

	.insight-kicker__mark {
		color: var(--gold);
		font-size: 0.68em;
		line-height: 1;
		transform: translateY(-0.02em);
	}
</style>
