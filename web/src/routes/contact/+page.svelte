<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import GoogleReviewsCompact from '$lib/components/reviews/GoogleReviewsCompact.svelte';
	import TrustedPartners from '$lib/components/home/TrustedPartners.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data, form } = $props();

	// James is the named first point of contact across the site (see About). Photo is
	// intentionally null until the real headshot lands — a sized monogram stands in,
	// never a broken <img>, matching the About team treatment.
	const lead = {
		name: 'James Pryor',
		initials: 'JP',
		photo: null as string | null,
		role: 'James leads the day to day and is the person you will speak to when you enquire.'
	};

	// Real, reachable line — the same number /soon uses for its advisor path. WhatsApp
	// opens with context prefilled; the tel: link calls or texts the same number.
	const phoneDisplay = '+44 7496 443109';
	const phoneHref = 'tel:+447496443109';
	const whatsAppHref =
		'https://wa.me/447496443109?text=' +
		encodeURIComponent("Hello, I'd like to enquire about a property with Golf Homes International.");

	function launchWhatsApp() {
		window.open(whatsAppHref, '_blank', 'noopener');
	}

	// What happens after an enquiry lands. Specific, not aphoristic; reassurance for an
	// audience that buys abroad once or twice in a lifetime.
	const nextSteps = [
		'We reply within one working day, usually sooner.',
		'We ask a few questions to understand what you are after: the area, the budget, the timing.',
		'No pressure and no obligation. Your details stay with us and never go to a sales list.'
	];

	// Form state. Initialised from the server action's echoed values so a no-JS submit
	// repopulates after a failed post; with JS, use:enhance keeps these across a retry.
	let name = $state(untrack(() => form?.values?.name ?? ''));
	let email = $state(untrack(() => form?.values?.email ?? ''));
	let phone = $state(untrack(() => form?.values?.phone ?? ''));
	let message = $state(untrack(() => form?.values?.message ?? ''));

	let submitting = $state(false);
	let clientErrors = $state<Record<string, string>>({});
	let topError = $state('');

	let nameInput = $state<HTMLInputElement>();
	let emailInput = $state<HTMLInputElement>();
	let messageInput = $state<HTMLTextAreaElement>();

	// Success and server-side errors resolve from either the live submit (local state)
	// or the server `form` prop, so the page behaves correctly with or without JS.
	const succeeded = $derived(form?.success === true);
	const shownTopError = $derived(topError || form?.error || '');

	function errorFor(field: string): string {
		return clientErrors[field] || form?.fieldErrors?.[field] || '';
	}

	function isValidEmail(value: string) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
	}

	// Progressive enhancement over the `?/enquire` action (which posts to HubSpot
	// server-side). Validate client-side for instant feedback; the server revalidates
	// and remains the source of truth.
	const handleEnquire: SubmitFunction = ({ formData, cancel }) => {
		topError = '';
		const errors: Record<string, string> = {};
		if (!String(formData.get('name') ?? '').trim()) errors.name = 'Please tell us your name.';
		if (!isValidEmail(String(formData.get('email') ?? '')))
			errors.email = 'Please enter a valid email address.';
		if (!String(formData.get('message') ?? '').trim())
			errors.message = 'Please add a short message so we know how to help.';

		clientErrors = errors;
		if (Object.keys(errors).length > 0) {
			cancel();
			requestAnimationFrame(() => {
				if (errors.name) nameInput?.focus();
				else if (errors.email) emailInput?.focus();
				else messageInput?.focus();
			});
			return;
		}

		submitting = true;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'success') {
				// Let the `form` prop update so the confirmation renders in place.
				await update();
			} else if (result.type === 'failure') {
				const payload = result.data as
					| { error?: string; fieldErrors?: Record<string, string> }
					| undefined;
				topError = payload?.error ?? '';
				clientErrors = payload?.fieldErrors ?? {};
				await update({ reset: false });
				requestAnimationFrame(() => emailInput?.focus());
			} else {
				topError = 'Something went wrong. Please try again.';
				await update({ reset: false });
			}
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
	<meta property="og:title" content={data.seo.title} />
	<meta property="og:description" content={data.seo.description} />

	{@html jsonLdScriptHtml(data.breadcrumbJsonLd)}
