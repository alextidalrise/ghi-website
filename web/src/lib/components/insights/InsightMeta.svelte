<script lang="ts">
	import { buildPublicImageUrl } from '$lib/sanity/image';
	import { authorInitials } from '$lib/insights/format';
	import type { InsightAuthor } from '$lib/insights/types';

	type Props = {
		author?: InsightAuthor | null;
		dateISO?: string | null;
		dateLabel?: string | null;
		/** Formatted reading time, e.g. "6 min read". */
		reading?: string | null;
		/** Show the author portrait / initials (used on the featured lead). */
		withAvatar?: boolean;
	};

	let { author, dateISO, dateLabel, reading, withAvatar = false }: Props = $props();

	const avatarUrl = $derived(
		withAvatar
			? buildPublicImageUrl(author?.avatar, { width: 96, height: 96, fit: 'crop', quality: 82 })
			: null
	);
	const initials = $derived(authorInitials(author?.name));
	const authorName = $derived(author?.name?.trim() || null);
</script>

<div class="insight-meta" class:insight-meta--avatar={withAvatar && authorName}>
	{#if withAvatar && authorName}
		<span class="insight-meta__avatar" aria-hidden="true">
			{#if avatarUrl}
				<img src={avatarUrl} alt="" width="40" height="40" loading="lazy" decoding="async" />
			{:else}
				<span class="insight-meta__initials">{initials}</span>
			{/if}
		</span>
	{/if}

	<ul class="insight-meta__items">
		{#if authorName}
			<li class="insight-meta__author">{authorName}</li>
		{/if}
		{#if dateLabel}
			<li><time datetime={dateISO ?? undefined}>{dateLabel}</time></li>
		{/if}
		{#if reading}
			<li>{reading}</li>
		{/if}
	</ul>
</div>

<style>
	.insight-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.insight-meta__avatar {
		flex-shrink: 0;
		width: 2.5rem;
		height: 2.5rem;
		display: grid;
		place-items: center;
		overflow: hidden;
		background: var(--green);
		color: var(--on-green);
	}

	.insight-meta__avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.insight-meta__initials {
		font-family: var(--sans);
		font-size: var(--text-small);
		font-weight: 500;
		letter-spacing: 0.02em;
	}

	.insight-meta__items {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.75rem;
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--muted);
		font-feature-settings: 'tnum';
	}

	.insight-meta__items li {
		display: inline-flex;
		align-items: center;
	}

	/* Gold dot between items — the property-card metadata idiom. */
	.insight-meta__items li + li::before {
		content: '';
		width: 3px;
		height: 3px;
		margin-right: 0.75rem;
		background: var(--gold);
		border-radius: 50%;
	}

	.insight-meta__author {
		color: var(--charcoal);
	}
</style>
