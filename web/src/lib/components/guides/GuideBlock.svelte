<script lang="ts">
	import type { BlockComponentProps } from '@portabletext/svelte';
	import type { Snippet } from 'svelte';

	let { portableText, children }: { portableText: BlockComponentProps; children?: Snippet } =
		$props();

	const style = $derived(portableText.value.style ?? 'normal');
</script>

{#if style === 'h3'}
	<h3 class="guide-body__h3">{@render children?.()}</h3>
{:else if style === 'h4'}
	<h4 class="guide-body__h4">{@render children?.()}</h4>
{:else if style === 'blockquote'}
	<blockquote class="guide-body__quote">{@render children?.()}</blockquote>
{:else}
	<p>{@render children?.()}</p>
{/if}
