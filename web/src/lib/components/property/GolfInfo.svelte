<script lang="ts">
	import type { PublicPropertyListing } from '$lib/sanity/transforms';
	import PortableTextBlock from './PortableTextBlock.svelte';

	type Props = {
		golf: PublicPropertyListing['golf'];
		description?: PublicPropertyListing['content'] extends infer C
			? C extends { golfDescription?: infer D }
				? D
				: null
			: null;
	};

	let { golf, description }: Props = $props();

	const isRelevant = $derived(
		golf?.golfRelevance &&
			golf.golfRelevance !== 'unknown' &&
			golf.golfRelevance !== 'not_applicable'
	);

	const courses = $derived([
		...(golf?.primaryGolfCourse ? [golf.primaryGolfCourse] : []),
		...(golf?.linkedGolfCourses ?? []).filter(
			(c) => c?._id !== golf?.primaryGolfCourse?._id
		)
	]);
</script>

{#if isRelevant || (description && description.length > 0) || courses.length > 0}
	<section class="golf" aria-labelledby="golf-heading">
		<div class="content-wrap">
			<p class="golf__overline text-overline">Golf</p>
			<h2 id="golf-heading">On the course</h2>

			<PortableTextBlock value={description} />

			{#if courses.length > 0}
				<ul class="golf__courses">
					{#each courses as course (course._id)}
						<li>
							<strong>{course.name}</strong>
							{#if course.shortDescription}
								<p>{course.shortDescription}</p>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			<ul class="golf__facts">
				{#if golf?.distanceToPrimaryGolfCourse}
					<li>Distance: {golf.distanceToPrimaryGolfCourse}</li>
				{/if}
				{#if golf?.golfView}
					<li>Golf course views</li>
				{/if}
				{#if golf?.buggyAccess}
					<li>Buggy access</li>
				{/if}
				{#if golf?.golfMembershipInfo}
					<li>{golf.golfMembershipInfo}</li>
				{/if}
			</ul>
		</div>
	</section>
{/if}

<style>
	.golf {
		background: var(--linen);
		padding-block: var(--space-xl);
		border-block: 1px solid var(--border);
	}

	.golf__overline {
		margin-bottom: 0.5rem;
	}

	.golf h2 {
		margin-bottom: var(--space-md);
	}

	.golf__courses {
		list-style: none;
		margin: var(--space-md) 0 0;
		display: grid;
		gap: var(--space-sm);
	}

	.golf__courses li {
		padding: 1rem 1.25rem;
		background: var(--white);
		border: 1px solid var(--border);
	}

	.golf__courses strong {
		font-family: var(--serif);
		font-size: 1.125rem;
		color: var(--green);
		display: block;
		margin-bottom: 0.35rem;
	}

	.golf__courses p {
		font-size: var(--text-ui);
		color: var(--muted);
		margin: 0;
	}

	.golf__facts {
		list-style: none;
		margin: var(--space-md) 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
	}

	.golf__facts li {
		font-size: var(--text-small);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--border);
		background: var(--white);
		color: var(--green);
	}
</style>