</svelte:head>

<article class="contact-page">
	<Breadcrumbs items={data.breadcrumbs} hideCurrent />

	<!-- Hero — white editorial. The page's green is spent on the contained enquiry
	     panel below, not a full-bleed band. -->
	<header class="hero content-wrap">
		<h1 class="hero__title">Tell us what you're looking for</h1>
		<p class="hero__lead">
			Whether you are ready to view or just starting to picture it, we are here to help you buy
			golf property in Spain and Portugal. Tell us a little about what you have in mind and the
			right person will be in touch.
		</p>
	</header>

	<!-- Core: human reassurance (left) + the enquiry panel (right). On phones the human
	     side comes first, then the form. -->
	<section class="enquiry content-wrap" aria-labelledby="enquiry-heading">
		<h2 id="enquiry-heading" class="visually-hidden">Get in touch</h2>

		<div class="enquiry__grid">
			<div class="reach">
				<!-- Who replies -->
				<div class="reach__person">
					<div class="reach__portrait">
						{#if lead.photo}
							<img src={lead.photo} alt={`Portrait of ${lead.name}`} loading="lazy" />
						{:else}
							<span class="reach__monogram" aria-hidden="true">{lead.initials}</span>
						{/if}
					</div>
					<div class="reach__person-text">
						<p class="reach__flag text-overline">Your first point of contact</p>
						<h3 class="reach__name">{lead.name}</h3>
						<p class="reach__role">{lead.role}</p>
					</div>
				</div>

				<!-- Direct paths -->
				<div class="reach__direct">
					<h3 class="reach__subhead">Or reach us directly</h3>
					<button type="button" class="reach__whatsapp" onclick={launchWhatsApp}>
						<svg class="reach__whatsapp-glyph" viewBox="0 0 32 32" aria-hidden="true">
							<path
								d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.44 1.64 6.3L3 29l6.86-1.8A12.9 12.9 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-2.04 0-3.94-.58-5.55-1.58l-.4-.24-4.07 1.07 1.08-3.97-.26-.41A10.74 10.74 0 0 1 5.2 16C5.2 10.04 10.04 5.2 16 5.2S26.8 10.04 26.8 16 21.96 26.8 16 26.8z"
							/>
							<path
								d="M21.6 18.86c-.3-.16-1.78-.92-2.06-1.02-.28-.1-.48-.16-.68.15-.2.3-.78.96-.96 1.16-.18.2-.36.22-.66.07-.3-.15-1.27-.49-2.41-1.55-.89-.83-1.49-1.85-1.66-2.16-.18-.3-.02-.47.13-.62.14-.14.3-.36.46-.54.15-.18.2-.3.3-.51.1-.2.05-.38-.02-.54-.07-.15-.68-1.7-.93-2.32-.24-.6-.49-.52-.68-.53l-.58-.01c-.2 0-.53.08-.81.38-.28.3-1.06 1.06-1.06 2.58s1.09 3 1.24 3.2c.15.21 2.13 3.4 5.18 4.77.72.32 1.29.51 1.73.65.73.24 1.39.2 1.91.12.58-.09 1.78-.74 2.04-1.46.25-.71.25-1.32.18-1.45-.07-.13-.27-.21-.57-.36z"
							/>
						</svg>
						<span>Message us on WhatsApp</span>
					</button>
					<a class="reach__phone" href={phoneHref}>
						<span class="reach__phone-label">Call or text</span>
						<span class="reach__phone-number tabular-nums">{phoneDisplay}</span>
					</a>
					<p class="reach__note">
						Prefer to put it in writing? Send the enquiry and it comes straight to us.
					</p>
				</div>

				<!-- What happens next -->
				<div class="reach__next">
					<h3 class="reach__subhead">What happens next</h3>
					<ul class="reach__steps">
						{#each nextSteps as step (step)}
							<li>{step}</li>
						{/each}
					</ul>
				</div>
			</div>

			<!-- The enquiry panel — the page's single green moment, in the EnquiryRail
			     concierge language. Sticky beside the reassurance on wide screens. -->
			<div class="panel-wrap">
				<div class="panel on-dark">
					{#if succeeded}
						<div class="panel__confirm" role="status" aria-live="polite">
							<svg class="panel__check" viewBox="0 0 24 24" aria-hidden="true">
								<path d="M4 12.5 9.5 18 20 6" fill="none" stroke="currentColor" stroke-width="2" />
							</svg>
							<h3 class="panel__confirm-head">Thank you, your enquiry is with us</h3>
							<p class="panel__confirm-note">
								{lead.name.split(' ')[0]} will reply within one working day. If you would rather not wait,
								message us on WhatsApp and we will pick it up right away.
							</p>
						</div>
					{:else}
						<h3 class="panel__heading">Send an enquiry</h3>
						<p class="panel__intro">A few details and {lead.name.split(' ')[0]} will take it from there.</p>

						<form
							class="panel__form"
							method="POST"
							action="?/enquire"
							use:enhance={handleEnquire}
							novalidate
						>
							{#if shownTopError}
								<p class="panel__alert" role="alert">{shownTopError}</p>
							{/if}

							<label class="field" class:field--error={Boolean(errorFor('name'))}>
								<span class="field__label">Name</span>
								<input
									bind:this={nameInput}
									bind:value={name}
									type="text"
									name="name"
									autocomplete="name"
									aria-invalid={Boolean(errorFor('name'))}
									aria-describedby={errorFor('name') ? 'err-name' : undefined}
									disabled={submitting}
									required
								/>
								{#if errorFor('name')}
									<span class="field__error" id="err-name">{errorFor('name')}</span>
								{/if}
							</label>

							<label class="field" class:field--error={Boolean(errorFor('email'))}>
								<span class="field__label">Email</span>
								<input
									bind:this={emailInput}
									bind:value={email}
									type="email"
									name="email"
									autocomplete="email"
									aria-invalid={Boolean(errorFor('email'))}
									aria-describedby={errorFor('email') ? 'err-email' : undefined}
									disabled={submitting}
									required
								/>
								{#if errorFor('email')}
									<span class="field__error" id="err-email">{errorFor('email')}</span>
								{/if}
							</label>

							<label class="field">
								<span class="field__label">Phone <em>(optional)</em></span>
								<input
									bind:value={phone}
									type="tel"
									name="phone"
									autocomplete="tel"
									disabled={submitting}
								/>
							</label>

							<label class="field" class:field--error={Boolean(errorFor('message'))}>
								<span class="field__label">Message</span>
								<textarea
									bind:this={messageInput}
									bind:value={message}
									name="message"
									rows="4"
									aria-invalid={Boolean(errorFor('message'))}
									aria-describedby={errorFor('message') ? 'err-message' : undefined}
									disabled={submitting}
									required
								></textarea>
								{#if errorFor('message')}
									<span class="field__error" id="err-message">{errorFor('message')}</span>
								{/if}
							</label>

							<button type="submit" class="panel__submit" disabled={submitting}>
								<span>{submitting ? 'Sending…' : 'Send enquiry'}</span>
								{#if !submitting}
									<svg viewBox="0 0 26 12" fill="none" aria-hidden="true">
										<path d="M0 6h23M19 1.5 24 6l-5 4.5" stroke="currentColor" stroke-width="1.5" />
									</svg>
								{/if}
							</button>
						</form>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Reassurance directly beneath the form, where the hesitation actually is. Quiet by
	     construction: a hairline, two quotes, no rail. It answers "are these people real?"
	     for someone whose cursor is already in the message field. -->
	<div class="content-wrap contact-reviews">
		<GoogleReviewsCompact data={data.reviews} />
	</div>

	<!-- The advisor network — tier 2: full-bleed white, hairline-bracketed. Real partner
	     logo wall (shared with the homepage), linking through to the directory. -->
	<section class="network" aria-labelledby="partners-heading">
		<div class="network__inner content-wrap">
			<TrustedPartners
				partners={data.partnerLogos.length ? data.partnerLogos : undefined}
				heading="An introduction to the right people"
				subhead="Lawyers, tax advisers, mortgage brokers and people on the ground. Use your own, or let us introduce you to a network we know and trust."
				ctaLabel="View our partners"
				ctaHref="/partners"
				ctaSupport="Tell us what you need when you enquire and we will connect you with the right specialist."
			/>
		</div>
	</section>
</article>

<style>
	.contact-page {
		padding-bottom: 0;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	/* ---- Hero ---------------------------------------------------------------- */
	.hero {
		padding-top: var(--space-xl);
		padding-bottom: var(--section-gap);
	}

	.hero__title {
		margin-bottom: var(--space-md);
		max-width: 18ch;
	}

	.hero__lead {
		font-family: var(--sans);
		font-weight: 300;
		font-size: 1.125rem;
		line-height: 1.7;
		color: var(--charcoal);
		max-width: 52ch;
	}

	/* ---- Core grid ----------------------------------------------------------- */
	.enquiry {
		padding-bottom: var(--section-gap);
	}

	.enquiry__grid {
		display: grid;
		gap: var(--space-2xl);
		align-items: start;
	}

	@media (min-width: 920px) {
		.enquiry__grid {
			/* Reassurance carries the width; the form panel is the anchored column. */
			grid-template-columns: minmax(0, 1fr) minmax(0, 26rem);
			gap: clamp(2.5rem, 4vw, 4.5rem);
		}
	}

	/* ---- Reach (human side) -------------------------------------------------- */
	.reach {
		display: grid;
		gap: var(--space-2xl);
	}

	.reach__subhead {
		margin-bottom: var(--space-md);
		color: var(--green);
	}

	/* Who replies — portrait + role, the About masthead treatment at one row. */
	.reach__person {
		display: grid;
		grid-template-columns: 7rem 1fr;
		gap: var(--space-lg);
		align-items: start;
	}

	.reach__portrait {
		position: relative;
		width: 7rem;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		border: 1px solid var(--border);
		background: var(--green);
	}

	.reach__portrait img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.reach__monogram {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--serif);
		font-size: 1.875rem;
		color: var(--on-green);
		letter-spacing: 0.02em;
	}

	.reach__flag {
		margin-bottom: var(--space-xs);
		color: var(--gold);
	}

	.reach__name {
		color: var(--green);
	}

	.reach__role {
		margin-top: var(--space-sm);
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.75;
		color: var(--charcoal);
		max-width: 46ch;
	}

	/* Direct paths */
	.reach__whatsapp {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.7rem;
		width: 100%;
		max-width: 26rem;
		min-height: 3.25rem;
		padding: 0 1.5rem;
		border: 1px solid var(--green);
		background: var(--green);
		color: var(--on-green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease),
			transform var(--duration-hover) var(--ease);
	}

	.reach__whatsapp-glyph {
		width: 1.35rem;
		height: 1.35rem;
		fill: currentColor;
		flex-shrink: 0;
	}

	.reach__whatsapp:hover,
	.reach__whatsapp:focus-visible {
		background: var(--charcoal);
		border-color: var(--charcoal);
	}

	.reach__whatsapp:active {
		transform: translateY(1px);
	}

	.reach__whatsapp:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.reach__phone {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.75rem;
		margin-top: var(--space-md);
		padding-bottom: 0.4rem;
		max-width: 26rem;
		font-family: var(--sans);
		text-decoration: none;
		border-bottom: 1px solid var(--border);
		transition: border-color var(--duration-hover) var(--ease);
	}

	.reach__phone-label {
		font-size: var(--text-small);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--muted);
	}

	.reach__phone-number {
		font-size: 1.125rem;
		color: var(--green);
		transition: color var(--duration-hover) var(--ease);
	}

	.reach__phone:hover,
	.reach__phone:focus-visible {
		border-bottom-color: var(--gold);
	}

	.reach__phone:hover .reach__phone-number,
	.reach__phone:focus-visible .reach__phone-number {
		color: var(--gold);
	}

	.reach__phone:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.reach__note {
		margin-top: var(--space-md);
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.6;
		color: var(--muted);
		max-width: 40ch;
	}

	/* What happens next — gold-diamond markers, the brand's accent mark (never a
	   side-stripe). */
	.reach__steps {
		display: grid;
		gap: var(--space-md);
		list-style: none;
		max-width: 48ch;
	}

	.reach__steps li {
		position: relative;
		padding-left: 1.5rem;
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--charcoal);
	}

	.reach__steps li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55em;
		width: 6px;
		height: 6px;
		background: var(--gold);
		transform: rotate(45deg);
	}

	/* ---- Enquiry panel ------------------------------------------------------- */
	.panel-wrap {
		min-width: 0;
	}

	@media (min-width: 920px) {
		.panel-wrap {
			position: sticky;
			top: calc(var(--nav-height) + var(--space-lg));
		}
	}

	.panel {
		/* The EnquiryRail concierge surface: a soft light gathers at top-left and settles
		   into a deeper green, framed by a 1px gold hairline. */
		background:
			radial-gradient(135% 75% at 8% -8%, oklch(0.37 0.05 165) 0%, transparent 56%),
			linear-gradient(165deg, oklch(0.31 0.035 165) 0%, oklch(0.23 0.03 165) 100%);
		color: var(--on-green);
		padding: clamp(1.5rem, 1rem + 2vw, 2.25rem);
		border: 1px solid var(--gold);
		box-shadow: 0 20px 44px -30px oklch(0.08 0.02 165 / 0.75);
	}

	.panel__heading {
		color: var(--on-green);
		font-family: var(--serif);
		font-weight: 600;
		font-size: var(--text-h3);
		line-height: 1.1;
		text-wrap: balance;
	}

	.panel__intro {
		margin-top: var(--space-sm);
		font-size: var(--text-ui);
		color: rgba(245, 241, 232, 0.82);
	}

	.panel__form {
		display: grid;
		gap: var(--space-md);
		margin-top: var(--space-lg);
	}

	.panel__alert {
		padding: 0.75rem 0.9rem;
		border: 1px solid rgba(245, 241, 232, 0.4);
		background: oklch(0.23 0.03 165 / 0.6);
		font-size: var(--text-ui);
		line-height: 1.5;
		color: var(--on-green);
	}

	.field {
		display: grid;
		gap: 0.4rem;
	}

	.field__label {
		font-size: var(--text-small);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: rgba(245, 241, 232, 0.85);
	}

	.field__label em {
		font-style: normal;
		text-transform: none;
		letter-spacing: 0;
		color: rgba(245, 241, 232, 0.6);
	}

	/* Concierge fields: transparent with a gold underline that brightens on focus. */
	.field input,
	.field textarea {
		font: inherit;
		font-size: var(--text-ui);
		padding: 0.5rem 0;
		border: 0;
		border-bottom: 1px solid rgba(214, 195, 163, 0.55);
		border-radius: 0;
		background: transparent;
		color: var(--on-green);
		transition:
			border-color var(--duration-hover) var(--ease),
			opacity var(--duration-hover) var(--ease);
	}

	.field textarea {
		resize: vertical;
		min-height: 4.5rem;
		line-height: 1.6;
	}

	.field input:hover,
	.field textarea:hover {
		border-bottom-color: rgba(214, 195, 163, 0.85);
	}

	.field input:focus-visible,
	.field textarea:focus-visible {
		outline: none;
		border-bottom-color: var(--gold);
	}

	.field input:disabled,
	.field textarea:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	/* Error state — a warmer gold-leaning tone that still reads on the green panel,
	   plus the message below the field (never colour alone). */
	.field--error input,
	.field--error textarea {
		border-bottom-color: oklch(0.78 0.12 60);
	}

	.field__error {
		font-size: var(--text-small);
		line-height: 1.4;
		color: oklch(0.85 0.1 65);
	}

	.panel__submit {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		min-height: 3.25rem;
		margin-top: var(--space-xs);
		padding: 0 1.75rem;
		border: 1px solid var(--gold);
		background: var(--gold);
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			transform var(--duration-hover) var(--ease);
	}

	.panel__submit svg {
		width: 1.5rem;
		height: auto;
		transition: transform var(--duration-hover) var(--ease);
	}

	.panel__submit:hover:not(:disabled),
	.panel__submit:focus-visible:not(:disabled) {
		background: transparent;
		color: var(--gold);
	}

	.panel__submit:hover:not(:disabled) svg,
	.panel__submit:focus-visible:not(:disabled) svg {
		transform: translateX(5px);
	}

	.panel__submit:active:not(:disabled) {
		transform: translateY(1px);
	}

	.panel__submit:disabled {
		opacity: 0.7;
		cursor: progress;
	}

	.panel__submit:focus-visible {
		outline: 2px solid var(--on-green);
		outline-offset: 4px;
	}

	/* Success — replaces the form in place, calm confirmation, no confetti. */
	.panel__confirm {
		display: grid;
		justify-items: start;
		gap: var(--space-sm);
		padding-block: var(--space-md);
	}

	.panel__check {
		width: 2.5rem;
		height: 2.5rem;
		padding: 0.5rem;
		border: 1px solid var(--gold);
		color: var(--gold);
	}

	.panel__confirm-head {
		color: var(--on-green);
		font-family: var(--serif);
		font-weight: 600;
		font-size: var(--text-h3);
		line-height: 1.15;
		text-wrap: balance;
	}

	.panel__confirm-note {
		font-size: var(--text-ui);
		line-height: 1.6;
		color: rgba(245, 241, 232, 0.82);
		max-width: 42ch;
	}

	/* The advisor band below is full-bleed and opens with a hairline sitting flush at its
	   own edge, so contained content flowing into it has to bring its own clearance —
	   otherwise "Read all reviews" lands directly on the rule. Targeted at the section
	   rather than the wrapper so that a null reviews payload (the normal state until the
	   Google profile has three reviews) leaves no phantom gap behind. */
	.contact-reviews :global(.compact) {
		margin-bottom: var(--section-gap);
	}

	/* ---- Advisor network — full-bleed white, hairline-bracketed -------------- */
	.network {
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		padding-block: var(--section-gap);
		border-block: 1px solid var(--border);
	}

	/* ---- Motion: one quiet hero entrance; hover/focus carries the rest. ------- */
	@media (prefers-reduced-motion: no-preference) {
		.hero > * {
			opacity: 0;
			transform: translateY(14px);
			animation: hero-rise 0.7s var(--ease) forwards;
		}

		.hero > :nth-child(1) {
			animation-delay: 0.05s;
		}
		.hero > :nth-child(2) {
			animation-delay: 0.12s;
		}

		@keyframes hero-rise {
			to {
				opacity: 1;
				transform: none;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reach__whatsapp,
		.reach__phone,
		.reach__phone-number,
		.field input,
		.field textarea,
		.panel__submit,
		.panel__submit svg {
			transition: none;
		}
	}
</style>
