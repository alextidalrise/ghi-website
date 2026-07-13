<script lang="ts">
	import type { Review } from '$lib/reviews';
	import Stars from './Stars.svelte';

	type Props = {
		review: Review;
		/** Drops the frame. Used inside the compact variant, where an outer rule already
		    encloses the group and a bordered panel within it would be a nested card. */
		bare?: boolean;
		/**
		 * Lines of quote before clamping. Panels in a rail share the tallest one's height,
		 * so this is really the band's height dial: the longest review sets the row, and
		 * every short review pays for it in dead space beneath its own text.
		 */
		lines?: number;
	};
	let { review, bare = false, lines = 6 }: Props = $props();

	/** "March 2026". An absolute month reads better on an editorial surface than "3 months
	    ago", and — being independent of when the page renders — it can't drift between the
	    server's HTML and the client's hydration. */
	const when = $derived.by(() => {
		const d = new Date(review.publishedAt);
		if (Number.isNaN(d.getTime())) return '';
		return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
	});

	const initial = $derived(review.authorName.trim().charAt(0).toUpperCase() || '?');
</script>

<article class="panel" class:panel--bare={bare} style="--quote-lines: {lines}">
	<Stars rating={review.rating} label="{review.rating} out of 5" />

	<blockquote class="panel__quote">
		<p>{review.text}</p>
	</blockquote>

	<footer class="panel__by">
		{#if review.authorPhotoUrl}
			<img
				class="panel__avatar"
				src={review.authorPhotoUrl}
				alt=""
				width="40"
				height="40"
				loading="lazy"
				decoding="async"
				referrerpolicy="no-referrer"
			/>
		{:else}
			<!-- Plenty of Google accounts carry no avatar. A framed monogram stands in, the
			     same move the contact page makes for a missing headshot — never a broken img. -->
			<span class="panel__avatar panel__avatar--monogram" aria-hidden="true">{initial}</span>
		{/if}

		<span class="panel__who">
			<cite class="panel__name">{review.authorName}</cite>
			{#if when}
				<span class="panel__when">{when}</span>
			{/if}
		</span>
	</footer>
</article>

<style>
	/* A framed panel on white: 1px hairline, square corners, no shadow at rest. It is
	   emphatically not a floating card — the frame is the whole device. */
	.panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: var(--space-md);
		border: 1px solid var(--border);
		background: var(--white);
	}

	.panel--bare {
		padding: 0;
		border: none;
	}

	/* Bare panels have no padding for the mark to hang into, so it would hang into the page
	   gutter instead — off the left edge of the content column, invisible. Sit it on the
	   text column's edge and let the text indent past it. */
	.panel--bare .panel__quote {
		margin-left: 0;
	}

	/* The quote carries the section. Playfair at reading size, with the opening mark hung
	   into the margin so the text block stays optically flush with the stars above it. */
	/* The opening mark hangs into the gutter so the text column stays optically flush with
	   the stars above. It has to hang into the paragraph's *padding*, not outside its box:
	   line-clamp needs overflow:hidden, which would otherwise crop the mark clean off —
	   leaving a quote that closes but never opens. */
	.panel__quote {
		flex: 1;
		margin: var(--space-md) 0 0 -0.36em;
	}

	.panel__quote p {
		font-family: var(--serif);
		font-weight: 400;
		font-size: 1.0625rem;
		line-height: 1.5;
		color: var(--charcoal);
		text-wrap: pretty;
		padding-left: 0.36em;
		text-indent: -0.36em;
		/* Google reviews run from six words to four thousand characters. The panel holds
		   its height and clamps the long ones; the section's link out to the profile is
		   how a reader reaches the full text. */
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: var(--quote-lines, 8);
		line-clamp: var(--quote-lines, 8);
		overflow: hidden;
	}

	.panel__quote p::before {
		content: '\201C';
	}

	.panel__quote p::after {
		content: '\201D';
	}

	.panel__by {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border);
	}

	/* Square, 1px-framed — the same stamp treatment the country flags use. Round avatars
	   would be the only curve on the site. */
	.panel__avatar {
		flex: none;
		width: 40px;
		height: 40px;
		border: 1px solid var(--border);
		background: var(--white);
		object-fit: cover;
	}

	.panel__avatar--monogram {
		display: grid;
		place-items: center;
		font-family: var(--serif);
		font-size: 1.125rem;
		color: var(--green);
	}

	.panel__who {
		display: grid;
		min-width: 0;
	}

	.panel__name {
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 400;
		font-style: normal;
		color: var(--green);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.panel__when {
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--muted);
	}

	/* On a phone no supporting quote runs past four lines, whatever the caller asked for.
	   Vertical space is the scarce resource there, and the reader who wants the whole
	   review has the link to Google. */
	@media (max-width: 767px) {
		.panel__quote p {
			-webkit-line-clamp: 4;
			line-clamp: 4;
		}
	}
</style>
