<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		/** Resolved heading, e.g. "About Marbella Golf Property". */
		heading: string;
		/** Long-form editorial body (publicDescription). Blank lines split paragraphs. */
		body: string;
	};

	let { heading, body }: Props = $props();

	const paragraphs = $derived(
		body
			.split(/\n\s*\n/)
			.map((para) => para.trim())
			.filter(Boolean)
	);

	// Lines of body copy left visible when collapsed. Mobile shows a touch more,
	// since each line is shorter; desktop stays tight so the section never owns
	// the fold.
	const COLLAPSED_LINES_DESKTOP = 4;
	const COLLAPSED_LINES_MOBILE = 6;

	// SSR / no-JS default is the fully-expanded section: the body must ship visible
	// to readers and crawlers (this section exists for SEO). Enhancement collapses
	// it; it never gates visibility behind a class.
	let enhanced = $state(false);
	let collapsed = $state(false);
	let needsReveal = $state(false);

	let bodyEl: HTMLDivElement;
	let collapsedHeight = 0;
	let prefersReducedMotion = false;

	function measure() {
		const lineHeight = parseFloat(getComputedStyle(bodyEl).lineHeight) || 28;
		const lines = window.matchMedia('(max-width: 600px)').matches
			? COLLAPSED_LINES_MOBILE
			: COLLAPSED_LINES_DESKTOP;
		collapsedHeight = lineHeight * lines;
		// Only worth clamping if there's a meaningful amount hidden.
		return bodyEl.scrollHeight > collapsedHeight + lineHeight;
	}

	function applyCollapsed() {
		bodyEl.style.maxHeight = `${collapsedHeight}px`;
	}

	function expand() {
		collapsed = false;
		if (prefersReducedMotion) {
			bodyEl.style.maxHeight = '';
			return;
		}
		// Animate from the clamped height to the measured full height, then release
		// to `none` so the section stays responsive to reflow.
		bodyEl.style.maxHeight = `${bodyEl.scrollHeight}px`;
		const onEnd = (event: TransitionEvent) => {
			if (event.propertyName !== 'max-height') return;
			bodyEl.style.maxHeight = '';
			bodyEl.removeEventListener('transitionend', onEnd);
		};
		bodyEl.addEventListener('transitionend', onEnd);
	}

	function collapse() {
		collapsed = true;
		if (prefersReducedMotion) {
			applyCollapsed();
			return;
		}
		// Pin the current full height first so the transition has a start value.
		bodyEl.style.maxHeight = `${bodyEl.scrollHeight}px`;
		requestAnimationFrame(() => {
			requestAnimationFrame(() => applyCollapsed());
		});
	}

	function toggle() {
		if (collapsed) expand();
		else collapse();
	}

	onMount(() => {
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		enhanced = true;
		if (!measure()) return;
		needsReveal = true;
		collapsed = true;
		applyCollapsed();

		let frame = 0;
		const onResize = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				if (collapsed) {
					measure();
					applyCollapsed();
				}
			});
		};
		window.addEventListener('resize', onResize);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', onResize);
		};
	});

	const bodyId = 'area-overview-body';
</script>

<section class="overview" aria-labelledby="area-overview-heading">
	<h2 id="area-overview-heading" class="overview__heading">{heading}</h2>

	<div
		class="overview__body-wrap"
		class:overview__body-wrap--collapsed={enhanced && needsReveal && collapsed}
	>
		<div
			bind:this={bodyEl}
			id={bodyId}
			class="overview__body"
			class:overview__body--enhanced={enhanced && needsReveal}
		>
			{#each paragraphs as para (para)}
				<p>{para}</p>
			{/each}
		</div>
		{#if enhanced && needsReveal && collapsed}
			<div class="overview__fade" aria-hidden="true"></div>
		{/if}
	</div>

	{#if enhanced && needsReveal}
		<button
			type="button"
			class="overview__toggle"
			aria-expanded={!collapsed}
			aria-controls={bodyId}
			onclick={toggle}
		>
			<span>{collapsed ? 'Read more' : 'Show less'}</span>
			<svg
				class="overview__chevron"
				class:overview__chevron--up={!collapsed}
				width="14"
				height="14"
				viewBox="0 0 14 14"
				fill="none"
				aria-hidden="true"
			>
				<path
					d="M3 5.5 7 9.5 11 5.5"
					stroke="currentColor"
					stroke-width="1.4"
					stroke-linecap="square"
				/>
			</svg>
		</button>
	{/if}
</section>

<style>
	.overview {
		max-width: 44rem;
	}

	.overview__heading {
		margin-bottom: var(--space-md);
	}

	.overview__body-wrap {
		position: relative;
	}

	.overview__body {
		color: var(--charcoal);
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.7;
		text-wrap: pretty;
	}

	/* Only the enhanced state clips; the no-JS default keeps the body fully open. */
	.overview__body--enhanced {
		overflow: hidden;
		transition: max-height 0.5s var(--ease);
	}

	.overview__body :global(p + p) {
		margin-top: var(--space-md);
	}

	.overview__fade {
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		height: 5rem;
		background: linear-gradient(to bottom, transparent, var(--white));
		pointer-events: none;
	}

	.overview__toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: var(--space-md);
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		transition: color var(--duration-hover) var(--ease);
	}

	.overview__toggle span {
		text-decoration: underline;
		text-decoration-color: transparent;
		text-underline-offset: 0.3em;
		transition: text-decoration-color var(--duration-hover) var(--ease);
	}

	.overview__toggle:hover,
	.overview__toggle:focus-visible {
		color: var(--gold);
	}

	.overview__toggle:hover span,
	.overview__toggle:focus-visible span {
		text-decoration-color: currentColor;
	}

	.overview__chevron {
		transition: transform var(--duration-hover) var(--ease);
	}

	.overview__chevron--up {
		transform: rotate(180deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.overview__body--enhanced,
		.overview__chevron,
		.overview__toggle,
		.overview__toggle span {
			transition: none;
		}
	}
</style>
