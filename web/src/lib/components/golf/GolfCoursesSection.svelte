<script lang="ts">
	import ListingRail from '$lib/components/listing/ListingRail.svelte';
	import type { GolfCourseCardData } from '$lib/sanity/transforms';

	type Props = {
		courses: GolfCourseCardData[];
		heading: string;
		summary?: string;
	};

	let { courses, heading, summary }: Props = $props();

	const summaryLine = $derived(
		summary ??
			(courses.length === 1
				? '1 championship course nearby'
				: `${courses.length} championship courses nearby`)
	);

	// A quiet cue only earns its place once the rail overflows the content column
	// (roughly more than three cards). Hidden on phones, where the peeking next card
	// already signals the swipe.
	const showScrollCue = $derived(courses.length > 3);

	/** Factual spec line, dot-separated like the property cards (holes · par · design). */
	function specsFor(course: GolfCourseCardData): string[] {
		const parts: string[] = [];
		if (course.holes != null) parts.push(`${course.holes} holes`);
		if (course.par != null) parts.push(`Par ${course.par}`);
		if (course.designStyle) {
			parts.push(course.designStyle.charAt(0).toUpperCase() + course.designStyle.slice(1));
		}
		return parts;
	}
</script>

{#if courses.length > 0}
	<!-- Emphasis Ladder tier 2 (see DESIGN.md): the courses are a listing rail, so they
	     stay on white and are set apart by full-bleed hairline rules + whitespace, not a
	     colour band. Green is reserved for the page's single heaviest moment. -->
	<section class="golf" aria-labelledby="golf-courses-heading">
		<div class="golf__inner">
			<div class="golf__head">
				<h2 id="golf-courses-heading" class="golf__title">{heading}</h2>
				<div class="golf__head-row">
					<p class="golf__summary">{summaryLine}</p>
					{#if showScrollCue}
						<span class="golf__cue" aria-hidden="true">‹ scroll ›</span>
					{/if}
				</div>
			</div>
		</div>

		<ListingRail
			items={courses}
			getKey={(course, index) => `${course.href}-${index}`}
			bleed
			labelledby="golf-courses-heading"
		>
			{#snippet card(course)}
				{@const specs = specsFor(course)}
				<a class="course-tile" href={course.href}>
					<span class="course-tile__media">
						<img src={course.image} alt={course.alt} width="600" height="400" loading="lazy" />
					</span>
					<span class="course-tile__body">
						{#if course.communityLabel}
							<span class="course-tile__community">{course.communityLabel}</span>
						{/if}
						<span class="course-tile__name">{course.name}</span>
						{#if specs.length > 0}
							<span class="course-tile__specs">
								{#each specs as spec}<span>{spec}</span>{/each}
							</span>
						{/if}
					</span>
				</a>
			{/snippet}
		</ListingRail>
	</section>
{/if}

<style>
	/* Tier-2 distinction: a full-bleed white band bracketed by hairline rules. Breaks out
	   of the content column to the viewport edges so the rules run edge to edge; the
	   page-level `overflow-x: clip` absorbs the scrollbar gutter (same as Frontline). */
	.golf {
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		background: var(--white);
		border-block: 1px solid var(--border);
		padding-block: clamp(3rem, 4.5vw, 4.25rem);
	}

	/* Head aligns to the same edge gutter as the bleeding rail below it. */
	.golf__inner {
		padding-inline: var(--content-padding);
	}

	.golf__head {
		margin-bottom: var(--space-lg);
	}

	.golf__title {
		color: var(--green);
		max-width: 22ch;
	}

	/* Summary (left) and the scroll cue (right) share one baseline row under the title. */
	.golf__head-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-md) var(--space-lg);
		margin-top: var(--space-sm);
	}

	.golf__summary {
		margin: 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--muted);
	}

	.golf__cue {
		flex-shrink: 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		color: var(--green);
	}

	@media (max-width: 767px) {
		.golf__cue {
			display: none;
		}
	}

	/* --- Course tile (light surface, mirrors SpotlightCard's light variant) --- */
	.course-tile {
		display: flex;
		flex-direction: column;
		height: 100%;
		color: inherit;
		text-decoration: none;
		border: 1px solid var(--border);
		background: var(--white);
		transition: transform var(--duration-lift) var(--ease);
	}

	.course-tile__media {
		position: relative;
		display: block;
		aspect-ratio: 3 / 2;
		overflow: hidden;
	}

	.course-tile__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--duration-image) var(--ease);
	}

	.course-tile__body {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-md);
	}

	.course-tile__community {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.course-tile__name {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h4);
		line-height: 1.2;
		color: var(--green);
	}

	/* Dot-separated factual specs, identical rhythm to the property card spec line. */
	.course-tile__specs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.7rem;
		margin-top: 0.15rem;
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--muted);
	}

	.course-tile__specs span:not(:last-child)::after {
		content: '';
		display: inline-block;
		width: 3px;
		height: 3px;
		margin-left: 0.7rem;
		border-radius: 50%;
		background: var(--gold);
		vertical-align: middle;
	}

	/* Hover / focus: lift the card and ease the photograph in. */
	.course-tile:hover,
	.course-tile:focus-visible {
		transform: translateY(-6px);
	}

	.course-tile:hover .course-tile__media img,
	.course-tile:focus-visible .course-tile__media img {
		transform: scale(1.03);
	}

	.course-tile:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		.course-tile,
		.course-tile__media img {
			transition: none;
		}

		.course-tile:hover,
		.course-tile:focus-visible,
		.course-tile:hover .course-tile__media img,
		.course-tile:focus-visible .course-tile__media img {
			transform: none;
		}
	}
</style>
