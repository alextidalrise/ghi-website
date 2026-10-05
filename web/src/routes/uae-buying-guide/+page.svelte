<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getConsent, trackSignUp } from '$lib/analytics';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// The page renders bare (no site nav or footer; see the root layout), so it carries
	// the two things the shell would: the brand, and the legal links with Cookie settings.
	const consent = getConsent();

	type Placement = 'hero' | 'closing';
	type Result = {
		success?: boolean;
		email?: string;
		placement?: Placement;
		error?: string;
		invalidEmail?: boolean;
	};
	const result = $derived((form ?? {}) as Result);

	// Both forms show "on its way" once either succeeds: the request is done, and a second
	// form still asking would read as if it had not worked. "Use a different address"
	// reopens them.
	let editing = $state(false);
	const sent = $derived(Boolean(result.success) && !editing);

	let submitting = $state<Placement | null>(null);
	const doneHeadings: Partial<Record<Placement, HTMLHeadingElement>> = $state({});

	// The form is replaced in place, so focus would drop to the body. Land it on the
	// confirmation in whichever form was used.
	$effect(() => {
		if (sent && result.placement) doneHeadings[result.placement]?.focus();
	});

	// Carried into Mailchimp as a `Campaign:` tag (sanitised server-side), so an ad, a post
	// and a bio link can be told apart.
	const campaign = $derived(page.url.searchParams.get('utm_campaign') ?? '');

	const submit =
		(placement: Placement): SubmitFunction =>
		() => {
			submitting = placement;
			return async ({ result, update }) => {
				// A confirmed request only, never the click. See docs/analytics.md.
				if (result.type === 'success' && result.data?.success) trackSignUp('uae_guide');
				editing = false;
				await update({ reset: false });
				submitting = null;
			};
		};

	/** The guide as written. Keep in step with the PDF: the page promises what it contains. */
	const GUIDE_PAGES = 6;

	const STEPS = [
		'Choose your location',
		'Confirm the property is freehold',
		'Arrange your funds',
		'Appoint an independent lawyer',
		'Make an offer and sign Form F',
		'Inspect and complete your checks',
		'Buying off-plan',
		'Complete at the trustee office, or from abroad'
	];

	const TOPICS = [
		{ title: 'Costs of buying', note: 'Every fee in Dubai, and how Abu Dhabi differs' },
		{ title: 'Mortgages', note: 'What UAE banks lend to international buyers' },
		{ title: 'Tax as an owner', note: 'VAT, service charges and the housing fee' },
		{ title: 'Wills and succession', note: 'The step international buyers most often miss' },
		{ title: 'Residency', note: 'How a property can qualify you for a visa' }
	];

	const PREVIEWS = [
		{
			// First and full width: it is the guide's answer to the headline's "from anywhere".
			fact: 'You don’t have to fly out to complete.',
			body: 'Many buyers sign a power of attorney and complete from home. The guide explains who to appoint (usually not your lawyer) and what a document signed abroad needs first.',
			where: 'Buying without travelling'
		},
		{
			fact: 'A passport is enough to buy.',
			body: 'No residence visa, no Emirates ID, no local tax number. The banks will still ask for one thing, and it is worth having ready before you make an offer.',
			where: 'Steps 2 and 3'
		},
		{
			fact: 'About AED 188,000 on top of the price.',
			body: 'The guide’s worked example for a AED 3 million resale villa in Dubai. The transfer fee is officially shared with the seller, yet buyers usually pay all of it. Every line is set out, and why off-plan costs less.',
			where: 'Costs of buying'
		},
		{
			fact: 'The step most buyers overlook.',
			body: 'Without a registered UAE will, a property can be frozen while the estate is settled. The guide explains the two routes non-Muslim owners use to register one.',
			where: 'Wills and succession'
		},
		{
			fact: 'AED 2 million can qualify you for residency.',
			body: 'Owners can apply for long-term Golden Residency, and mortgaged and off-plan homes can count. The guide sets out who qualifies and where to apply.',
			where: 'A note on residency'
		}
	];
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
	<meta property="og:title" content="How to buy a golf home in the UAE: a free guide" />
	<meta property="og:description" content={data.seo.description} />
