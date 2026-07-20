<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Shell for the site's legal pages.
	 *
	 * These exist because the footer has always linked to /privacy and /terms, and the
	 * consent banner will need a cookie policy to link to — dead links on legal pages are
	 * a poor look and, for consent, a compliance problem. The copy is a placeholder that
	 * must be replaced with solicitor-reviewed text before launch; `draft` renders that
	 * status honestly to anyone who lands here in the meantime, and drives `noindex` so a
	 * stub never gets indexed.
	 */
	type Props = {
		title: string;
		/** Human-readable date the copy was last touched. */
		updated: string;
		/** Placeholder copy awaiting legal review. */
		draft?: boolean;
		children: Snippet;
	};

	let { title, updated, draft = true, children }: Props = $props();
</script>

<svelte:head>
	<title>{title} — Golf Homes International</title>
	{#if draft}
		<!-- Placeholder copy must never be indexed; remove with the draft flag. -->
		<meta name="robots" content="noindex, follow" />
	{/if}
</svelte:head>

<article class="legal content-wrap">
	<header class="legal__head">
		<h1>{title}</h1>
		<p class="legal__updated text-small">Last updated {updated}</p>
	</header>

	{#if draft}
		<p class="legal__notice" role="note">
			This page is a placeholder. The final wording is being prepared and reviewed
			before launch. If you have a question in the meantime, please
			<a href="/contact">get in touch</a>.
		</p>
	{/if}

	<div class="legal__body">
		{@render children()}
	</div>
</article>

<style>
	.legal {
		padding-top: var(--space-2xl);
		padding-bottom: var(--space-2xl);
		/* Legal text is read, not scanned: a narrower measure than the site default. */
		max-width: 46rem;
	}

	.legal__head {
		padding-bottom: var(--space-md);
		border-bottom: 1px solid var(--border);
	}

	h1 {
		margin: 0;
		font-family: var(--serif);
		font-size: var(--text-h2);
		font-weight: 500;
		letter-spacing: var(--tracking-tight);
		color: var(--green);
	}

	.legal__updated {
		margin: var(--space-xs) 0 0;
		color: var(--muted);
	}

	/* Gold rule rather than a tinted panel: this is a status note, not an alert. */
	.legal__notice {
		margin: var(--space-lg) 0 0;
		padding: var(--space-sm) var(--space-md);
		border-left: 2px solid var(--gold);
		background: var(--surface-tint);
		color: var(--charcoal);
		font-size: var(--text-ui);
		line-height: 1.7;
	}

	.legal__notice a {
		color: var(--green);
	}

	.legal__body {
		margin-top: var(--space-xl);
		color: var(--charcoal);
		line-height: 1.8;
	}

	.legal__body :global(h2) {
		margin: var(--space-xl) 0 var(--space-xs);
		font-family: var(--serif);
		font-size: var(--text-h4);
		font-weight: 500;
		color: var(--green);
	}

	.legal__body :global(h2:first-child) {
		margin-top: 0;
	}

	.legal__body :global(p),
	.legal__body :global(li) {
		margin: 0 0 var(--space-sm);
	}

	.legal__body :global(ul) {
		margin: 0 0 var(--space-sm);
		padding-left: 1.25rem;
	}

	.legal__body :global(a) {
		color: var(--green);
	}

	.legal__body :global(table) {
		width: 100%;
		margin: 0 0 var(--space-md);
		border-collapse: collapse;
		font-size: var(--text-ui);
	}

	.legal__body :global(th),
	.legal__body :global(td) {
		padding: var(--space-xs) var(--space-sm);
		border-bottom: 1px solid var(--border);
		text-align: left;
		vertical-align: top;
	}

	.legal__body :global(th) {
		font-weight: 500;
		color: var(--green);
	}

	/* The cookie table is the widest thing on these pages; let it scroll rather than
	   forcing the page body to. */
	.legal__body :global(.legal-table-scroll) {
		overflow-x: auto;
	}
</style>
