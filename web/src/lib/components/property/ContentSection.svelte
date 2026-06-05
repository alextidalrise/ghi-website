<script lang="ts">
	import PortableTextBlock from './PortableTextBlock.svelte';
	import type { PortableTextBlock as PtBlock } from '@portabletext/types';

	type Props = {
		title: string;
		body: PtBlock[] | null | undefined;
		/** When the caller already provides the page gutter (e.g. inside the
		    property two-column grid), skip the self-applied .content-wrap. */
		bare?: boolean;
	};

	let { title, body, bare = false }: Props = $props();
</script>

{#if body && body.length > 0}
	<section class="content-section" class:content-wrap={!bare}>
		<h2>{title}</h2>
		<div class="content-section__body"><PortableTextBlock value={body} /></div>
	</section>
{/if}

<style>
	.content-section {
		padding-block: var(--space-xl);
	}

	.content-section h2 {
		margin-bottom: var(--space-md);
	}

	.content-section__body {
		max-width: 70ch;
	}
</style>
