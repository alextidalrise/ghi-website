<script lang="ts">
	import { buildPublicImageUrl } from '$lib/sanity/image';
	import { authorInitials } from '$lib/insights/format';
	import type { InsightAuthor } from '$lib/insights/types';

	let { author }: { author: InsightAuthor } = $props();

	const name = $derived(author.name?.trim() || null);
	const role = $derived(author.role?.trim() || null);
	const bio = $derived(author.bio?.trim() || null);
	const avatar = $derived(
		buildPublicImageUrl(author.avatar, { width: 128, height: 128, fit: 'crop', quality: 82 })
	);
	const initials = $derived(authorInitials(author.name));
</script>

{#if name && bio}
	<aside class="author-bio content-wrap" aria-label={`About ${name}`}>
		<span class="author-bio__avatar" aria-hidden="true">
			{#if avatar}
				<img src={avatar} alt="" width="64" height="64" loading="lazy" decoding="async" />
			{:else}
				<span class="author-bio__initials">{initials}</span>
			{/if}
		</span>
		<div class="author-bio__text">
			<p class="author-bio__eyebrow">Written by</p>
			<p class="author-bio__name">
				{name}{#if role}<span class="author-bio__role">, {role}</span>{/if}
			</p>
			<p class="author-bio__bio">{bio}</p>
		</div>
	</aside>
{/if}

<style>
	.author-bio {
		display: flex;
		gap: clamp(1rem, 3vw, 1.75rem);
		align-items: flex-start;
		max-width: 44rem;
		margin-inline: auto;
		padding-top: var(--space-xl);
		border-top: 1px solid var(--border);
	}

	.author-bio__avatar {
		flex-shrink: 0;
		width: 4rem;
		height: 4rem;
		display: grid;
		place-items: center;
		overflow: hidden;
		background: var(--green);
		color: var(--on-green);
	}

	.author-bio__avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.author-bio__initials {
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: 0.03em;
	}

	.author-bio__text {
		min-width: 0;
	}

	.author-bio__eyebrow {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: var(--space-xs);
	}

	.author-bio__name {
		font-family: var(--serif);
		font-size: var(--text-h4);
		color: var(--green);
	}

	.author-bio__role {
		color: var(--muted);
	}

	.author-bio__bio {
		margin-top: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--charcoal);
		max-width: 60ch;
		text-wrap: pretty;
	}
</style>
