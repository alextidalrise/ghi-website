<script lang="ts">
	import { PortableText } from '@portabletext/svelte';
	import type { PortableTextBlock } from '@portabletext/types';

	type Props = {
		value: PortableTextBlock[] | null | undefined;
	};

	let { value }: Props = $props();
</script>

{#if value && value.length > 0}
	<div class="portable-text">
		<PortableText {value} />
	</div>
{/if}

<style>
	.portable-text :global(p) {
		margin-bottom: 1rem;
	}

	.portable-text :global(p:last-child) {
		margin-bottom: 0;
	}

	.portable-text :global(h2),
	.portable-text :global(h3),
	.portable-text :global(h4) {
		font-family: var(--serif);
		color: var(--green);
		margin: 1.75rem 0 0.75rem;
	}

	.portable-text :global(ul),
	.portable-text :global(ol) {
		margin: 0 0 1rem 1.25rem;
	}

	.portable-text :global(li) {
		margin-bottom: 0.35rem;
	}

	.portable-text :global(a) {
		color: var(--green);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.portable-text :global(blockquote) {
		border-left: 3px solid var(--gold);
		padding-left: 1rem;
		margin: 1.25rem 0;
		font-style: italic;
		color: var(--muted);
	}
</style>
