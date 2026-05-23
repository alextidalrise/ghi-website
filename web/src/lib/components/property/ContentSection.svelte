<script lang="ts">
	import PortableTextBlock from './PortableTextBlock.svelte';
	import type { PortableTextBlock as PtBlock } from '@portabletext/types';

	type Props = {
		title: string;
		body: PtBlock[] | null | undefined;
	};

	let { title, body }: Props = $props();
</script>

{#if body && body.length > 0}
	<section class="content-section content-wrap">
		<h2>{title}</h2>
		<PortableTextBlock value={body} />
	</section>
{/if}

<style>
	.content-section {
		padding-block: var(--space-xl);
	}

	.content-section h2 {
		margin-bottom: var(--space-md);
	}
</style>
