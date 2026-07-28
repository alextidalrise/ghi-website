<script lang="ts">
	import type { MarkComponentProps } from '@portabletext/svelte';
	import type { Snippet } from 'svelte';
	import { isInternalHref, withoutCampaignParams } from '$lib/sanity/href';

	let {
		portableText,
		children
	}: { portableText: MarkComponentProps<{ href?: string }>; children?: Snippet } = $props();

	// Campaign tags on a link to our own site corrupt GA4 acquisition data and are invisible
	// in ours — see `$lib/sanity/href`. Editors can paste them into any link field, so they
	// are removed here rather than trusted not to arrive.
	const href = $derived(withoutCampaignParams(portableText.value?.href ?? '#'));
	// Only http(s) links to other origins open in a new tab; internal and mailto/tel stay in
	// place, including an internal link written as an absolute URL.
	const external = $derived(/^https?:\/\//i.test(href) && !isInternalHref(href));
</script>

<a
	{href}
	target={external ? '_blank' : undefined}
	rel={external ? 'noopener noreferrer' : undefined}
>
	{@render children?.()}
</a>
