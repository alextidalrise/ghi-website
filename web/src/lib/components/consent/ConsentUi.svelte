<script lang="ts">
	import ConsentBanner from './ConsentBanner.svelte';
	import ConsentPreferences from './ConsentPreferences.svelte';

	type Props = {
		/** Where the banner sits. See ConsentBanner. */
		placement?: 'corner' | 'top';
	};

	let { placement = 'corner' }: Props = $props();

	/**
	 * The consent UI's single mount point, rendered once from the root layout.
	 *
	 * Both pieces read the same request-scoped store from context, so they stay in step
	 * without either owning the other: the banner can open the panel, and the panel can be
	 * opened from the footer with no banner on screen at all.
	 */
</script>

<ConsentBanner {placement} />
<ConsentPreferences />
