<script lang="ts">
	import { buildFooter } from '$lib/footer/footerContent';
	import { getConsent } from '$lib/analytics';
	import type { FooterContent, FooterSocialPlatform } from '$lib/sanity/queries';

	type Props = {
		footer: FooterContent | null;
	};

	let { footer }: Props = $props();

	// The whole footer — columns, CTA, legal, socials — is authored in Sanity, falling
	// back to the built-in defaults when a piece is left empty or the dataset is empty.
	const content = $derived(buildFooter(footer));

	const SOCIAL_LABELS: Record<FooterSocialPlatform, string> = {
		instagram: 'Instagram',
		facebook: 'Facebook',
		linkedin: 'LinkedIn',
		youtube: 'YouTube',
		x: 'X'
	};

	const year = new Date().getFullYear();

	// Cookie settings is a button, not a legal link. The legal list is overridable from
	// Sanity, so a data entry there cannot call openPreferences() — and a magic href the
	// footer intercepts would break silently the first time an editor reorders the list.
	const consent = getConsent();

	type Status = 'idle' | 'submitting' | 'success' | 'error';
	let email = $state('');
	let status = $state<Status>('idle');
	let message = $state('');

	async function subscribe(event: SubmitEvent) {
		event.preventDefault();
		if (status === 'submitting') return;

		status = 'submitting';
		message = '';

		try {
			const response = await fetch('/api/newsletter', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email })
			});
			const result = await response.json().catch(() => ({}));

			if (response.ok) {
				status = 'success';
				message = 'Thank you. We will be in touch occasionally, never often.';
				email = '';
			} else {
				status = 'error';
				message = result.error ?? 'Please enter a valid email address.';
			}
		} catch {
			status = 'error';
			message = 'We could not reach the server. Please try again shortly.';
		}
	}
</script>

