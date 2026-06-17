<script lang="ts">
	import { buildGolfCourseRefHref, type PublicGolf } from '$lib/sanity/transforms';

	type Props = {
		golf: PublicGolf | null | undefined;
	};

	let { golf }: Props = $props();

	const course = $derived(golf?.linkedGolfCourses?.[0] ?? null);
	const href = $derived(buildGolfCourseRefHref(course));
</script>

{#if course?.name}
	<aside class="course-card" aria-label="Linked golf course">
		<p class="course-card__eyebrow text-overline">Linked golf course</p>
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
