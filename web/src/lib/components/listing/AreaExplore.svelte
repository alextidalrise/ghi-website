<script lang="ts">
	/**
	 * The closing "explore the area" zone on a location page. Renders the community
	 * and related-area links the page used to stack as plain vertical lists.
	 *
	 * Two link kinds, distinguished by behaviour, not just styling:
	 *  - `filter` chips (communities) refine THIS page's listings in place — the
	 *    active one shows selected so the filtered state stays legible.
	 *  - `nav` chips (related areas) leave for another area page, so they carry a
	 *    trailing arrow that nudges on hover.
	 */
	export type ExploreLink = {
		key: string;
		label: string;
		href: string;
		/** Filter chips only: this community is the one currently narrowing the page. */
		active?: boolean;
	};

	export type ExploreGroup = {
		id: string;
		heading: string;
		kind: 'filter' | 'nav';
		links: ExploreLink[];
	};

	let { groups }: { groups: ExploreGroup[] } = $props();

	const visibleGroups = $derived(groups.filter((group) => group.links.length > 0));
</script>

{#if visibleGroups.length > 0}
	<div class="explore">
		{#each visibleGroups as group (group.id)}
			<section class="explore__group" aria-labelledby={`${group.id}-heading`}>
				<h2 id={`${group.id}-heading`} class="explore__heading">{group.heading}</h2>
				<ul class="explore__chips">
					{#each group.links as link (link.key)}
						<li>
							<a
								class="chip"
								class:chip--nav={group.kind === 'nav'}
								class:chip--active={link.active}
								href={link.href}
								aria-current={link.active ? 'true' : undefined}
							>
								<span class="chip__label">{link.label}</span>
								{#if group.kind === 'nav'}
									<svg class="chip__arrow" viewBox="0 0 16 12" fill="none" aria-hidden="true">
										<path
											d="M1 6h13M10 1.5 14.5 6 10 10.5"
											stroke="currentColor"
											stroke-width="1.4"
										/>
									</svg>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

<style>
	.explore {
		display: grid;
		gap: var(--space-xl);
	}

	.explore__heading {
		margin-bottom: var(--space-md);
	}

	.explore__chips {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
	}

	/* Square outline chip — the site's link-rail vocabulary (see BackToArea). No fill
	   at rest; the hairline border and green ink carry it, matching the brand's calm,
	   negative-space aesthetic rather than a dense sitemap column. */
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.1rem;
		border: 1px solid var(--border);
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.2;
		color: var(--green);
		text-decoration: none;
		transition:
			border-color var(--duration-hover) var(--ease),
			background-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	/* Touch devices need a 44px-tall target; desktop keeps the trimmer resting height. */
	@media (pointer: coarse) {
		.chip {
			min-height: 44px;
		}
	}

	.chip:hover,
	.chip:focus-visible {
		border-color: var(--green);
		background-color: var(--surface-tint);
		color: var(--charcoal);
	}

	.chip:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 3px;
	}

	/* The community currently filtering the page reads as selected — a filled green
	   chip closes the loop with the narrowed results above. */
	.chip--active,
	.chip--active:hover,
	.chip--active:focus-visible {
		border-color: var(--green);
		background-color: var(--green);
		color: var(--on-green);
	}

	.chip__arrow {
		width: 0.875rem;
		height: 0.65rem;
		/* Sits a touch below the border tint at rest so the nudge on hover reads. */
		color: var(--muted);
		transition:
			transform var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.chip--nav:hover .chip__arrow,
	.chip--nav:focus-visible .chip__arrow {
		color: var(--green);
		transform: translateX(3px);
	}

	@media (prefers-reduced-motion: reduce) {
		.chip,
		.chip__arrow {
			transition: none;
		}

		.chip--nav:hover .chip__arrow,
		.chip--nav:focus-visible .chip__arrow {
			transform: none;
		}
	}
</style>