{#snippet socialIcon(platform: FooterSocialPlatform)}
	<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
		{#if platform === 'instagram'}
			<rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" stroke-width="1.6" />
			<circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6" />
			<circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
		{:else if platform === 'facebook'}
			<path fill="currentColor" d="M13.5 21v-7h2.3l.4-2.7h-2.7V9.5c0-.8.2-1.3 1.4-1.3h1.5V5.8c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8v2.7h2.5V21h3z" />
		{:else if platform === 'linkedin'}
			<path fill="currentColor" d="M6.94 8.5H4.3V20h2.64V8.5zM5.62 4a1.53 1.53 0 100 3.06 1.53 1.53 0 000-3.06zM20 20h-2.64v-6.2c0-1.48-.53-2.49-1.85-2.49-1.01 0-1.61.68-1.88 1.34-.1.24-.12.57-.12.9V20H11.5s.04-10.5 0-11.5h2.6v1.63c.35-.54.98-1.31 2.39-1.31 1.74 0 3.04 1.14 3.04 3.6V20z" />
		{:else if platform === 'youtube'}
			<path fill="currentColor" d="M21.6 8.2a2.5 2.5 0 00-1.76-1.76C18.27 6 12 6 12 6s-6.27 0-7.84.44A2.5 2.5 0 002.4 8.2 26 26 0 002 12a26 26 0 00.4 3.8 2.5 2.5 0 001.76 1.76C5.73 18 12 18 12 18s6.27 0 7.84-.44a2.5 2.5 0 001.76-1.76A26 26 0 0022 12a26 26 0 00-.4-3.8zM10 14.6V9.4l4.5 2.6-4.5 2.6z" />
		{:else if platform === 'x'}
			<path fill="currentColor" d="M17.5 4h2.6l-5.7 6.5L21 20h-5.3l-4.1-5.4L6.8 20H4.2l6.1-7L4 4h5.4l3.7 4.9L17.5 4zm-.9 14.4h1.4L8.5 5.5H7l9.6 12.9z" />
		{/if}
	</svg>
{/snippet}

<footer class="footer on-dark">
	<div class="footer__inner content-wrap">
		<!-- Tier 1: brand + invitation -->
		<div class="footer__masthead">
			<div class="footer__brand">
				<a href="/" class="footer__wordmark" aria-label="Golf Homes International home">
					<img
						src="/design-system/assets/logo-white.svg"
						alt="Golf Homes International"
						width="180"
						height="66"
					/>
				</a>
				<p class="footer__statement">{content.brandStatement}</p>
			</div>

			<div class="footer__invite">
				<p class="footer__invite-lead">{content.inviteLead}</p>
				<a
					href={content.invite.href}
					class="footer__invite-cta"
					target={content.invite.external ? '_blank' : undefined}
					rel={content.invite.external ? 'noopener noreferrer' : undefined}
				>
					{content.invite.label}
					<span class="footer__arrow" aria-hidden="true">&rarr;</span>
				</a>
			</div>
		</div>

		<!-- Tier 2: index columns + newsletter -->
		<div class="footer__columns">
			{#each content.columns as column (column.heading)}
				<nav class="footer__col" aria-label={column.heading}>
					<h2 class="footer__heading">{column.heading}</h2>
					<ul class="footer__list">
						{#each column.links as link (link.href)}
							<li>
								<a
									class="footer__link"
									href={link.href}
									target={link.external ? '_blank' : undefined}
									rel={link.external ? 'noopener noreferrer' : undefined}
								>
									{link.label}
								</a>
							</li>
						{/each}
						{#if column.highlight}
							<li>
								<a
									class="footer__link footer__link--all"
									href={column.highlight.href}
									target={column.highlight.external ? '_blank' : undefined}
									rel={column.highlight.external ? 'noopener noreferrer' : undefined}
								>
									{column.highlight.label}
									<span class="footer__arrow" aria-hidden="true">&rarr;</span>
								</a>
							</li>
						{/if}
					</ul>
				</nav>
			{/each}
		</div>

		<!-- Newsletter — its own block so the column count never affects its placement -->
		<div class="footer__signup">
			<h2 class="footer__heading">Stay in touch</h2>
			{#if status === 'success'}
				<p class="footer__signup-success" role="status">{message}</p>
			{:else}
				<p class="footer__signup-lead">
					Occasional notes on new listings and the markets we cover. A few times a year, no more.
				</p>
				<form class="footer__signup-form" onsubmit={subscribe} novalidate>
					<label class="footer__signup-label" for="footer-email">Email address</label>
					<div class="footer__signup-row">
						<input
							id="footer-email"
							class="footer__signup-input"
							type="email"
							name="email"
							placeholder="you@example.com"
							autocomplete="email"
							bind:value={email}
							disabled={status === 'submitting'}
							aria-describedby="footer-signup-msg"
						/>
						<button class="footer__signup-button" type="submit" disabled={status === 'submitting'}>
							{status === 'submitting' ? 'Sending' : 'Subscribe'}
						</button>
					</div>
					<p
						id="footer-signup-msg"
						class="footer__signup-error"
						class:is-visible={status === 'error'}
						role="alert"
					>
						{status === 'error' ? message : ''}
					</p>
				</form>
			{/if}
		</div>

		<!-- Tier 3: legal + social -->
		<div class="footer__baseline">
			<p class="footer__copyright">© {year} Golf Homes International. All rights reserved.</p>
			<div class="footer__baseline-right">
				{#if content.legalLinks.length}
					<ul class="footer__legal">
						{#each content.legalLinks as link (link.href)}
							<li>
								<a
									class="footer__link"
									href={link.href}
									target={link.external ? '_blank' : undefined}
									rel={link.external ? 'noopener noreferrer' : undefined}
								>
									{link.label}
								</a>
							</li>
						{/each}
						<li>
							<button type="button" class="footer__link footer__cookie" onclick={() => consent.openPreferences()}>
								Cookie settings
							</button>
						</li>
					</ul>
				{:else}
					<ul class="footer__legal">
						<li>
							<button type="button" class="footer__link footer__cookie" onclick={() => consent.openPreferences()}>
								Cookie settings
							</button>
						</li>
					</ul>
				{/if}
				{#if content.socials.length}
					<div class="footer__socials">
						{#each content.socials as social (social.platform)}
							<a
								class="footer__social"
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`Golf Homes International on ${SOCIAL_LABELS[social.platform]}`}
							>
								{@render socialIcon(social.platform)}
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: var(--green);
		color: var(--on-green);
	}

	.footer__inner {
		padding-block: var(--space-2xl);
	}

	/* Tier 1 — brand left, invitation right; stacks under the columns breakpoint. */
	.footer__masthead {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-lg) var(--space-2xl);
		padding-bottom: var(--space-xl);
		border-bottom: 1px solid rgba(245, 241, 232, 0.14);
	}

	.footer__wordmark {
		display: inline-block;
		width: 180px;
		max-width: 60%;
		line-height: 0;
		transition: opacity var(--duration-hover) var(--ease);
	}

	.footer__wordmark img {
		width: 100%;
		height: auto;
	}

	.footer__wordmark:hover,
	.footer__wordmark:focus-visible {
		opacity: 0.82;
	}

	.footer__statement {
		max-width: 34ch;
		margin-top: var(--space-sm);
		font-size: var(--text-ui);
		font-weight: 350;
		line-height: 1.8;
		letter-spacing: 0.01em;
		color: rgba(245, 241, 232, 0.78);
	}

	.footer__invite {
		text-align: right;
	}

	.footer__invite-lead {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h4);
		color: var(--on-green);
	}

	.footer__invite-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--gold);
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.footer__invite-cta:hover,
	.footer__invite-cta:focus-visible {
		color: var(--on-green);
	}

	.footer__arrow {
		display: inline-block;
		transition: transform var(--duration-hover) var(--ease);
	}

	.footer__invite-cta:hover .footer__arrow,
	.footer__link--all:hover .footer__arrow,
	.footer__invite-cta:focus-visible .footer__arrow,
	.footer__link--all:focus-visible .footer__arrow {
		transform: translateX(3px);
	}

	/* Tier 2 — index columns. Newsletter lives in its own block below, so the number
	   of country columns never pushes it around. */
	.footer__columns {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: var(--space-xl) var(--space-lg);
		padding-top: var(--space-xl);
	}

	.footer__signup {
		padding-block: var(--space-xl);
	}

	.footer__heading {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--gold);
		margin-bottom: var(--space-md);
	}

	.footer__list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.footer__link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: var(--text-ui);
		font-weight: 400;
		line-height: 1.4;
		color: rgba(245, 241, 232, 0.82);
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.footer__link:hover,
	.footer__link:focus-visible {
		color: var(--gold);
	}

	.footer__link--all {
		color: var(--on-green);
	}

	/* Newsletter — bottom-border input + gold submit, the brand's form idiom on green. */
	.footer__signup-lead {
		max-width: 38ch;
		font-size: var(--text-ui);
		font-weight: 350;
		line-height: 1.8;
		letter-spacing: 0.01em;
		color: rgba(245, 241, 232, 0.78);
		margin-bottom: var(--space-md);
	}

	.footer__signup-label {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.footer__signup-row {
		display: flex;
		align-items: stretch;
		gap: var(--space-sm);
		max-width: 26rem;
	}

	.footer__signup-input {
		flex: 1;
		min-width: 0;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(245, 241, 232, 0.3);
		padding: 0.75rem 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--on-green);
		transition: border-color var(--duration-hover) var(--ease);
	}

	.footer__signup-input::placeholder {
		color: rgba(245, 241, 232, 0.6);
	}

	.footer__signup-input:focus {
		outline: none;
		border-bottom-color: var(--gold);
	}

	.footer__signup-input:disabled {
		opacity: 0.6;
	}

	.footer__signup-button {
		flex-shrink: 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		background: var(--gold);
		border: 1px solid var(--gold);
		padding: 0.7rem 1.5rem;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.footer__signup-button:hover:not(:disabled),
	.footer__signup-button:focus-visible:not(:disabled) {
		background: var(--on-green);
		border-color: var(--on-green);
	}

	.footer__signup-button:disabled {
		cursor: default;
		opacity: 0.7;
	}

	.footer__signup-error {
		min-height: 1.25rem;
		margin-top: 0.5rem;
		font-size: var(--text-small);
		color: rgba(245, 241, 232, 0.6);
		opacity: 0;
		transition: opacity var(--duration-hover) var(--ease);
	}

	.footer__signup-error.is-visible {
		opacity: 1;
		color: #e9b9a3; /* warm, not alarming — reads on green, well above 4.5:1 */
	}

	.footer__signup-success {
		max-width: 38ch;
		font-size: var(--text-ui);
		font-weight: 350;
		line-height: 1.8;
		letter-spacing: 0.01em;
		color: var(--on-green);
	}

	/* Tier 3 — baseline */
	.footer__baseline {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-md) var(--space-lg);
		padding-top: var(--space-lg);
		border-top: 1px solid rgba(245, 241, 232, 0.14);
	}

	.footer__copyright {
		font-size: var(--text-small);
		color: rgba(245, 241, 232, 0.6);
	}

	.footer__baseline-right {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
	}

	.footer__legal {
		list-style: none;
		display: flex;
		gap: var(--space-md);
	}

	.footer__legal .footer__link {
		font-size: var(--text-small);
	}

	/* Reset the button back to the link vocabulary it sits in: visually it is the third
	   legal link, it just happens to open a dialog rather than navigate. */
	.footer__cookie {
		padding: 0;
		background: none;
		border: 0;
		font-family: inherit;
		cursor: pointer;
	}

	.footer__cookie:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.footer__socials {
		display: inline-flex;
		align-items: center;
		gap: var(--space-md);
	}

	.footer__social {
		display: inline-flex;
		color: rgba(245, 241, 232, 0.82);
		transition: color var(--duration-hover) var(--ease);
	}

	.footer__social:hover,
	.footer__social:focus-visible {
		color: var(--gold);
	}

	@media (max-width: 56rem) {
		.footer__masthead {
			flex-direction: column;
		}

		.footer__invite {
			text-align: left;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.footer__wordmark,
		.footer__invite-cta,
		.footer__link,
		.footer__social,
		.footer__arrow,
		.footer__signup-input,
		.footer__signup-button,
		.footer__signup-error,
		.footer__cookie {
			transition: none;
		}
	}
</style>
