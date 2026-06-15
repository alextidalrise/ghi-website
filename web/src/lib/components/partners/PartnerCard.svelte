<script lang="ts">
	import { type Partner, partnerIntroHref } from '$lib/partners/partners';

	type Props = {
		partner: Partner;
	};

	let { partner }: Props = $props();

	const introHref = $derived(partnerIntroHref(partner));
</script>

<!-- The card is a query container: it goes logo-left/body-right when it has the room
     (a category with one partner, full width) and stacks when it sits in a narrower
     column (two partners side by side, or on a phone). -->
<article class="partner-card" id="partner-{partner.slug}">
	<a class="partner-card__link" href={introHref}>
		<div class="partner-card__logo">
			{#if partner.logo}
				<img
					src={partner.logo.url}
					srcset={partner.logo.srcset}
					alt={partner.logo.alt}
					loading="lazy"
				/>
			{:else}
				<span class="partner-card__logo-placeholder">{partner.name}</span>
			{/if}
		</div>

		<div class="partner-card__body">
			<div class="partner-card__head">
				<h3 class="partner-card__name">{partner.name}</h3>
				<p class="partner-card__coverage">{partner.coverage}</p>
			</div>

			<p class="partner-card__desc">{partner.description}</p>

			<span class="partner-card__cta">
				Request an introduction
				<svg
					class="partner-card__arrow"
					width="18"
					height="9"
					viewBox="0 0 18 9"
					fill="none"
					aria-hidden="true"
				>
					<path d="M0 4.5h15.5M12 1l4 3.5-4 3.5" stroke="currentColor" stroke-width="1.25" />
				</svg>
			</span>
		</div>
	</a>
</article>

<style>
	.partner-card {
		container-type: inline-size;
		min-width: 0;
		height: 100%;
		/* Clear the fixed nav when arrived at via a #partner-<slug> anchor from the homepage wall. */
		scroll-margin-top: calc(var(--nav-height) + var(--space-md));
	}

	/* One focusable target covers the whole card: the buyer is always heading to the
	   same introduction request, so the entire surface is the link. */
	.partner-card__link {
		display: grid;
		height: 100%;
		border: 1px solid var(--border);
		text-decoration: none;
		color: inherit;
		transition: border-color var(--duration-hover) var(--ease);
	}

	.partner-card__link:hover,
	.partner-card__link:focus-visible {
		border-color: var(--gold);
	}

	.partner-card__link:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* Logo panel: white with a hairline divider, never a fill (no tinted surfaces). */
	.partner-card__logo {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-lg);
		border-bottom: 1px solid var(--border);
		min-height: 8rem;
	}

	.partner-card__logo img {
		max-width: 100%;
		max-height: 3.25rem;
		width: auto;
		height: auto;
		object-fit: contain;
		filter: grayscale(1);
		opacity: 0.78;
		transition:
			filter var(--duration-hover) var(--ease),
			opacity var(--duration-hover) var(--ease);
	}

	.partner-card__link:hover .partner-card__logo img,
	.partner-card__link:focus-visible .partner-card__logo img {
		filter: grayscale(0);
		opacity: 1;
	}

	/* Placeholder reads as a quiet "logo lands here" marker in the wordmark serif,
	   not a chip. Replaced the moment a real logo is supplied in the data. */
	.partner-card__logo-placeholder {
		font-family: var(--serif);
		font-size: var(--text-h4);
		font-weight: 400;
		color: var(--muted);
		text-align: center;
		text-wrap: balance;
	}

	.partner-card__body {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-md);
		padding: var(--space-lg);
	}

	.partner-card__head {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.partner-card__name {
		color: var(--green);
	}

	.partner-card__coverage {
		font-family: var(--sans);
		font-size: var(--text-small);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.partner-card__desc {
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--charcoal);
		max-width: 60ch;
	}

	.partner-card__cta {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		margin-top: auto;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		transition: color var(--duration-hover) var(--ease);
	}

	.partner-card__arrow {
		color: var(--gold);
		transition: transform var(--duration-hover) var(--ease);
	}

	.partner-card__link:hover .partner-card__cta,
	.partner-card__link:focus-visible .partner-card__cta {
		color: var(--gold);
	}

	.partner-card__link:hover .partner-card__arrow,
	.partner-card__link:focus-visible .partner-card__arrow {
		transform: translateX(4px);
	}

	/* With room, the card turns horizontal: a fixed logo rail on the left, the body
	   carrying the right. The divider follows suit (right edge, not bottom). */
	@container (min-width: 34rem) {
		.partner-card__link {
			grid-template-columns: minmax(13rem, 17rem) 1fr;
		}

		.partner-card__logo {
			border-bottom: none;
			border-right: 1px solid var(--border);
		}

		.partner-card__body {
			padding: var(--space-xl);
		}
	}
</style>
