<script lang="ts">
	import type { GolfCourseCardData } from '$lib/sanity/transforms';

	type Props = {
		courses: GolfCourseCardData[];
		heading: string;
		summary?: string;
	};

	let { courses, heading, summary }: Props = $props();

	const summaryLine = $derived(
		summary ??
			(courses.length === 1 ? '1 championship course' : `${courses.length} championship courses`)
	);
</script>

{#if courses.length > 0}
	<section class="golf-courses" aria-labelledby="golf-courses-heading">
		<div class="golf-courses__head">
			<h2 id="golf-courses-heading">{heading}</h2>
			{#if summaryLine}
				<p class="golf-courses__summary">{summaryLine}</p>
			{/if}
		</div>

		<ul class="golf-courses__grid">
			{#each courses as course, index (course.href)}
				<li class="course-tile" style="--reveal-delay: {index * 70}ms">
					<a class="course-tile__link" href={course.href}>
						<span class="course-tile__media">
							<img
								src={course.image}
								alt={course.alt}
								width="600"
								height="800"
								loading="lazy"
							/>
							<span class="course-tile__scrim" aria-hidden="true"></span>
						</span>
						<span class="course-tile__body">
							{#if course.communityLabel}
								<span class="course-tile__community">{course.communityLabel}</span>
							{/if}
							<span class="course-tile__name">{course.name}</span>
							<span class="course-tile__cue">
								{#if course.tagline}
									<span class="course-tile__tagline">{course.tagline}</span>
								{:else if course.holes != null}
									<span class="course-tile__tagline">{course.holes} holes</span>
								{/if}
								<svg
									class="course-tile__arrow"
									width="18"
									height="9"
									viewBox="0 0 18 9"
									fill="none"
									aria-hidden="true"
								>
									<path d="M0 4.5h15.5M12 1l4 3.5-4 3.5" stroke="currentColor" stroke-width="1.25" />
								</svg>
							</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.golf-courses {
		min-width: 0;
	}

	.golf-courses__head {
		display: grid;
		gap: var(--space-xs);
		margin-bottom: var(--space-lg);
	}

	.golf-courses__summary {
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-ui);
	}

	.golf-courses__grid {
		list-style: none;
		display: grid;
		gap: var(--space-md);
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	@media (max-width: 900px) {
		.golf-courses__grid {
			grid-auto-flow: column;
			grid-auto-columns: min(72vw, 18rem);
			grid-template-columns: unset;
			overflow-x: auto;
			scroll-snap-type: x mandatory;
			padding-bottom: var(--space-sm);
			margin-inline: calc(-1 * var(--content-pad));
			padding-inline: var(--content-pad);
		}
	}

	.course-tile {
		min-width: 0;
		scroll-snap-align: start;
	}

	.course-tile__link {
		display: grid;
		grid-template-rows: 1fr auto;
		min-height: 100%;
		color: inherit;
		text-decoration: none;
		border: 1px solid var(--border);
		background: var(--white);
	}

	.course-tile__media {
		position: relative;
		display: block;
		aspect-ratio: 3 / 4;
		overflow: hidden;
	}

	.course-tile__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.course-tile__scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgb(0 0 0 / 0.45), transparent 55%);
	}

	.course-tile__body {
		display: grid;
		gap: var(--space-xs);
		padding: var(--space-md);
	}

	.course-tile__community {
		font-size: var(--text-overline);
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.course-tile__name {
		font-family: var(--serif);
		font-size: var(--text-h4);
		color: var(--green);
	}

	.course-tile__cue {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.course-tile__tagline {
		font-size: var(--text-ui);
		color: var(--muted);
	}

	.course-tile__arrow {
		flex-shrink: 0;
		color: var(--green);
	}
</style>
