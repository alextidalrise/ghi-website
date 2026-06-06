<script lang="ts">
	type Guide = 'spain' | 'portugal';

	type Props = {
		guide: Guide;
		country: string;
		title: string;
		/** Three short lines of what the guide covers. */
		points: string[];
		/** Staggered reveal offset, in ms, set by the parent. */
		revealDelay?: number;
	};

	let { guide, country, title, points, revealDelay = 0 }: Props = $props();

	type Status = 'idle' | 'submitting' | 'success' | 'error';
	let email = $state('');
	let status = $state<Status>('idle');
	let message = $state('');
	// Mobile only: the email field is collapsed behind a button until requested,
	// so two stacked forms don't eat the fold. Desktop ignores this (CSS keeps the
	// field open) — see the .card__collapsible rules.
	let expanded = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	const formId = $derived(`guide-form-${guide}`);

	function reveal() {
		expanded = true;
		requestAnimationFrame(() => inputEl?.focus());
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (status === 'submitting') return;

		status = 'submitting';
		message = '';

		try {
			const response = await fetch('/api/newsletter', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, guide })
			});
			const result = await response.json().catch(() => ({}));

			if (response.ok) {
				status = 'success';
				message = `On its way. Check your inbox for the ${country} guide.`;
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

<article class="card" class:is-expanded={expanded} style="--reveal-delay: {revealDelay}ms">
	<header class="card__head">
		<span class="card__flag" aria-hidden="true">
			{#if guide === 'spain'}
				<svg viewBox="0 0 30 20" width="30" height="20">
					<rect width="30" height="20" fill="#AA151B" />
					<rect y="5" width="30" height="10" fill="#F1BF00" />
				</svg>
			{:else}
				<svg viewBox="0 0 30 20" width="30" height="20">
					<rect width="30" height="20" fill="#DA291C" />
					<rect width="12" height="20" fill="#046A38" />
					<circle cx="12" cy="10" r="3.1" fill="#FFE12C" stroke="#046A38" stroke-width="0.7" />
				</svg>
			{/if}
		</span>
		<h3 class="card__title">{title}</h3>
	</header>

	<ul class="card__points">
		{#each points as point (point)}
			<li>{point}</li>
		{/each}
	</ul>

	<div class="card__action">
		{#if status === 'success'}
			<p class="card__success" role="status">
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
					<path d="M3.5 9.5l3.5 3.5 7.5-8" stroke="currentColor" stroke-width="1.6" />
				</svg>
				{message}
			</p>
		{:else}
			<button
				type="button"
				class="card__reveal"
				aria-expanded={expanded}
				aria-controls={formId}
				onclick={reveal}
			>
				Get the {country} guide
				<svg width="20" height="10" viewBox="0 0 20 10" fill="none" aria-hidden="true">
					<path d="M0 5h18M14 1l4 4-4 4" stroke="currentColor" stroke-width="1.25" />
				</svg>
			</button>

			<div class="card__collapsible">
				<form id={formId} class="card__form" onsubmit={submit} novalidate>
					<label class="card__label" for="{formId}-email">Email address</label>
					<div class="card__field">
						<input
							bind:this={inputEl}
							id="{formId}-email"
							class="card__input"
							type="email"
							name="email"
							inputmode="email"
							autocomplete="email"
							placeholder="your@email.com"
							bind:value={email}
							disabled={status === 'submitting'}
							required
						/>
						<button type="submit" class="card__submit" disabled={status === 'submitting'}>
							{status === 'submitting' ? 'Sending…' : 'Send the guide'}
						</button>
					</div>
					<p class="card__note" class:is-error={status === 'error'} role="alert">
						{#if status === 'error'}{message}{:else}Sent to your inbox as a PDF.{/if}
					</p>
				</form>
			</div>
		{/if}
	</div>
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		padding: clamp(1.5rem, 1rem + 2vw, 2.25rem);
		background: var(--white);
		/* White-default: a 1px frame defines the card, no shadow at rest. */
		border: 1px solid var(--border);
		transition:
			box-shadow var(--duration-lift) var(--ease),
			border-color var(--duration-hover) var(--ease),
			transform var(--duration-lift) var(--ease);
	}

	/* The card being filled warms up: gold frame and a faint lift, so the active
	   guide reads as the focus. Gold here is an accent mark, not a fill. */
	.card:focus-within {
		transform: translateY(-2px);
		border-color: var(--gold);
		box-shadow: 0 18px 40px -24px oklch(0.2 0.03 165 / 0.28);
	}

	.card__head {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding-bottom: var(--space-md);
		margin-bottom: var(--space-md);
		border-bottom: 1px solid var(--border);
	}

	/* Flag as a small framed stamp — passport/luggage-tag cue for relocation. */
	.card__flag {
		flex: 0 0 auto;
		display: inline-flex;
		width: 32px;
		height: 22px;
		border: 1px solid var(--border);
		overflow: hidden;
	}

	.card__flag svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.card__title {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h3);
		color: var(--green);
		line-height: 1.1;
	}

	.card__points {
		list-style: none;
		display: grid;
		gap: 0.65rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--charcoal);
	}

	.card__points li {
		position: relative;
		padding-left: 1.15rem;
		line-height: 1.45;
	}

	.card__points li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.52em;
		width: 5px;
		height: 5px;
		background: var(--gold);
		/* Square marker keeps the zero-radius brand signal. */
	}

	/* Form / reveal pinned to the card base so both cards' CTAs line up. */
	.card__action {
		margin-top: auto;
		padding-top: var(--space-lg);
	}

	.card__reveal {
		display: none;
		align-items: center;
		gap: var(--space-sm);
		align-self: flex-start;
		padding: 0.85rem 1.5rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		background: var(--gold);
		border: 1px solid var(--gold);
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.card__reveal svg {
		transition: transform var(--duration-hover) var(--ease);
	}

	.card__reveal:hover,
	.card__reveal:focus-visible {
		background: var(--green);
		color: var(--white);
	}

	.card__reveal:hover svg,
	.card__reveal:focus-visible svg {
		transform: translateX(4px);
	}

	.card__collapsible {
		display: grid;
	}

	.card__form {
		display: grid;
		gap: var(--space-sm);
	}

	.card__label {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}

	.card__field {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: end;
	}

	.card__input {
		flex: 1 1 12rem;
		min-width: 0;
		font: inherit;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--charcoal);
		padding: 0.65rem 0;
		background: transparent;
		border: 0;
		border-bottom: 1px solid var(--border);
		transition: border-color var(--duration-hover) var(--ease);
	}

	.card__input::placeholder {
		color: var(--muted);
	}

	.card__input:focus-visible {
		outline: none;
		border-bottom-color: var(--green);
	}

	.card__input:disabled {
		opacity: 0.6;
	}

	.card__submit {
		flex: 0 0 auto;
		max-width: 100%;
		padding: 0.75rem 1.5rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
		background: var(--gold);
		border: 1px solid var(--gold);
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.card__submit:hover:not(:disabled),
	.card__submit:focus-visible:not(:disabled) {
		background: var(--green);
		color: var(--white);
	}

	.card__submit:disabled {
		cursor: progress;
		opacity: 0.7;
	}

	.card__note {
		font-family: var(--sans);
		font-size: var(--text-small);
		min-height: 1.2em;
		color: var(--muted);
	}

	.card__note.is-error {
		color: #9a3b2e;
	}

	.card__success {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--green);
	}

	.card__success svg {
		flex: 0 0 auto;
		color: var(--gold);
	}

	@media (max-width: 720px) {
		.card__action {
			margin-top: var(--space-md);
			padding-top: var(--space-md);
		}

		.card__reveal {
			display: inline-flex;
		}

		.card__collapsible {
			grid-template-rows: 0fr;
			overflow: hidden;
		}

		.card__collapsible > .card__form {
			min-height: 0;
		}

		.card.is-expanded .card__reveal {
			display: none;
		}

		.card.is-expanded .card__collapsible {
			grid-template-rows: 1fr;
			margin-top: var(--space-sm);
		}
	}

	@media (max-width: 720px) and (prefers-reduced-motion: no-preference) {
		.card__collapsible {
			transition: grid-template-rows var(--duration-lift) var(--ease);
		}
	}

	/* Reduced motion: keep colour/shadow feedback, drop the positional movement. */
	@media (prefers-reduced-motion: reduce) {
		.card:focus-within {
			transform: none;
		}

		.card__reveal:hover svg,
		.card__reveal:focus-visible svg {
			transform: none;
		}
	}

	/* Staggered entrance, matching the country-card reveal used elsewhere on the
	   homepage. Enhances an always-visible default; reduced-motion skips it. */
	@media (prefers-reduced-motion: no-preference) {
		.card {
			opacity: 0;
			transform: translateY(20px);
			animation: card-reveal 0.7s var(--ease) forwards;
			animation-delay: var(--reveal-delay, 0ms);
		}

		@keyframes card-reveal {
			to {
				opacity: 1;
				transform: none;
			}
		}
	}
</style>
