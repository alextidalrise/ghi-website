<script lang="ts">
	import { getConsent } from '$lib/analytics';
	import { bannerBody } from '$lib/consent/copy';
	import { commitConsent } from '$lib/consent/commit';

	/**
	 * The consent banner.
	 *
	 * Deliberately NOT modal and deliberately not focus-trapped: a first-time visitor
	 * arriving on a property page should be able to keep reading. It is a region placed
	 * early in the document so a keyboard or screen-reader user meets it straight away,
	 * while being visually parked in the corner for everyone else.
	 *
	 * Accept and reject are rendered with the same button class, the same width and the
	 * same padding, differing only in their label. That equality is a compliance
	 * requirement, not a stylistic preference — see docs/consent-ui-brief.md.
	 */
	const consent = getConsent();

	// Set while a decision that will reload the page is being recorded, so the reload
	// reads as a consequence of the click rather than a page refreshing on its own.
	let saving = $state(false);

	let bannerEl = $state<HTMLElement | null>(null);

	/**
	 * Publish the banner's height so the page can reserve room for it.
	 *
	 * Only consumed below 760px (see global.css), where the banner is full-width and
	 * stacked on top of the sticky enquiry console. On desktop it is a corner panel and
	 * reserving a band of empty page for it would cost more than it saves.
	 */
	$effect(() => {
		const el = bannerEl;
		if (!el) return;

		const observer = new ResizeObserver(([entry]) => {
			document.body.style.setProperty(
				'--consent-banner-height',
				`${entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height}px`
			);
		});
		observer.observe(el);

		return () => {
			observer.disconnect();
			document.body.style.removeProperty('--consent-banner-height');
		};
	});

	async function decide(next: { analytics: boolean; marketing: boolean }) {
		if (saving) return;
		await commitConsent(consent, next, (value) => (saving = value));
	}
</script>

