<script lang="ts">
	import { onMount } from 'svelte';
	import type { GuideTocItem } from '$lib/guides/types';

	let { items, title = 'In this guide' }: { items: GuideTocItem[]; title?: string } = $props();

	// SSR / no-JS default: the full list ships visible (it is a plain set of in-page
	// anchor links). Enhancement turns on scroll-spy and the mobile collapse.
	let enhanced = $state(false);
	let open = $state(false);
	// Set once scroll-spy starts (see onMount); the highlight only shows when enhanced.
	let activeAnchor = $state('');

	// The section the reader is currently in. On mobile the rail sticks and collapses to a
	// single bar, so this is what turns that bar into a live "you are here" indicator rather
	// than a generic, scrolled-past label. Falls back to the first item before scroll-spy runs.
	const activeIndex = $derived(Math.max(0, items.findIndex((item) => item.anchor === activeAnchor)));
	const activeItem = $derived(items[activeIndex] ?? null);

	const listId = 'guide-contents-list';

	onMount(() => {
		enhanced = true;
		activeAnchor = items[0]?.anchor ?? '';

		const sections = items
			.map((item) => document.getElementById(item.anchor))
			.filter((el): el is HTMLElement => el != null);
		if (sections.length === 0) return;

		const visible = new Set<string>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) visible.add(entry.target.id);
					else visible.delete(entry.target.id);
				}
				// The active chapter is the first (in reading order) currently in the
				// upper band of the viewport. If none qualifies mid-scroll, the last
				// active one stays lit.
				const firstVisible = items.find((item) => visible.has(item.anchor));
				if (firstVisible) activeAnchor = firstVisible.anchor;
			},
			{ rootMargin: '-25% 0px -65% 0px', threshold: 0 }
		);

		for (const section of sections) observer.observe(section);
		return () => observer.disconnect();
	});

	function handleLinkClick() {
		// Collapse the mobile drawer after a jump; harmless on desktop.
		open = false;
	}
</script>

<nav
	class="toc"
	class:toc--enhanced={enhanced}
	class:toc--open={open}
	aria-label="Guide contents"
>
	<p class="toc__heading">{title}</p>

	<button
		type="button"
		class="toc__toggle"
		aria-expanded={open}
		aria-controls={listId}
		onclick={() => (open = !open)}
	>
		<span class="toc__toggle-text">
			<span class="toc__toggle-eyebrow">{title}</span>
			{#if enhanced && activeItem}
				<span class="toc__toggle-current">
					<span class="toc__toggle-index" aria-hidden="true"
						>{String(activeIndex + 1).padStart(2, '0')}</span
					>
					{activeItem.heading}
				</span>
			{/if}
		</span>
		<svg
			class="toc__chevron"
			class:toc__chevron--up={open}
			width="14"
			height="14"
			viewBox="0 0 14 14"
			fill="none"
			aria-hidden="true"
		>
			<path d="M3 5.5 7 9.5 11 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" />
		</svg>
	</button>

	<ol id={listId} class="toc__list">
		{#each items as item, index (item.anchor)}
			<li class="toc__item">
				<a
					href={`#${item.anchor}`}
					class="toc__link"
					class:toc__link--active={enhanced && activeAnchor === item.anchor}
					aria-current={enhanced && activeAnchor === item.anchor ? 'true' : undefined}
					onclick={handleLinkClick}
				>
					<span class="toc__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
					<span class="toc__label">{item.heading}</span>
				</a>
			</li>
		{/each}
	</ol>
</nav>

<style>
	.toc {
		font-family: var(--sans);
	}

	.toc__heading,
	.toc__toggle-eyebrow {
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.toc__heading {
		margin-bottom: var(--space-md);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--border);
	}

	/* The toggle is the mobile-only title; hidden on desktop. Opaque, because on mobile the rail
	   sticks under the nav and article text scrolls beneath this bar. */
	.toc__toggle {
		display: none;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		/* Comfortable target for the older, touch audience — a full row, not a hairline of text. */
		min-height: 3rem;
		padding: var(--space-sm) 0;
		background: var(--white);
		border: 0;
		border-block: 1px solid var(--border);
		cursor: pointer;
		color: var(--muted);
		text-align: left;
	}

	/* Eyebrow over current-section, stacked. min-width:0 lets the current line ellipsize
	   instead of shoving the chevron off the row. */
	.toc__toggle-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.toc__toggle-current {
		display: flex;
		align-items: baseline;
		gap: 0.55rem;
		font-size: var(--text-ui);
		font-weight: 500;
		color: var(--green);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.toc__toggle-index {
		flex-shrink: 0;
		font-size: var(--text-small);
		font-variant-numeric: tabular-nums;
		color: var(--gold);
	}

	.toc__chevron {
		transition: transform var(--duration-hover) var(--ease);
		flex-shrink: 0;
		color: var(--muted);
	}

	.toc__chevron--up {
		transform: rotate(180deg);
	}

	.toc__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.toc__link {
		display: grid;
		grid-template-columns: 1.75rem 1fr;
		align-items: baseline;
		gap: 0.6rem;
		padding: 0.4rem 0;
		text-decoration: none;
		color: var(--muted);
		font-size: var(--text-ui);
		line-height: 1.4;
		transition: color var(--duration-hover) var(--ease);
	}

	.toc__index {
		font-size: var(--text-small);
		font-variant-numeric: tabular-nums;
		color: var(--border);
		transition: color var(--duration-hover) var(--ease);
	}

	.toc__link:hover,
	.toc__link:focus-visible {
		color: var(--green);
	}

	.toc__link:hover .toc__index,
	.toc__link:focus-visible .toc__index {
		color: var(--gold);
	}

	.toc__link--active {
		color: var(--green);
		font-weight: 500;
	}

	.toc__link--active .toc__index {
		color: var(--gold);
	}

	@media (max-width: 56rem) {
		/* Anchors the open list as a dropdown (see below). */
		.toc {
			position: relative;
		}

		.toc__heading {
			display: none;
		}

		.toc__toggle {
			display: flex;
		}

		/* Once enhanced, the list collapses behind the toggle on mobile. Without JS it
		   stays open (no toc--enhanced class), so the links are always reachable. */
		.toc--enhanced .toc__list {
			display: none;
		}

		/* Open as an overlay dropdown, not an in-flow block. The rail is sticky (see the page),
		   so if the list expanded in flow it would grow the rail's box at its original position
		   far up the page and jerk the article down under the reader. Taking it out of flow keeps
		   the sticky bar one row tall and lets the list paint over the prose instead. */
		.toc--enhanced.toc--open .toc__list {
			display: flex;
			position: absolute;
			left: 0;
			right: 0;
			top: 100%;
			z-index: 1;
			max-height: min(60vh, 24rem);
			overflow-y: auto;
			padding: var(--space-sm) var(--space-md);
			background: var(--white);
			border: 1px solid var(--border);
			border-top: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.toc__chevron,
		.toc__link,
		.toc__index {
			transition: none;
		}
	}
</style>
