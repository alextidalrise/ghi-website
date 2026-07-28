<script lang="ts">
	import type { CustomBlockComponentProps } from '@portabletext/svelte';
	import type { InsightRoutesBlock } from '$lib/insights/types';

	let { portableText }: { portableText: CustomBlockComponentProps<InsightRoutesBlock> } = $props();

	const value = $derived(portableText.value);
	const heading = $derived(value.heading?.trim() || 'Two routes from here');
	const labelId = $derived(`routes-${value._key}`);

	// A route without an action is a card-grid point, and an action without a stated outcome is
	// the kind of CTA a reader hesitates over. Both are required by the schema; the filter is
	// the render-time guard for documents authored before that validation existed.
	const routes = $derived(
		(value.routes ?? [])
			.map((route, i) => ({
				key: route?._key ?? String(i),
				heading: route?.heading?.trim() ?? '',
				body: route?.body?.trim() ?? '',
				label: route?.actionLabel?.trim() ?? '',
				href: route?.actionHref?.trim() ?? '',
				outcome: route?.outcome?.trim() ?? ''
			}))
			.filter((route) => route.heading && route.body && route.label && route.href)
	);
</script>

{#if routes.length > 0}
	<aside class="routes" aria-labelledby={labelId}>
		<p class="routes__label" id={labelId}>{heading}</p>
		<div class="routes__grid">
			{#each routes as route (route.key)}
				<div class="routes__route">
					<h3 class="routes__heading">{route.heading}</h3>
					<p class="routes__body">{route.body}</p>
					<a class="routes__action" href={route.href}>{route.label}</a>
					{#if route.outcome}
						<p class="routes__outcome">{route.outcome}</p>
					{/if}
				</div>
			{/each}
		</div>
	</aside>
{/if}

<style>
	/* The article's framed-block idiom (1px hairline, gold top edge, white bed) — the same
	   plate the takeaways box and the inline CTA wear, so the decision aid reads as part of
	   the same set rather than an import. Emphasis Ladder tier 2: the green band at the foot
	   of the page stays the one heavy surface. */
	.routes {
		margin-block: clamp(2rem, 5vw, 3rem);
		padding: clamp(1.25rem, 3vw, 1.75rem) clamp(1.5rem, 4vw, 2rem);
		border: 1px solid var(--border);
		border-block-start: 1px solid var(--gold);
		background: var(--white);
	}

	/* Own our paragraph margins rather than inheriting the body's prose reset. */
	.routes p {
		margin: 0;
	}

	.routes__label {
		margin-bottom: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--green);
	}

	/* Row and column gaps are set separately because they do different jobs. The row gap is the
	   only interval that separates one whole route from the other, so it has to beat every
	   interval inside a route (the largest of which is --space-md). The column gap just holds
	   the two columns apart. */
	.routes__grid {
		display: grid;
		row-gap: var(--space-xl);
		column-gap: var(--space-lg);
	}

	.routes__route {
		position: relative;
		min-width: 0;
	}

	.routes__heading {
		margin: 0 0 var(--space-xs);
		font-family: var(--serif);
		font-size: var(--text-h4);
		line-height: 1.25;
		color: var(--green);
		text-wrap: balance;
	}

	.routes__body {
		font-family: var(--sans);
		font-size: var(--text-body);
		line-height: 1.6;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	/* Outline tier, not the filled green: two routes rank equally, and the page's filled
	   button belongs to the enquiry further down. Scoped with the container class so it wins
	   over `.insight-body :global(a)` (0,2,1), which would otherwise paint the label
	   green-on-green and underline it. Full-bleed within its column so both actions present an
	   identical target and a long label wraps inside a box rather than ragging. */
	.routes .routes__action {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		/* Stacked, the route spans the article measure, and an unbounded action becomes a
		   600px slab at tablet widths. The cap is above any phone measure, so the button is
		   still edge-to-edge on a phone; the two-column layer lifts it so each action fills
		   its own column. */
		max-inline-size: 24rem;
		margin-top: var(--space-sm);
		padding: 0.7rem 1.25rem;
		background: transparent;
		color: var(--green);
		border: 1px solid var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-align: center;
		text-decoration: none;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.routes .routes__action:hover,
	.routes .routes__action:focus-visible {
		background: var(--green);
		color: var(--white);
	}

	.routes .routes__action:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* What happens after acting. Sits under the action, not above it: it answers the question
	   the button has just raised. */
	.routes__outcome {
		margin-top: var(--space-xs);
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.55;
		color: var(--muted);
		text-wrap: pretty;
	}

	/* A hairline in the gutter rather than on the route, so both columns keep an identical
	   measure. Rotates with the layout: horizontal between stacked routes, vertical between
	   columns. Same device as the card grid's. */
	.routes__route + .routes__route::before {
		content: '';
		position: absolute;
		inset-inline: 0;
		inset-block-start: calc(var(--space-xl) * -0.5);
		height: 1px;
		background: var(--border);
	}

	@media (min-width: 48rem) {
		/* Subgrid keeps the two actions on one line even when the bodies differ in length: the
		   body row takes the slack, so neither route looks like the shorter argument. Without
		   subgrid support each route simply auto-sizes its own rows and still reads correctly. */
		.routes__grid {
			grid-template-columns: 1fr 1fr;
			grid-template-rows: auto 1fr auto auto;
			/* Subgrid inherits this, so a non-zero row gap would land on top of the children's
			   own margins and space every part of a route equally — the heading as far from its
			   body as the outcome is from its button. The margins own the vertical rhythm at
			   both widths; the columns are the only thing the grid spaces here. */
			row-gap: 0;
		}

		.routes__route {
			display: grid;
			grid-row: span 4;
			grid-template-rows: subgrid;
			align-content: start;
		}

		.routes__body {
			align-self: start;
		}

		.routes .routes__action {
			max-inline-size: none;
		}

		.routes__route + .routes__route::before {
			inset-inline: auto;
			inset-inline-start: calc(var(--space-lg) * -0.5);
			inset-block: 0;
			width: 1px;
			height: auto;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.routes .routes__action {
			transition: none;
		}
	}
</style>
