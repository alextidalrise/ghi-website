<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { trackSignUp } from '$lib/analytics';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// ActionData is a union of both actions' results; read it through one loose view.
	type Result = {
		success?: boolean;
		saved?: boolean;
		step?: 'markets';
		email?: string;
		token?: string;
		markets?: string[];
		error?: string;
		invalidEmail?: boolean;
	};
	const result = $derived((form ?? {}) as Result);

	// Sign up first, countries after: Subscribe sits right under the email field.
	const stage = $derived(
		result.saved ? 'saved' : result.success || result.step === 'markets' ? 'markets' : 'subscribe'
	);

	let submitting = $state(false);
	let doneHeading = $state<HTMLHeadingElement>();
	let followForm = $state<HTMLFormElement>();

	// Each step replaces the last in place, so keyboard and screen-reader focus would
	// otherwise drop to the page body. Land it on the new step's heading. On a phone the
	// country step then runs past the fold, so scroll just far enough to bring its Save
	// button on screen; "nearest" moves nothing when it already fits, as on desktop.
	$effect(() => {
		if (stage === 'subscribe') return;
		doneHeading?.focus({ preventScroll: true });
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		followForm?.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
	});

	const chosen = $derived(new Set(result.step === 'markets' ? (result.markets ?? []) : []));
	const savedNames = $derived(
		new Intl.ListFormat('en-GB', { type: 'conjunction' }).format(
			data.markets.filter((m) => result.markets?.includes(m.slug)).map((m) => m.name)
		)
	);

	// Carried into Mailchimp as a `Campaign:` tag (sanitised server-side), so a post or
	// story's link can be told apart from the bio link.
	const campaign = $derived(page.url.searchParams.get('utm_campaign') ?? '');

	const submit: SubmitFunction = () => {
		submitting = true;
		return async ({ result, update }) => {
			// Only a confirmed sign-up counts, never the click, and never the country step.
			// See docs/analytics.md.
			if (result.type === 'success' && result.data?.success) trackSignUp('newsletter_page');
			await update({ reset: false });
			submitting = false;
		};
	};
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<link rel="canonical" href={data.seo.canonicalUrl} />
	{#if data.seo.noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}

	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.seo.canonicalUrl} />
	<meta property="og:title" content="The Golf Homes International newsletter" />
	<meta property="og:description" content={data.seo.description} />
</svelte:head>

