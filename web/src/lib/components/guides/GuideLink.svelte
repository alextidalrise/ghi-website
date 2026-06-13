<script lang="ts">
	import type { MarkComponentProps } from '@portabletext/svelte';
	import type { Snippet } from 'svelte';

	let {
		portableText,
		children
	}: { portableText: MarkComponentProps<{ href?: string }>; children?: Snippet } = $props();

	const href = $derived(portableText.value?.href ?? '#');
	// Only http(s) links to other origins open in a new tab; internal and mailto/tel stay in place.
	const external = $derived(/^https?:\/\//i.test(href));
</script>

<a
	{href}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
>
	{@render children?.()}
</a>