{#if consent.needsPrompt}
	<section
		class="consent-banner"
		bind:this={bannerEl}
		aria-labelledby="consent-banner-title"
	>
		<h2 class="consent-banner__title" id="consent-banner-title">Cookies on this site</h2>

		<!-- Two variants rather than one truncated string: on a phone the banner sits above
		     the enquiry console, so every saved line is a line of property back on screen.
		     Swapped with display:none, which hides the unused one from assistive tech too. -->
		<p class="consent-banner__body consent-banner__body--wide">
			{bannerBody('wide')}
			<a class="consent-banner__policy" href="/cookies">Cookie policy</a>
		</p>
		<p class="consent-banner__body consent-banner__body--narrow">
			{bannerBody('narrow')}
			<a class="consent-banner__policy" href="/cookies">Cookie policy</a>
		</p>

		{#if saving}
			<p class="consent-banner__status" role="status">Saving your choice…</p>
		{:else}
			<div class="consent-banner__actions">
				<button
					type="button"
					class="consent-banner__button consent-banner__button--accept"
					onclick={() => decide({ analytics: true, marketing: true })}
				>
					Accept all
				</button>
				<button
					type="button"
					class="consent-banner__button consent-banner__button--reject"
					onclick={() => decide({ analytics: false, marketing: false })}
				>
					Reject all
				</button>
			</div>

			<button
				type="button"
				class="consent-banner__manage"
				onclick={() => consent.openPreferences()}
			>
				Manage preferences
			</button>
		{/if}
	</section>
{/if}

<style>
	/* A white object resting on the page, not a system-level slab. Emphasis Ladder tier 2:
	   a utility surface must not compete with the page's one green band. Bottom-LEFT on
	   desktop because the sticky enquiry rail owns the right-hand side. */
	.consent-banner {
		position: fixed;
		/* Clears the mobile enquiry console (z-index 30); sits under the scrim (90),
		   the nav drawer (95) and SiteNav (100). */
		z-index: 40;
		left: var(--space-lg);
		bottom: var(--space-lg);
		width: min(30rem, calc(100vw - var(--space-lg) * 2));
		padding: var(--space-md);
		background: var(--white);
		border: 1px solid var(--border);
		box-shadow: 0 -12px 32px -20px oklch(0.2 0.03 165 / 0.55);
		/* Entrance enhances an already-visible element: if the animation never runs, the
		   banner is simply there. Visibility is never gated on a transition. */
		animation: consent-banner-in 0.4s var(--ease) both;
	}

	@keyframes consent-banner-in {
		from {
			opacity: 0;
			transform: translateY(0.75rem);
		}
	}

	.consent-banner__title {
		font-family: var(--serif);
		font-size: var(--text-h4);
		font-weight: 400;
		line-height: 1.25;
		color: var(--green);
	}

	.consent-banner__body {
		margin-top: var(--space-xs);
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.6;
		/* --charcoal, not --muted: this is the sentence the decision rests on. */
		color: var(--charcoal);
		text-wrap: pretty;
	}

	.consent-banner__body--narrow {
		display: none;
	}

	.consent-banner__policy {
		color: var(--green);
		text-decoration: none;
		border-bottom: 1px solid var(--gold);
		transition: color var(--duration-hover) var(--ease);
	}

	.consent-banner__policy:hover,
	.consent-banner__policy:focus-visible {
		color: var(--gold);
	}

	.consent-banner__actions {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-md);
	}

	/* Shared geometry: both decisions are the same size, the same shape and one click.
	   They differ in hue only — never in weight. Rejecting must stay exactly as easy as
	   accepting, so neither may become an outline, a text link or a smaller target while
	   the other is filled: that asymmetry is the standard cookie-banner audit finding. */
	.consent-banner__button {
		flex: 1 1 0;
		min-height: 3rem;
		padding: 0.875rem 1rem;
		border: 1px solid transparent;
		font-family: var(--sans);
		font-size: 0.85rem;
		font-weight: 400;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.consent-banner__button--accept {
		background: var(--green);
		border-color: var(--green);
		color: var(--white);
	}

	/* Each button darkens its own hue on hover rather than trading colours with the
	   other: a crossover reads as playful, which is wrong for a compliance control.
	   Derived shades of the existing tokens, in the same idiom as --green-soft. */
	.consent-banner__button--accept:hover,
	.consent-banner__button--accept:focus-visible {
		background: color-mix(in srgb, var(--green) 80%, black);
		border-color: color-mix(in srgb, var(--green) 80%, black);
	}

	/* Charcoal rather than green: a solid fill of equal weight that stays clearly a
	   second, distinct choice instead of reading as a duplicate of Accept. */
	.consent-banner__button--reject {
		background: var(--charcoal);
		border-color: var(--charcoal);
		color: var(--white);
	}

	.consent-banner__button--reject:hover,
	.consent-banner__button--reject:focus-visible {
		background: color-mix(in srgb, var(--charcoal) 80%, black);
		border-color: color-mix(in srgb, var(--charcoal) 80%, black);
	}

	.consent-banner__manage {
		display: inline-block;
		margin-top: var(--space-sm);
		padding: 0.25rem 0;
		background: none;
		border: 0;
		border-bottom: 1px solid transparent;
		color: var(--muted);
		font-family: var(--sans);
		font-size: var(--text-small);
		cursor: pointer;
		transition:
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.consent-banner__manage:hover,
	.consent-banner__manage:focus-visible {
		color: var(--green);
		border-bottom-color: var(--gold);
	}

	.consent-banner__status {
		margin-top: var(--space-md);
		/* Matches the button row's height so the panel does not collapse as the reload
		   is prepared. */
		min-height: 3rem;
		display: flex;
		align-items: center;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--muted);
	}

	.consent-banner__button:focus-visible,
	.consent-banner__manage:focus-visible,
	.consent-banner__policy:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 2px;
	}

	/* Below 760px the banner goes full-width and seats itself directly on top of the
	   sticky enquiry console, which the property pages pin to the bottom of the viewport.
	   Both stay reachable; neither is hidden. */
	@media (max-width: 760px) {
		.consent-banner {
			left: 0;
			right: 0;
			bottom: var(--bottom-inset-enquire, 0px);
			width: auto;
			padding: var(--space-md) var(--space-sm);
			border-left: 0;
			border-right: 0;
			border-bottom: 0;
		}

		.consent-banner__body--wide {
			display: none;
		}

		.consent-banner__body--narrow {
			display: block;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.consent-banner {
			animation: none;
		}

		.consent-banner__button,
		.consent-banner__manage,
		.consent-banner__policy {
			transition: none;
		}
	}
</style>