<div class="newsletter">
	<div class="newsletter__offer">
		<h1 class="newsletter__title">New golf homes and market notes, by email.</h1>

		<ul class="newsletter__gets">
			<li>
				<strong>New homes</strong>
				<span>in the countries you choose, sent as they come to market.</span>
			</li>
			<li>
				<strong>Regular market notes</strong>
				<span>on the places we cover and what is changing in them.</span>
			</li>
		</ul>
	</div>

	<div class="newsletter__band">
		<div class="newsletter__panel">
			{#if stage === 'saved'}
				<div class="newsletter__done" role="status">
					<h2 class="newsletter__done-title" tabindex="-1" bind:this={doneHeading}>You're all set.</h2>
					<p>
						{#if savedNames}
							We'll send you new homes in {savedNames}, and our regular market notes.
						{:else}
							Look out for our next email.
						{/if}
					</p>
					<a class="newsletter__link" href="/">
						Browse homes now <span aria-hidden="true">&rarr;</span>
					</a>
				</div>
			{:else if stage === 'markets'}
				<div class="newsletter__done" role="status">
					<h2 class="newsletter__done-title" tabindex="-1" bind:this={doneHeading}>You're subscribed.</h2>
					<p>Look out for our next email. You can unsubscribe from any of them.</p>
				</div>

				{#if data.markets.length > 0}
					<form
						class="newsletter__follow"
						method="POST"
						action="?/markets"
						use:enhance={submit}
						novalidate
						bind:this={followForm}
					>
						<input type="hidden" name="email" value={result.email ?? ''} />
						<input type="hidden" name="token" value={result.token ?? ''} />

						<fieldset class="newsletter__markets">
							<legend class="newsletter__question">Which countries interest you?</legend>
							<p class="newsletter__hint">We'll send new homes from the ones you choose.</p>
							<div class="newsletter__chips">
								{#each data.markets as market (market.slug)}
									<label class="newsletter__chip">
										<input
											type="checkbox"
											name="markets"
											value={market.slug}
											checked={chosen.has(market.slug)}
										/>
										<span class="newsletter__tick" aria-hidden="true"></span>
										{market.name}
									</label>
								{/each}
							</div>
						</fieldset>

						{#if result.error}
							<p class="newsletter__error" role="alert">{result.error}</p>
						{/if}

						<button class="newsletter__submit" type="submit" disabled={submitting}>
							{submitting ? 'Saving…' : 'Save countries'}
						</button>
						<a class="newsletter__skip" href="/">Skip, and browse homes</a>
					</form>
				{:else}
					<a class="newsletter__link" href="/">
						Browse homes now <span aria-hidden="true">&rarr;</span>
					</a>
				{/if}
			{:else}
				<form method="POST" action="?/subscribe" use:enhance={submit} novalidate>
					<div class="newsletter__field">
						<label class="newsletter__label" for="newsletter-email">Email address</label>
						<input
							id="newsletter-email"
							class="newsletter__input"
							type="email"
							name="email"
							autocomplete="email"
							inputmode="email"
							required
							value={result.email ?? ''}
							aria-invalid={result.invalidEmail ? 'true' : undefined}
							aria-describedby={result.error ? 'newsletter-error' : undefined}
						/>
					</div>

					<!-- Hidden from people, filled in by bots. See $lib/server/newsletterSignup. -->
					<div class="newsletter__trap" aria-hidden="true">
						<label for="newsletter-trap">Leave this field blank</label>
						<input id="newsletter-trap" type="text" name="nl_hp_leave_blank" tabindex="-1" autocomplete="off" />
					</div>
					{#if campaign}
						<input type="hidden" name="campaign" value={campaign} />
					{/if}

					{#if result.error}
						<p id="newsletter-error" class="newsletter__error" role="alert">{result.error}</p>
					{/if}

					<button class="newsletter__submit" type="submit" disabled={submitting}>
						{submitting ? 'Subscribing…' : 'Subscribe'}
					</button>

					<p class="newsletter__consent">
						By subscribing you agree to receive our emails. Unsubscribe any time. See our
						<a href="/privacy">privacy policy</a>.
					</p>
				</form>
			{/if}
		</div>
	</div>
</div>

<style>
	/* A split page: the offer on white, the form on the page's one green band. The band is
	   what gives the page its voice; the offer stays plain so the promise reads first.
	   Fills the screen below the nav so a short page never leaves a white sliver between
	   the band and the footer: the band takes whatever height the offer leaves. */
	.newsletter {
		display: grid;
		grid-template-rows: auto 1fr;
		min-height: calc(100svh - var(--nav-height));
	}

	.newsletter__offer {
		padding: var(--space-xl) var(--content-padding) var(--space-lg);
	}

	/* The Frontline band's surface: a soft light from the top-left settling into a deeper
	   green, with gold hairlines where it meets the nav above and the footer below. */
	.newsletter__band {
		--band-ink-soft: rgba(245, 241, 232, 0.82);
		--band-rule: rgba(214, 195, 163, 0.55);
		--band-deep: oklch(0.28 0.033 165);
		padding: var(--space-xl) var(--content-padding);
		background:
			radial-gradient(120% 90% at 14% -20%, oklch(0.37 0.05 165) 0%, transparent 52%),
			linear-gradient(180deg, oklch(0.31 0.035 165) 0%, oklch(0.24 0.03 165) 100%);
		border-block: 1px solid oklch(0.82 0.05 85 / 0.28);
		color: var(--on-green);
	}

	.newsletter__band ::selection {
		background: var(--gold);
		color: var(--green);
	}

	/* Side by side from 56rem: a 50/50 split filling the first screen. Each half's outer
	   padding lines its content up with the site's 1060px column, so the headline sits
	   under the logo's gutter while the green runs to the viewport edge. */
	@media (min-width: 56rem) {
		.newsletter {
			--edge: max(
				var(--content-padding),
				calc((100vw - var(--content-max)) / 2 + var(--content-padding))
			);
			grid-template-columns: 1fr 1fr;
			grid-template-rows: auto;
		}

		.newsletter__offer {
			align-self: center;
			padding: var(--space-2xl) var(--space-2xl) var(--space-2xl) var(--edge);
		}

		.newsletter__band {
			display: flex;
			align-items: center;
			padding: var(--space-2xl) var(--edge) var(--space-2xl) var(--space-2xl);
		}
	}

	.newsletter__panel {
		width: 100%;
		max-width: 27rem;
	}

	.newsletter__title {
		max-width: 16ch;
		font-family: var(--serif);
		font-size: var(--text-display);
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: var(--tracking-tight);
		color: var(--green);
		text-wrap: balance;
	}

	.newsletter__gets {
		display: grid;
		gap: var(--space-sm);
		max-width: 36ch;
		margin-top: var(--space-lg);
		padding: 0;
		list-style: none;
	}

	.newsletter__gets li {
		position: relative;
		padding-left: 1.25rem;
		font-size: 1.0625rem;
		font-weight: 300;
		line-height: 1.6;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	/* The site's gold diamond mark: an accent, never type. */
	.newsletter__gets li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.62em;
		width: 0.4rem;
		height: 0.4rem;
		background: var(--gold);
		transform: rotate(45deg);
	}

	.newsletter__gets strong {
		font-weight: 500;
		color: var(--green);
	}

	/* ── The form on green: the contact panel's concierge idiom ── */

	/* The country step, after "You're subscribed.": ruled off from the confirmation so it
	   reads as a separate, optional question. */
	.newsletter__follow {
		margin-top: var(--space-lg);
		padding-top: var(--space-lg);
		border-top: 1px solid rgba(245, 241, 232, 0.16);
	}

	.newsletter__question {
		padding: 0;
		font-family: var(--serif);
		font-size: var(--text-h4);
		font-weight: 400;
		line-height: 1.25;
		color: var(--on-green);
	}

	.newsletter__hint {
		margin: 0.35rem 0 var(--space-md);
		font-size: var(--text-ui);
		font-weight: 350;
		line-height: 1.6;
		color: var(--band-ink-soft);
	}

	/* A quiet exit under the gold action: underlined ivory text, never a second button. */
	.newsletter__skip {
		display: block;
		width: fit-content;
		margin: var(--space-sm) auto 0;
		padding: 0.5rem 0.25rem;
		font-size: var(--text-ui);
		color: var(--band-ink-soft);
		text-decoration: underline;
		text-decoration-color: rgba(245, 241, 232, 0.35);
		text-underline-offset: 0.25em;
		transition:
			color var(--duration-hover) var(--ease),
			text-decoration-color var(--duration-hover) var(--ease);
	}

	.newsletter__skip:hover,
	.newsletter__skip:focus-visible {
		color: var(--gold);
		text-decoration-color: var(--gold);
	}

	.newsletter__label {
		display: block;
		margin-bottom: var(--space-xs);
		font-size: var(--text-ui);
		font-weight: 400;
		color: var(--band-ink-soft);
	}

	/* Transparent field on a gold underline that brightens on focus and thickens to 2px
	   (an inset shadow, so nothing shifts). */
	.newsletter__input {
		width: 100%;
		padding: 0.75rem 0;
		border: none;
		border-bottom: 1px solid var(--band-rule);
		border-radius: 0;
		background: transparent;
		font-family: var(--sans);
		font-size: 1.0625rem;
		font-weight: 350;
		letter-spacing: 0.01em;
		color: var(--on-green);
		caret-color: var(--gold);
		transition:
			border-color var(--duration-hover) var(--ease),
			box-shadow var(--duration-hover) var(--ease);
	}

	.newsletter__input:hover {
		border-bottom-color: rgba(214, 195, 163, 0.85);
	}

	.newsletter__input:focus {
		outline: none;
		border-bottom-color: var(--gold);
		box-shadow: inset 0 -1px 0 var(--gold);
	}

	/* Browser autofill paints its own pale fill; keep the ink light and hold the fill off. */
	.newsletter__input:-webkit-autofill {
		-webkit-text-fill-color: var(--on-green);
		transition: background-color 0s 600000s;
	}

	/* Errors on green take the contact panel's warm tone; --error is for light surfaces. */
	.newsletter__input[aria-invalid='true'] {
		border-bottom-color: oklch(0.78 0.12 60);
	}

	.newsletter__markets {
		margin: 0;
		padding: 0;
		border: none;
		min-width: 0;
	}

	/* Two to a row at every width, so the markets read as one set and never leave one
	   orphaned on a row of its own. */
	.newsletter__chips {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-xs);
	}

	.newsletter__chip {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		min-height: 2.75rem;
		padding: 0 1rem 0 0.875rem;
		border: 1px solid rgba(245, 241, 232, 0.3);
		font-size: var(--text-ui);
		font-weight: 350;
		color: var(--on-green);
		cursor: pointer;
		user-select: none;
		transition:
			border-color var(--duration-hover) var(--ease),
			background var(--duration-hover) var(--ease);
	}

	.newsletter__chip input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
	}

	/* The GuideFinder indicator, inverted for green: an ivory-framed square that fills gold
	   with a band-coloured inset when chosen. */
	.newsletter__tick {
		flex-shrink: 0;
		width: 0.875rem;
		height: 0.875rem;
		border: 1px solid rgba(245, 241, 232, 0.6);
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease),
			box-shadow var(--duration-hover) var(--ease);
	}

	.newsletter__chip:hover {
		border-color: rgba(245, 241, 232, 0.6);
	}

	.newsletter__chip:has(input:checked) {
		border-color: var(--gold);
		background: rgba(214, 195, 163, 0.08);
		font-weight: 400;
	}

	.newsletter__chip:has(input:checked) .newsletter__tick {
		border-color: var(--gold);
		background: var(--gold);
		box-shadow: inset 0 0 0 2px var(--band-deep);
	}

	/* Gold clears the 3:1 floor on this green, so the site's gold ring applies here. */
	.newsletter__chip:has(input:focus-visible) {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}

	.newsletter__trap {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}

	.newsletter__error {
		margin-top: var(--space-md);
		font-size: var(--text-ui);
		line-height: 1.5;
		color: oklch(0.85 0.1 65);
	}

	/* Gold is the band's action colour, as in the footer and the contact panel. */
	.newsletter__submit {
		width: 100%;
		min-height: 3.25rem;
		margin-top: var(--space-lg);
		border: 1px solid var(--gold);
		border-radius: 0;
		background: var(--gold);
		font-family: var(--sans);
		font-size: 0.9375rem;
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.newsletter__submit:hover:not(:disabled) {
		background: var(--on-green);
		border-color: var(--on-green);
	}

	.newsletter__submit:focus-visible {
		outline: 2px solid var(--on-green);
		outline-offset: 3px;
	}

	.newsletter__submit:disabled {
		cursor: default;
		opacity: 0.75;
	}

	.newsletter__consent {
		margin-top: var(--space-sm);
		font-size: var(--text-small);
		font-weight: 350;
		line-height: 1.7;
		letter-spacing: 0.01em;
		color: rgba(245, 241, 232, 0.72);
	}

	.newsletter__consent a {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: rgba(245, 241, 232, 0.4);
		text-underline-offset: 0.2em;
	}

	.newsletter__consent a:hover,
	.newsletter__consent a:focus-visible {
		color: var(--gold);
		text-decoration-color: var(--gold);
	}

	.newsletter__done-title {
		outline: none;
		font-family: var(--serif);
		font-size: var(--text-h2);
		font-weight: 400;
		line-height: 1.1;
		color: var(--on-green);
	}

	.newsletter__done p {
		margin-top: var(--space-sm);
		font-weight: 350;
		line-height: 1.8;
		letter-spacing: 0.01em;
		color: var(--band-ink-soft);
	}

	.newsletter__link {
		display: inline-flex;
		gap: 0.4rem;
		margin-top: var(--space-md);
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--gold);
		text-decoration: none;
	}

	.newsletter__link:hover,
	.newsletter__link:focus-visible {
		text-decoration: underline;
		text-underline-offset: 0.3em;
	}

	.newsletter__link span {
		transition: transform var(--duration-hover) var(--ease);
	}

	.newsletter__link:hover span {
		transform: translateX(3px);
	}

	@media (prefers-reduced-motion: reduce) {
		.newsletter__link span {
			transition: none;
		}
	}

	/* Phones: the whole form, Subscribe included, has to clear the first screen with the
	   browser's own toolbars showing (~664px visible in Safari on a 390pt iPhone). So the
	   offer is set a step tighter here than the system defaults, without touching the copy. */
	@media (max-width: 55.99rem) {
		.newsletter__offer {
			padding-block: 1.25rem;
		}

		.newsletter__title {
			font-size: 2rem;
		}

		.newsletter__gets {
			gap: var(--space-xs);
			margin-top: var(--space-sm);
		}

		.newsletter__gets li {
			font-size: 1rem;
			line-height: 1.55;
		}

		.newsletter__band {
			padding-block-start: 1.25rem;
		}

		.newsletter__input {
			padding-block: 0.625rem;
		}

		.newsletter__submit {
			margin-top: 1.25rem;
		}
	}
</style>
