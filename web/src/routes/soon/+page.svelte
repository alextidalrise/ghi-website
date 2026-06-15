<script lang="ts">
	// Pre-launch holding page. A bare, full-viewport takeover (no SiteNav/Footer —
	// see the root +layout.svelte breakout) drenched in the brand green, borrowing the
	// Frontline hero's recipe so the green and gold read as exactly the same brand.
	//
	// Two capture paths, the email one disclosed on request to keep the fold calm
	// (the same progressive-reveal idea as the property EnquiryRail): a primary
	// "notify me" email, and a quieter "speak to an advisor" path for ready buyers.

	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { data } = $props();

	// Hero from siteSettings.homepageHero (auto AVIF/WebP + srcset) via the loader, with a
	// fallback to the optimized static asset so the gate renders even if the CMS is down.
	const fallbackHeroUrl = '/design-system/assets/andalucia-golf-villa.png';
	const heroUrl = data.hero?.url ?? fallbackHeroUrl;
	const heroSrcset = data.hero?.srcset || undefined;

	let notifyOpen = $state(false);
	let submitting = $state(false);
	let submitted = $state(false);
	let email = $state('');
	let errorMessage = $state('');

	let emailInput = $state<HTMLInputElement>();

	// Advisor path → WhatsApp deep link (+44 7496 443109), with a prefilled opener so
	// the advisor has context the moment the chat lands.
	const advisorHref =
		'https://wa.me/447496443109?text=' +
		encodeURIComponent(
			"Hello, I'd like to speak to an advisor about Golf Homes International."
		);

	// Disclose the email field, then move focus into it ready to type.
	function openNotify() {
		notifyOpen = true;
		requestAnimationFrame(() => emailInput?.focus());
	}

	function isValidEmail(value: string) {
		// Pragmatic check: a single @ with text either side and a dotted domain.
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
	}

	// Progressive enhancement over the `?/notify` form action (which posts to HubSpot
	// server-side). Validate client-side for instant feedback and to skip a pointless
	// round-trip on an obvious typo; the server revalidates and is the source of truth.
	const handleNotify: SubmitFunction = ({ formData, cancel }) => {
		errorMessage = '';
		const value = String(formData.get('email') ?? '').trim();
		if (!isValidEmail(value)) {
			errorMessage = 'Please enter a valid email address.';
			cancel();
			requestAnimationFrame(() => emailInput?.focus());
			return;
		}

		submitting = true;
		return async ({ result }) => {
			submitting = false;
			if (result.type === 'success') {
				submitted = true;
			} else if (result.type === 'failure') {
				const data = result.data as { error?: string } | undefined;
				errorMessage = data?.error ?? 'Something went wrong. Please try again.';
				requestAnimationFrame(() => emailInput?.focus());
			} else {
				errorMessage = 'Something went wrong. Please try again.';
			}
		};
	};

	function launchAdvisor() {
		if (advisorHref) window.open(advisorHref, '_blank', 'noopener');
	}
</script>

<svelte:head>
	<title>Golf Homes International — Launching soon</title>
	<meta
		name="description"
		content="A curated portfolio of homes on and near Europe's premier golf courses. Launching soon. Leave your email to be the first to know."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Golf Homes International — Launching soon" />
	<meta
		property="og:description"
		content="A curated portfolio of homes on and near Europe's premier golf courses. Launching soon."
	/>
	<meta property="og:image" content={heroUrl} />
	<link
		rel="preload"
		as="image"
		href={heroUrl}
		imagesrcset={heroSrcset}
		imagesizes="100vw"
		fetchpriority="high"
	/>
</svelte:head>

