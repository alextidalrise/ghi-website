<script lang="ts">
	import { buildGolfCourseRefHref, type PublicGolf } from '$lib/sanity/transforms';

	type Props = {
		golf: PublicGolf | null | undefined;
	};

	let { golf }: Props = $props();

	const courses = $derived((golf?.linkedGolfCourses ?? []).filter((course) => Boolean(course?.name)));
</script>

{#if courses.length > 0}
	<aside
		class="course-card"
		aria-label={courses.length === 1 ? 'Linked golf course' : 'Linked golf courses'}
	>
		<p class="course-card__eyebrow text-overline">
			{courses.length === 1 ? 'Linked golf course' : 'Linked golf courses'}
		</p>
		<ul class="course-card__list">
			{#each courses as course (course._id ?? course.name)}
				{@const href = buildGolfCourseRefHref(course)}
				<li class="course-card__item">
					{#if href}
						<h3 class="course-card__name">
							<a {href}>{course.name}</a>
						</h3>
					{:else}
						<h3 class="course-card__name">{course.name}</h3>
					{/if}
					{#if course.shortDescription}
						<p class="course-card__desc">{course.shortDescription}</p>
					{/if}
				</li>
			{/each}
		</ul>
	</aside>
{/if}

<style>
	.course-card {
		border: 1px solid var(--border);
		padding: var(--space-lg);
		background: var(--white);
	}

	.course-card__eyebrow {
		margin-bottom: var(--space-sm);
	}

	.course-card__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.course-card__item + .course-card__item {
		border-top: 1px solid var(--border);
		padding-top: var(--space-md);
	}

	.course-card__name {
		color: var(--green);
	}

	.course-card__name a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.course-card__desc {
		margin-top: var(--space-sm);
		font-size: var(--text-ui);
		line-height: 1.6;
		color: var(--charcoal);
	}
</style>
