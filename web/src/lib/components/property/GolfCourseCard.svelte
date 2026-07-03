<script lang="ts">
	import { buildGolfCourseRefHref, type PublicGolf } from '$lib/sanity/transforms';

	type Props = {
		golf: PublicGolf | null | undefined;
	};

	let { golf }: Props = $props();

	const courses = $derived(
		(golf?.linkedGolfCourses ?? []).filter((course) => Boolean(course?.name))
	);

	/** Factual spec line, dot-separated like the property cards (holes · par · design). */
	function specsFor(course: (typeof courses)[number]): string[] {
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
	<!-- Emphasis Ladder tier 2 (see DESIGN.md): a hairline-framed aside beside the area
	     map. Courses are a scannable list of disclosure rows — name + factual specs by
	     default, the longer story revealed on demand, with the full account living on the
	     course's own page. Built on native <details>/<summary> so it works with zero JS. -->
	<aside
		class="courses"
		aria-label={courses.length === 1 ? 'Linked golf course' : 'Linked golf courses'}
	>
		<p class="courses__eyebrow text-overline">
			{courses.length === 1 ? 'Linked golf course' : 'Linked golf courses'}
		</p>
		<ul class="courses__list">
			{#each courses as course, i (course._id ?? course.name)}
				{@const href = buildGolfCourseRefHref(course)}
				{@const specs = specsFor(course)}
				<li class="courses__item">
					<details class="course" open={i === 0}>
						<summary class="course__summary">
							<span class="course__heading">
								<span class="course__name">{course.name}</span>
								{#if specs.length > 0}
									<span class="course__specs">
										{#each specs as spec}<span>{spec}</span>{/each}
									</span>
								{/if}
							</span>
							<span class="course__toggle" aria-hidden="true">
								<svg viewBox="0 0 16 16" width="16" height="16" fill="none">
									<path
										d="M4 6l4 4 4-4"
										stroke="currentColor"
										stroke-width="1.25"
										stroke-linecap="square"
									/>
								</svg>
							</span>
						</summary>
						<div class="course__panel">
							{#if course.tagline}
								<p class="course__tagline">{course.tagline}</p>
							{/if}
							{#if course.shortDescription}
								<p class="course__desc">{course.shortDescription}</p>
							{/if}
							{#if href}
								<a class="course__link" {href}>
									View course<span class="course__link-arrow" aria-hidden="true">→</span>
								</a>
							{/if}
						</div>
					</details>
				</li>
			{/each}
		</ul>
	</aside>
{/if}

<style>
	.courses {
		border: 1px solid var(--border);
		background: var(--white);
		/* Lets ::details-content animate its auto height where supported (Chrome 129+);
		   elsewhere the reveal is instant, which is a fine fallback. */
		interpolate-size: allow-keywords;
	}

	.courses__eyebrow {
		margin: 0;
		padding: var(--space-md) var(--space-md) 0;
	}

	.courses__list {
		list-style: none;
		margin: var(--space-sm) 0 0;
		padding: 0;
	}

	.courses__item + .courses__item {
		border-top: 1px solid var(--border);
	}

	/* --- Disclosure row --- */
	.course__summary {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-sm);
		/* Comfortable touch target for the older, affluent audience. */
		padding: 1rem var(--space-md);
		cursor: pointer;
		list-style: none;
	}

	.course__summary::-webkit-details-marker {
		display: none;
	}

	.course__heading {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}

	.course__name {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h4);
		line-height: 1.2;
		color: var(--green);
		transition: color var(--duration-hover) var(--ease);
	}

	/* Dot-separated factual specs, identical rhythm to the property card spec line. */
	.course__specs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--muted);
	}

	.course__specs span:not(:last-child)::after {
		content: '';
		display: inline-block;
		width: 3px;
		height: 3px;
		margin-left: 0.6rem;
		border-radius: 50%;
		background: var(--gold);
		vertical-align: middle;
	}

	/* Chevron: rotates on open. Lives on the always-visible summary, so it toggles
	   correctly even where ::details-content height animation isn't supported. */
	.course__toggle {
		flex-shrink: 0;
		display: inline-flex;
		margin-top: 0.15rem;
		color: var(--muted);
		transition:
			transform var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.course[open] .course__toggle {
		transform: rotate(180deg);
		color: var(--green);
	}

	/* Hover / focus cues the row is interactive without shouting. */
	.course__summary:hover .course__name,
	.course__summary:focus-visible .course__name {
		color: var(--gold);
	}

	.course__summary:hover .course__toggle {
		color: var(--green);
	}

	.course__summary:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: -2px;
	}

	/* --- Revealed panel --- */
	.course::details-content {
		block-size: 0;
		overflow: clip;
		transition:
			block-size var(--duration-lift) var(--ease),
			content-visibility var(--duration-lift) allow-discrete;
	}

	.course[open]::details-content {
		block-size: auto;
	}

	.course__panel {
		padding: 0 var(--space-md) var(--space-md);
	}

	.course__tagline {
		margin: 0 0 0.5rem;
		font-family: var(--serif);
		font-style: italic;
		font-size: 1.0625rem;
		line-height: 1.35;
		color: var(--green);
	}

	.course__desc {
		margin: 0;
		font-size: var(--text-ui);
		line-height: 1.6;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	/* Text link into the course's own page — DESIGN text-link: green → gold, underline
	   on hover, arrow slides 3px. */
	.course__link {
		display: inline-flex;
		align-items: baseline;
		gap: 0.4rem;
		margin-top: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		color: var(--green);
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.course__link-arrow {
		transition: transform var(--duration-hover) var(--ease);
	}

	.course__link:hover,
	.course__link:focus-visible {
		color: var(--gold);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.course__link:hover .course__link-arrow,
	.course__link:focus-visible .course__link-arrow {
		transform: translateX(3px);
	}

	.course__link:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		.course__name,
		.course__toggle,
		.course::details-content,
		.course__link,
		.course__link-arrow {
			transition: none;
		}

		.course__link:hover .course__link-arrow,
		.course__link:focus-visible .course__link-arrow {
			transform: none;
		}
	}
</style>