<main class="holding on-dark" aria-labelledby="holding-title">
	<div class="holding__photo" aria-hidden="true">
		<img
			src={heroUrl}
			srcset={heroSrcset}
			sizes="100vw"
			alt=""
			width="1920"
			height="1080"
			fetchpriority="high"
			decoding="async"
		/>
	</div>
	<div class="holding__scrim" aria-hidden="true"></div>

	<div class="holding__inner">
		<header class="holding__top holding__rise" style="--d: 0s">
			<img
				class="holding__wordmark"
				src="/design-system/assets/logo-white.svg"
				alt="Golf Homes International"
				width="168"
				height="38"
			/>
		</header>

		<div class="holding__body">
			<p class="holding__marker holding__rise" style="--d: 0.08s">
				<span class="holding__diamond" aria-hidden="true"></span>
				Launching soon
			</p>

			<h1 id="holding-title" class="holding__title holding__rise" style="--d: 0.18s">
				A curated portfolio of homes,<br /><em>on the fairway</em>.
			</h1>

			<p class="holding__lead holding__rise" style="--d: 0.3s">
				Residences on and near the finest golf courses of Spain and Portugal, chosen
				one at a time. We are putting the final touches to the collection. Leave your
				email and you will be among the first through the door.
			</p>

			<div class="holding__actions holding__rise" style="--d: 0.42s">
				{#if submitted}
					<div class="holding__confirm" role="status" aria-live="polite">
						<svg class="holding__check" viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M4 12.5 9.5 18 20 6"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							/>
						</svg>
						<div>
							<p class="holding__confirm-head">You're on the list.</p>
							<p class="holding__confirm-note">
								We'll write to you the moment the doors open.
							</p>
						</div>
					</div>
				{:else}
					{#if !notifyOpen}
						<button
							type="button"
							class="holding__notify-trigger"
							aria-expanded="false"
							aria-controls="notify-form"
							onclick={openNotify}
						>
							Notify me at launch
						</button>
					{/if}

					<div class="holding__reveal" class:is-open={notifyOpen}>
						<div class="holding__reveal-inner" inert={!notifyOpen}>
							<form
								id="notify-form"
								class="holding__form"
								method="POST"
								action="?/notify"
								use:enhance={handleNotify}
								novalidate
							>
								<label class="holding__field">
									<span class="holding__field-label">Email address</span>
									<input
										bind:this={emailInput}
										bind:value={email}
										type="email"
										name="email"
										autocomplete="email"
										placeholder="you@example.com"
										aria-invalid={Boolean(errorMessage)}
										aria-describedby={errorMessage ? 'notify-error' : undefined}
										disabled={submitting}
										required
									/>
								</label>
								<button type="submit" class="holding__submit" disabled={submitting}>
									<span>{submitting ? 'Sending…' : 'Keep me posted'}</span>
									<svg viewBox="0 0 26 12" fill="none" aria-hidden="true">
										<path
											d="M0 6h23M19 1.5 24 6l-5 4.5"
											stroke="currentColor"
											stroke-width="1.5"
										/>
									</svg>
								</button>
							</form>
							{#if errorMessage}
								<p id="notify-error" class="holding__error" role="alert">
									{errorMessage}
								</p>
							{/if}
						</div>
					</div>
				{/if}

				<button type="button" class="holding__advisor" onclick={launchAdvisor}>
					<svg class="holding__advisor-glyph" viewBox="0 0 32 32" aria-hidden="true">
						<path
							d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.44 1.64 6.3L3 29l6.86-1.8A12.9 12.9 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-2.04 0-3.94-.58-5.55-1.58l-.4-.24-4.07 1.07 1.08-3.97-.26-.41A10.74 10.74 0 0 1 5.2 16C5.2 10.04 10.04 5.2 16 5.2S26.8 10.04 26.8 16 21.96 26.8 16 26.8z"
						/>
						<path
							d="M21.6 18.86c-.3-.16-1.78-.92-2.06-1.02-.28-.1-.48-.16-.68.15-.2.3-.78.96-.96 1.16-.18.2-.36.22-.66.07-.3-.15-1.27-.49-2.41-1.55-.89-.83-1.49-1.85-1.66-2.16-.18-.3-.02-.47.13-.62.14-.14.3-.36.46-.54.15-.18.2-.3.3-.51.1-.2.05-.38-.02-.54-.07-.15-.68-1.7-.93-2.32-.24-.6-.49-.52-.68-.53l-.58-.01c-.2 0-.53.08-.81.38-.28.3-1.06 1.06-1.06 2.58s1.09 3 1.24 3.2c.15.21 2.13 3.4 5.18 4.77.72.32 1.29.51 1.73.65.73.24 1.39.2 1.91.12.58-.09 1.78-.74 2.04-1.46.25-.71.25-1.32.18-1.45-.07-.13-.27-.21-.57-.36z"
						/>
					</svg>
					Prefer to talk now? Speak to an advisor
					<span class="holding__advisor-arrow" aria-hidden="true">→</span>
				</button>
			</div>
		</div>

		<footer class="holding__foot holding__rise" style="--d: 0.54s">
			<span>Golf homes on and near Europe's premier courses</span>
			<span class="holding__foot-places">Spain · Portugal · expanding globally</span>
		</footer>
	</div>
</main>

<style>
	.holding {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 100svh;
		overflow: hidden;
		color: var(--on-green);
		/* Frontline-shared fallback green, so the page is never bare if the photo
		   fails to load. */
		background:
			radial-gradient(120% 90% at 12% -10%, oklch(0.37 0.05 165) 0%, transparent 55%),
			linear-gradient(180deg, oklch(0.31 0.035 165) 0%, oklch(0.24 0.03 165) 100%);
		/* Gold hairline crown — the Frontline band's signature, here framing the page. */
		border-top: 2px solid var(--gold);
	}

	.holding__photo,
	.holding__scrim {
		position: absolute;
		inset: 0;
	}

	.holding__photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		/* Favour the villa and fairway over the sky. */
		object-position: 60% 62%;
	}

	/* Green-dominant scrim. The photograph reads as depth and place beneath it, never
	   competing with the type. Lighter toward the top-right so the villa is felt;
	   deepest at the base where the headline, form, and footer sit (contrast floor). */
	.holding__scrim {
		background:
			radial-gradient(120% 95% at 12% -12%, oklch(0.42 0.055 165 / 0.62) 0%, transparent 52%),
			radial-gradient(85% 70% at 22% 96%, oklch(0.15 0.025 165 / 0.55) 0%, transparent 62%),
			linear-gradient(
				152deg,
				oklch(0.27 0.038 165 / 0.92) 0%,
				oklch(0.25 0.04 165 / 0.78) 46%,
				oklch(0.28 0.05 165 / 0.6) 100%
			),
			linear-gradient(0deg, oklch(0.2 0.03 165 / 0.96) 0%, oklch(0.24 0.035 165 / 0.5) 64%);
	}

	.holding__inner {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: var(--space-xl);
		width: 100%;
		max-width: 1180px;
		margin-inline: auto;
		padding: clamp(1.75rem, 4vw, 3rem) var(--content-padding) clamp(1.75rem, 4vw, 2.75rem);
	}

	.holding__top {
		flex-shrink: 0;
	}

	.holding__wordmark {
		width: clamp(140px, 12vw, 168px);
		height: auto;
	}

	/* The body holds the page's single idea, centred in the remaining height. */
	.holding__body {
		margin-block: auto;
		max-width: 46rem;
		padding-block: var(--space-lg);
	}

	.holding__marker {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: var(--space-md);
		padding: 0.4rem 0.8rem;
		background: var(--gold);
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 600;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
	}

	.holding__diamond {
		width: 6px;
		height: 6px;
		background: currentColor;
		transform: rotate(45deg);
	}

	.holding__title {
		color: var(--on-green);
		font-size: clamp(2.5rem, 5.5vw + 0.5rem, 4.5rem);
		line-height: 1.04;
		letter-spacing: var(--tracking-tight);
		text-wrap: balance;
	}

	.holding__title em {
		font-style: italic;
		font-weight: 600;
		color: var(--gold);
	}

	.holding__lead {
		margin-top: var(--space-md);
		max-width: 36rem;
		font-family: var(--sans);
		font-size: 1.125rem;
		font-weight: 350;
		line-height: 1.75;
		letter-spacing: 0.01em;
		color: oklch(0.92 0.016 90 / 0.92);
		text-wrap: pretty;
	}

	.holding__actions {
		margin-top: var(--space-xl);
	}

	/* Primary capture — the gold button, echoing the Frontline CTA. */
	.holding__notify-trigger,
	.holding__submit {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.85rem;
		min-height: 3.25rem;
		padding: 0 1.85rem;
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
			border-color var(--duration-hover) var(--ease);
	}

	.holding__notify-trigger:hover,
	.holding__notify-trigger:focus-visible,
	.holding__submit:hover,
	.holding__submit:focus-visible {
		background: transparent;
		color: var(--gold);
	}

	.holding__notify-trigger:focus-visible,
	.holding__submit:focus-visible {
		outline: 2px solid var(--on-green);
		outline-offset: 4px;
	}

	/* While the submission is in flight: hold the gold fill, dim it, lock interaction. */
	.holding__submit:disabled {
		opacity: 0.65;
		cursor: progress;
	}

	.holding__field input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Email reveal — animate the row track so the field expands in place, the same
	   technique as EnquiryRail's disclosure. */
	.holding__reveal {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--duration-lift) var(--ease);
	}

	.holding__reveal.is-open {
		grid-template-rows: 1fr;
	}

	.holding__reveal-inner {
		overflow: hidden;
		min-height: 0;
	}

	.holding__form {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--space-md);
		max-width: 32rem;
	}

	.holding__field {
		display: grid;
		gap: 0.4rem;
		flex: 1 1 16rem;
	}

	.holding__field-label {
		font-family: var(--sans);
		font-size: var(--text-small);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: oklch(0.92 0.016 90 / 0.85);
	}

	/* Concierge field: transparent with a gold underline that brightens on focus. */
	.holding__field input {
		font: inherit;
		font-size: 1.05rem;
		padding: 0.5rem 0;
		border: 0;
		border-bottom: 1px solid oklch(0.82 0.05 85 / 0.55);
		border-radius: 0;
		background: transparent;
		color: var(--on-green);
		transition: border-color var(--duration-hover) var(--ease);
	}

	.holding__field input::placeholder {
		color: oklch(0.92 0.016 90 / 0.5);
	}

	.holding__field input:hover {
		border-bottom-color: oklch(0.82 0.05 85 / 0.85);
	}

	.holding__field input:focus-visible {
		outline: none;
		border-bottom-color: var(--gold);
	}

	.holding__field input[aria-invalid='true'] {
		border-bottom-color: oklch(0.72 0.13 35);
	}

	.holding__submit {
		flex: 0 0 auto;
	}

	.holding__submit svg {
		width: 1.4rem;
		height: 0.7rem;
		transition: transform var(--duration-hover) var(--ease);
	}

	.holding__submit:hover svg,
	.holding__submit:focus-visible svg {
		transform: translateX(5px);
	}

	.holding__error {
		margin-top: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-small);
		color: oklch(0.86 0.1 40);
	}

	/* Success confirmation, replacing the form in place. */
	.holding__confirm {
		display: flex;
		align-items: flex-start;
		gap: 0.85rem;
	}

	.holding__check {
		flex-shrink: 0;
		width: 1.75rem;
		height: 1.75rem;
		margin-top: 0.1rem;
		padding: 0.3rem;
		border: 1px solid var(--gold);
		color: var(--gold);
	}

	.holding__confirm-head {
		font-family: var(--serif);
		font-size: var(--text-h4);
		color: var(--on-green);
	}

	.holding__confirm-note {
		margin-top: 0.25rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: oklch(0.92 0.016 90 / 0.78);
	}

	/* Secondary path — a quiet italic link, deliberately below the gold button. */
	.holding__advisor {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: var(--space-lg);
		padding: 0.35rem 0;
		border: 0;
		background: transparent;
		color: var(--gold);
		font-family: var(--serif);
		font-style: italic;
		font-size: 1.15rem;
		line-height: 1.2;
		text-align: left;
		cursor: pointer;
		transition: color var(--duration-hover) var(--ease);
	}

	/* WhatsApp mark — quiet until the link is engaged, signalling where it leads. */
	.holding__advisor-glyph {
		width: 1.1em;
		height: 1.1em;
		fill: currentColor;
		flex-shrink: 0;
		opacity: 0.75;
		transition: opacity var(--duration-hover) var(--ease);
	}

	.holding__advisor-arrow {
		transition: transform var(--duration-hover) var(--ease);
	}

	.holding__advisor:hover,
	.holding__advisor:focus-visible {
		color: var(--on-green);
	}

	.holding__advisor:hover .holding__advisor-glyph,
	.holding__advisor:focus-visible .holding__advisor-glyph {
		opacity: 1;
	}

	.holding__advisor:hover .holding__advisor-arrow,
	.holding__advisor:focus-visible .holding__advisor-arrow {
		transform: translateX(4px);
	}

	.holding__advisor:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.holding__foot {
		flex-shrink: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1rem;
		padding-top: var(--space-md);
		border-top: 1px solid oklch(0.82 0.05 85 / 0.22);
		font-family: var(--sans);
		font-size: var(--text-small);
		letter-spacing: 0.02em;
		color: oklch(0.92 0.016 90 / 0.6);
	}

	.holding__foot-places {
		color: var(--gold);
	}

	/* Entrance choreography. The static default is fully visible (no JS / reduced
	   motion ships the page as-is); motion only enhances it. */
	@media (prefers-reduced-motion: no-preference) {
		.holding__rise {
			opacity: 0;
			transform: translateY(16px);
			animation: holding-rise 0.9s var(--ease) forwards;
			animation-delay: var(--d, 0s);
		}

		.holding__photo img {
			animation: holding-kenburns 22s var(--ease) forwards;
		}
	}

	@keyframes holding-rise {
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes holding-kenburns {
		from {
			transform: scale(1.08);
		}
		to {
			transform: scale(1);
		}
	}

	@media (max-width: 38rem) {
		.holding__form {
			gap: var(--space-md);
		}

		.holding__submit {
			width: 100%;
		}
	}
</style>