</svelte:head>

{#snippet requestForm(placement: Placement, tone: 'green' | 'light')}
	{@const id = `guide-${placement}`}
	{#if sent}
		<div class="request__done request__done--{tone}" role="status">
			<h2
				class="request__done-title"
				tabindex="-1"
				bind:this={doneHeadings[placement]}
			>
				Check your inbox.
			</h2>
			<p>
				The guide is on its way to <strong>{result.email}</strong>. It usually arrives within a
				few minutes. If you can’t see it, look in your promotions or spam folder.
			</p>
			<a class="request__link" href="/uae">
				While you wait, see our UAE golf homes <span aria-hidden="true">&rarr;</span>
			</a>
			<button class="request__again" type="button" onclick={() => (editing = true)}>
				Use a different address
			</button>
		</div>
	{:else}
		{@const mine = result.placement === placement || (!result.placement && placement === 'hero')}
		{@const error = mine ? result.error : undefined}
		<form
			class="request request--{tone}"
			method="POST"
			action="?/request"
			use:enhance={submit(placement)}
			novalidate
		>
			<input type="hidden" name="placement" value={placement} />
			<label class="request__label" for="{id}-email">Your email address</label>
			<input
				id="{id}-email"
				class="request__input"
				type="email"
				name="email"
				autocomplete="email"
				inputmode="email"
				required
				value={mine ? (result.email ?? '') : ''}
				aria-invalid={error && result.invalidEmail ? 'true' : undefined}
				aria-describedby={error ? `${id}-error` : undefined}
			/>

			<!-- Hidden from people, filled in by bots. See $lib/server/newsletterSignup. -->
			<div class="request__trap" aria-hidden="true">
				<label for="{id}-trap">Leave this field blank</label>
				<input id="{id}-trap" type="text" name="nl_hp_leave_blank" tabindex="-1" autocomplete="off" />
			</div>
			{#if campaign}
				<input type="hidden" name="campaign" value={campaign} />
			{/if}

			{#if error}
				<p id="{id}-error" class="request__error" role="alert">{error}</p>
			{/if}

			<button class="request__submit" type="submit" disabled={submitting !== null}>
				{submitting === placement ? 'Sending…' : 'Email me the guide'}
			</button>

			<p class="request__consent">
				We’ll email you the guide, then our newsletter of new golf homes and market notes.
				Unsubscribe any time. See our <a href="/privacy">privacy policy</a>.
			</p>
		</form>
	{/if}
{/snippet}

<main class="lander">
	<section class="hero" aria-labelledby="guide-title">
		<a class="hero__brand" href="/" aria-label="Golf Homes International home">
			<img src="/design-system/assets/logo-green.svg" alt="" width="140" height="32" />
		</a>

		<div class="hero__head">
			<p class="hero__overline">Free buying guide · Dubai &amp; Abu Dhabi</p>
			<h1 id="guide-title" class="hero__title">How to buy a golf home in the UAE, from anywhere.</h1>
			<p class="hero__lead">
				Every step, fee and form an international buyer meets, from choosing a community to
				collecting the title deed. One short PDF, free by email.
			</p>
		</div>

		<div class="hero__band">
			<div class="hero__panel">
				<div class="hero__product">
					<!-- The thing on offer, drawn rather than photographed: a cover in the PDF's own
					     layout, so the visitor sees what arrives. -->
					<div class="cover" aria-hidden="true">
						<div class="cover__bar"></div>
						{#if data.flagUrl}
							<img class="cover__flag" src={data.flagUrl} alt="" width="60" height="40" />
						{/if}
						<p class="cover__kicker">Buying guide / UAE</p>
						<p class="cover__title">How to Buy Property in the UAE as an International Buyer</p>
					</div>
					<ul class="hero__facts">
						<li>Free PDF, {GUIDE_PAGES} pages</li>
						<li>Dubai and Abu Dhabi</li>
						<li>Sent straight to your inbox</li>
					</ul>
				</div>

				{@render requestForm('hero', 'green')}
			</div>
		</div>

		<div class="hero__gets">
			<h2 class="hero__gets-title">What you’ll get</h2>
			<ul class="gets">
				<li><strong>The eight steps</strong> from first viewing to title deed, for resale and off-plan homes.</li>
				<li><strong>Every buying cost,</strong> with a worked example on a AED&nbsp;3&nbsp;million villa.</li>
				<li><strong>Mortgage limits</strong> for buyers who live outside the UAE.</li>
				<li><strong>Tax, wills and residency:</strong> what owning in the UAE involves after you buy.</li>
			</ul>
		</div>
	</section>

	<section class="inside" aria-labelledby="inside-title">
		<div class="inside__intro">
			<p class="overline">Inside the guide</p>
			<h2 id="inside-title" class="section-title">The whole purchase, in the order it happens.</h2>
		</div>

		<div class="inside__cols">
			<div>
				<h3 class="inside__col-title">The buying process</h3>
				<ol class="contents contents--steps">
					{#each STEPS as step, i (step)}
						<li><span class="contents__num">{i + 1}</span>{step}</li>
					{/each}
				</ol>
			</div>
			<div>
				<h3 class="inside__col-title">The money, and after you buy</h3>
				<ul class="contents">
					{#each TOPICS as topic (topic.title)}
						<li>
							<span class="contents__topic">{topic.title}</span>
							<span class="contents__note">{topic.note}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</section>

	<section class="preview" aria-labelledby="preview-title">
		<div class="preview__intro">
			<p class="overline">A preview</p>
			<h2 id="preview-title" class="section-title">Five things the guide will tell you.</h2>
		</div>

		<div class="preview__grid">
			{#each PREVIEWS as item (item.fact)}
				<article class="preview__item">
					<h3 class="preview__fact">{item.fact}</h3>
					<p class="preview__body">{item.body}</p>
					<p class="preview__where">In the guide: {item.where}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="closing" aria-labelledby="closing-title">
		<div class="closing__inner">
			<div class="closing__copy">
				<h2 id="closing-title" class="section-title">Get the UAE buying guide.</h2>
				<p>
					Free, {GUIDE_PAGES} pages, and in your inbox within minutes. It ends with an
					introduction to our UAE legal partner, Stevenson Bernard Law Associates, if you want one.
				</p>
			</div>
			<div class="closing__form">
				{@render requestForm('closing', 'light')}
			</div>
		</div>
	</section>
</main>

<footer class="legal">
	<p>© {new Date().getFullYear()} Golf Homes International</p>
	<ul>
		<li><a href="/privacy">Privacy</a></li>
		<li><a href="/terms">Terms</a></li>
		<li>
			<button type="button" onclick={() => consent.openPreferences()}>Cookie settings</button>
		</li>
	</ul>
</footer>

<style>
	/* ── Hero: the offer on white, the form on the page's one green band ──
	   Phones stack head → band → gets, so the email field and its button clear the first
	   screen (~664px visible on a 390pt iPhone) and the detail follows. From 56rem the band
	   takes the right half and runs to the viewport edge, like /newsletter. */
	.hero {
		display: grid;
		grid-template-areas: 'brand' 'head' 'band' 'gets';
	}

	/* The logo in place of the site nav: green on white, the one way back to the site. */
	.hero__brand {
		grid-area: brand;
		justify-self: start;
		padding: 1.25rem var(--content-padding) 0;
	}

	/* The artwork carries ~7% side bearing; pull it back so the wordmark's left edge
	   lines up with the overline and headline below. */
	.hero__brand img {
		display: block;
		width: 7.5rem;
		height: auto;
		translate: -7% 0;
	}

	.hero__brand:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 4px;
	}

	.hero__head {
		grid-area: head;
		padding: var(--space-md) var(--content-padding);
	}

	.hero__band {
		grid-area: band;
		--band-ink-soft: rgba(245, 241, 232, 0.82);
		--band-rule: rgba(214, 195, 163, 0.55);
		padding: 1.25rem var(--content-padding) var(--space-lg);
		background:
			radial-gradient(120% 90% at 14% -20%, oklch(0.37 0.05 165) 0%, transparent 52%),
			linear-gradient(180deg, oklch(0.31 0.035 165) 0%, oklch(0.24 0.03 165) 100%);
		border-block: 1px solid oklch(0.82 0.05 85 / 0.28);
		color: var(--on-green);
	}

	.hero__band ::selection {
		background: var(--gold);
		color: var(--green);
	}

	.hero__gets {
		grid-area: gets;
		padding: var(--space-lg) var(--content-padding) 0;
	}

	@media (min-width: 56rem) {
		.hero {
			--edge: max(
				var(--content-padding),
				calc((100vw - var(--content-max)) / 2 + var(--content-padding))
			);
			/* The text half's own, tighter gutters. Lining it up with the 1060px column (as
			   --edge does) left the headline and list ~400px at 1280, which pushed "What
			   you'll get" below the fold. It is a page of its own now (no nav above it), so
			   nothing needs it on that line. */
			--text-edge: clamp(var(--content-padding), 5vw, var(--edge));
			--text-inner: var(--space-xl);
			grid-template-columns: 1fr 1fr;
			/* The logo stays at the top; any spare height splits evenly above and below
			   the text, so on a tall screen it sits centred rather than sinking. */
			grid-template-rows: auto 1fr auto auto 1fr;
			grid-template-areas: 'brand band' '. band' 'head band' 'gets band' '. band';
			min-height: 100svh;
		}

		.hero__brand {
			padding: var(--space-lg) var(--text-inner) 0 var(--text-edge);
		}

		.hero__brand img {
			width: 8.75rem;
		}

		.hero__head {
			padding: var(--space-lg) var(--text-inner) 0 var(--text-edge);
		}

		.hero__gets {
			padding: var(--space-lg) var(--text-inner) var(--space-xl) var(--text-edge);
		}

		.hero__band {
			display: flex;
			align-items: center;
			padding: var(--space-2xl) var(--edge) var(--space-2xl) var(--space-2xl);
		}
	}

	.hero__panel {
		width: 100%;
		max-width: 27rem;
	}

	.hero__overline,
	.overline {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--green);
	}

	/* The site's ◆ kicker mark, in gold: an accent, never type. */
	.hero__overline::before,
	.overline::before {
		content: '';
		flex-shrink: 0;
		width: 0.4rem;
		height: 0.4rem;
		background: var(--gold);
		transform: rotate(45deg);
	}

	.hero__title {
		max-width: 17ch;
		margin-top: var(--space-sm);
		font-family: var(--serif);
		font-size: 2rem;
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: var(--tracking-tight);
		color: var(--green);
		text-wrap: balance;
	}

	.hero__lead {
		max-width: 44ch;
		margin-top: var(--space-sm);
		font-size: 1rem;
		font-weight: 300;
		line-height: 1.6;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	@media (min-width: 56rem) {
		/* A step under the display token: at full size the headline ran to four lines and
		   pushed "What you'll get" below the fold. */
		.hero__title {
			max-width: 20ch;
			font-size: clamp(2.5rem, 3vw + 1rem, 3.5rem);
		}

		/* Measure widened with the gutters, so the lines actually use the room. */
		.hero__lead {
			max-width: 54ch;
		}

		.hero__lead {
			margin-top: var(--space-md);
			font-size: 1.125rem;
		}
	}

	/* ── The product: a cover beside three plain facts ── */
	.hero__product {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: 1.25rem;
	}

	/* A miniature of the PDF's first page: white sheet, green head bar, flag, kicker and
	   title in the guide's own type. A second sheet behind it gives it depth without a
	   shadow. Sized in em so one font-size scales the whole object. */
	.cover {
		position: relative;
		flex-shrink: 0;
		width: 5.25em;
		aspect-ratio: 210 / 297;
		padding: 0.95em 0.6em 0.6em;
		background: #fff;
		font-size: 0.75rem;
		color: var(--green);
		/* The second sheet: a solid offset, not a blur, so it reads as paper, not shadow. */
		box-shadow: 0.3em 0.3em 0 -1px rgba(245, 241, 232, 0.4);
	}

	.cover__bar {
		position: absolute;
		inset: 0 0 auto;
		height: 0.35em;
		background: var(--green);
	}

	.cover__flag {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 3 / 2;
		object-fit: cover;
	}

	.cover__kicker {
		margin-top: 0.55em;
		font-size: 0.28em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.cover__title {
		margin-top: 0.3em;
		font-family: var(--serif);
		font-size: 0.5em;
		line-height: 1.15;
	}

	@media (min-width: 56rem) {
		.hero__product {
			gap: var(--space-lg);
			margin-bottom: var(--space-lg);
		}

		.cover {
			font-size: 1.35rem;
		}
	}

	.hero__facts {
		display: grid;
		gap: 0.3rem;
		padding: 0;
		list-style: none;
		font-size: var(--text-ui);
		font-weight: 350;
		line-height: 1.5;
		color: var(--band-ink-soft);
	}

	.hero__facts li:first-child {
		font-family: var(--serif);
		font-size: var(--text-h4);
		font-weight: 400;
		line-height: 1.25;
		color: var(--on-green);
	}

	/* ── What you'll get ── */
	.hero__gets-title {
		font-size: var(--text-overline);
		font-family: var(--sans);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.gets {
		display: grid;
		gap: var(--space-sm);
		max-width: 44ch;
		margin-top: var(--space-sm);
		padding: 0;
		list-style: none;
	}

	.gets li {
		position: relative;
		padding-left: 1.5rem;
		font-size: 1.0625rem;
		font-weight: 300;
		line-height: 1.6;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	/* A drawn tick, in green: this list is a promise, not a set of bullets. */
	.gets li::before {
		content: '';
		position: absolute;
		left: 0.1rem;
		top: 0.4em;
		width: 0.35rem;
		height: 0.7rem;
		border: solid var(--green);
		border-width: 0 1.5px 1.5px 0;
		transform: rotate(45deg);
	}

	@media (min-width: 56rem) {
		.gets {
			max-width: 54ch;
		}
	}

	.gets strong {
		font-weight: 500;
		color: var(--green);
	}

	/* ── Sections below the hero ── */
	.inside,
	.preview {
		max-width: var(--content-max);
		margin: 0 auto;
		padding: var(--space-2xl) var(--content-padding) 0;
	}

	.section-title {
		max-width: 22ch;
		margin-top: var(--space-sm);
		font-family: var(--serif);
		font-size: var(--text-h2);
		font-weight: 400;
		line-height: 1.1;
		color: var(--green);
		text-wrap: balance;
	}

	.inside__cols {
		display: grid;
		gap: var(--space-xl);
		margin-top: var(--space-xl);
	}

	@media (min-width: 48rem) {
		.inside__cols {
			grid-template-columns: 1fr 1fr;
			gap: var(--space-2xl);
		}
	}

	.inside__col-title {
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		color: var(--green);
	}

	/* A contents page: hairline rows, numbers in tabular figures down the left. */
	.contents {
		padding: 0;
		list-style: none;
	}

	.contents li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		column-gap: var(--space-sm);
		row-gap: 0.15rem;
		padding: 0.85rem 0;
		border-bottom: 1px solid var(--border);
		font-size: 1rem;
		font-weight: 300;
		line-height: 1.4;
		color: var(--charcoal);
	}

	.contents__num {
		width: 1.25rem;
		font-family: var(--serif);
		font-feature-settings: 'tnum';
		color: var(--green);
	}

	.contents__topic {
		font-weight: 400;
		color: var(--green);
	}

	.contents__note {
		flex-basis: 100%;
		font-size: var(--text-ui);
		color: var(--muted);
	}

	/* ── Preview: four facts, each with the rest held back ── */
	.preview__grid {
		display: grid;
		gap: var(--space-xl);
		margin-top: var(--space-xl);
	}

	@media (min-width: 48rem) {
		.preview__grid {
			grid-template-columns: 1fr 1fr;
			gap: var(--space-xl) var(--space-2xl);
		}
	}

	.preview__item {
		padding-top: var(--space-md);
		border-top: 1px solid var(--gold);
	}

	/* An odd count would orphan the last card, so the first spans the row instead and
	   the rest pair up beneath it. */
	@media (min-width: 48rem) {
		.preview__item:first-child:nth-last-child(odd) {
			grid-column: 1 / -1;
		}

		.preview__item:first-child:nth-last-child(odd) .preview__body {
			max-width: 60ch;
		}
	}

	.preview__fact {
		font-family: var(--serif);
		font-size: var(--text-h3);
		font-weight: 400;
		line-height: 1.2;
		color: var(--green);
		text-wrap: balance;
	}

	.preview__body {
		margin-top: var(--space-sm);
		font-weight: 300;
		line-height: 1.7;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	.preview__where {
		margin-top: var(--space-sm);
		font-size: var(--text-small);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--muted);
	}

	/* ── Closing ask: the page's one tint band, so it reads as its own moment without a
	   second green band. The legal line below closes the page on white. ── */
	.closing {
		margin-top: var(--space-2xl);
		padding-block: var(--space-2xl);
		background: var(--surface-tint);
	}

	.closing__inner {
		display: grid;
		gap: var(--space-lg);
		max-width: var(--content-max);
		margin: 0 auto;
		/* Padded inside the max width, like the sections above, so all their left edges
		   meet the same line. */
		padding-inline: var(--content-padding);
	}

	@media (min-width: 48rem) {
		.closing__inner {
			grid-template-columns: 1fr 1fr;
			gap: var(--space-2xl);
			align-items: center;
		}
	}

	.closing__copy p {
		max-width: 40ch;
		margin-top: var(--space-sm);
		font-weight: 300;
		line-height: 1.7;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	.closing__form {
		max-width: 27rem;
	}

	/* ── The request form, in two tones: on green (hero) and on the tint (closing) ── */
	.request__label {
		display: block;
		margin-bottom: var(--space-xs);
		font-size: var(--text-ui);
		font-weight: 400;
	}

	.request__input {
		width: 100%;
		padding: 0.75rem 0;
		border: none;
		border-bottom: 1px solid;
		border-radius: 0;
		background: transparent;
		font-family: var(--sans);
		font-size: 1.0625rem;
		font-weight: 350;
		letter-spacing: 0.01em;
		transition:
			border-color var(--duration-hover) var(--ease),
			box-shadow var(--duration-hover) var(--ease);
	}

	.request__input:focus {
		outline: none;
	}

	.request__trap {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}

	.request__error {
		margin-top: var(--space-sm);
		font-size: var(--text-ui);
		line-height: 1.5;
	}

	.request__submit {
		width: 100%;
		min-height: 3.25rem;
		margin-top: 1.25rem;
		border: 1px solid;
		border-radius: 0;
		font-family: var(--sans);
		font-size: 0.9375rem;
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.request__submit:disabled {
		cursor: default;
		opacity: 0.75;
	}

	.request__consent {
		margin-top: var(--space-sm);
		font-size: var(--text-small);
		line-height: 1.7;
		letter-spacing: 0.01em;
	}

	.request__consent a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	/* On green: the contact panel's idiom. Gold underline and a gold action. */
	.request--green .request__label {
		color: var(--band-ink-soft);
	}

	.request--green .request__input {
		border-bottom-color: var(--band-rule);
		color: var(--on-green);
		caret-color: var(--gold);
	}

	.request--green .request__input:hover {
		border-bottom-color: rgba(214, 195, 163, 0.85);
	}

	.request--green .request__input:focus {
		border-bottom-color: var(--gold);
		box-shadow: inset 0 -1px 0 var(--gold);
	}

	.request--green .request__input:-webkit-autofill {
		-webkit-text-fill-color: var(--on-green);
		transition: background-color 0s 600000s;
	}

	.request--green .request__input[aria-invalid='true'] {
		border-bottom-color: oklch(0.78 0.12 60);
	}

	.request--green .request__error {
		color: oklch(0.85 0.1 65);
	}

	.request--green .request__submit {
		border-color: var(--gold);
		background: var(--gold);
		color: var(--green);
	}

	.request--green .request__submit:hover:not(:disabled) {
		background: var(--on-green);
		border-color: var(--on-green);
	}

	.request--green .request__submit:focus-visible {
		outline: 2px solid var(--on-green);
		outline-offset: 3px;
	}

	.request--green .request__consent {
		font-weight: 350;
		color: rgba(245, 241, 232, 0.72);
	}

	.request--green .request__consent a:hover,
	.request--green .request__consent a:focus-visible {
		color: var(--gold);
	}

	/* On the tint: the site's form elements. A green underline and the primary button. */
	.request--light .request__label {
		color: var(--charcoal);
	}

	.request--light .request__input {
		border-bottom-color: var(--muted);
		color: var(--charcoal);
	}

	.request--light .request__input:focus {
		border-bottom-color: var(--green);
		box-shadow: inset 0 -1px 0 var(--green);
	}

	.request--light .request__input[aria-invalid='true'] {
		border-bottom-color: var(--error);
	}

	.request--light .request__error {
		color: var(--error);
	}

	.request--light .request__submit {
		border-color: var(--green);
		background: var(--green);
		color: var(--white);
	}

	.request--light .request__submit:hover:not(:disabled) {
		background: var(--charcoal);
		border-color: var(--charcoal);
	}

	.request--light .request__submit:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.request--light .request__consent {
		font-weight: 300;
		color: var(--muted);
	}

	.request--light .request__consent a:hover,
	.request--light .request__consent a:focus-visible {
		color: var(--green);
	}

	/* ── Sent ── */
	.request__done-title {
		outline: none;
		font-family: var(--serif);
		font-size: var(--text-h2);
		font-weight: 400;
		line-height: 1.1;
	}

	.request__done p {
		margin-top: var(--space-sm);
		line-height: 1.8;
		letter-spacing: 0.01em;
	}

	.request__done p strong {
		font-weight: 500;
		overflow-wrap: anywhere;
	}

	.request__done--green .request__done-title {
		color: var(--on-green);
	}

	.request__done--green p {
		font-weight: 350;
		color: var(--band-ink-soft);
	}

	.request__done--light .request__done-title {
		color: var(--green);
	}

	.request__done--light p {
		font-weight: 300;
		color: var(--charcoal);
	}

	.request__link {
		display: inline-flex;
		gap: 0.4rem;
		margin-top: var(--space-md);
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
	}

	.request__done--green .request__link {
		color: var(--gold);
	}

	.request__done--light .request__link {
		color: var(--green);
	}

	.request__link:hover,
	.request__link:focus-visible {
		text-decoration: underline;
		text-underline-offset: 0.3em;
	}

	.request__link span {
		transition: transform var(--duration-hover) var(--ease);
	}

	.request__link:hover span {
		transform: translateX(3px);
	}

	/* A quiet way back to the form: underlined text, never a second button. */
	.request__again {
		display: block;
		margin-top: var(--space-sm);
		padding: 0.5rem 0;
		border: none;
		background: none;
		font-family: var(--sans);
		font-size: var(--text-ui);
		text-decoration: underline;
		text-underline-offset: 0.25em;
		cursor: pointer;
	}

	.request__done--green .request__again {
		color: var(--band-ink-soft);
	}

	.request__done--light .request__again {
		color: var(--muted);
	}

	/* ── Legal line: what the site footer would have carried, and nothing else ── */
	.legal {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-xs) var(--space-md);
		max-width: var(--content-max);
		margin: 0 auto;
		padding: var(--space-md) var(--content-padding);
		font-size: var(--text-small);
		color: var(--muted);
	}

	.legal ul {
		display: flex;
		gap: var(--space-md);
		padding: 0;
		list-style: none;
	}

	.legal a,
	.legal button {
		display: inline-block;
		padding: 0.25rem 0;
		border: none;
		background: none;
		font: inherit;
		color: inherit;
		text-decoration: underline;
		text-decoration-color: var(--border);
		text-underline-offset: 0.2em;
		cursor: pointer;
	}

	.legal a:hover,
	.legal a:focus-visible,
	.legal button:hover,
	.legal button:focus-visible {
		color: var(--green);
		text-decoration-color: var(--gold);
	}

	@media (prefers-reduced-motion: reduce) {
		.request__link span {
			transition: none;
		}
	}
</style>
