<script lang="ts">
	type Guide = 'spain' | 'portugal';

	type Props = {
		guide: Guide;
		country: string;
		title: string;
		/** Three short lines of what the guide covers. */
		points: string[];
		/** Cover-panel surface. 'green' = light ink on green; 'gold' = green ink on gold. */
		tone: 'green' | 'gold';
	};

	let { guide, country, title, points, tone }: Props = $props();

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
		// Wait for the collapsible to open, then drop focus into the field.
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

<article class="card" class:is-expanded={expanded}>
	<div class="card__cover card__cover--{tone}">
		<span class="card__wordmark">Golf Homes International</span>
		<span class="card__cover-title">{country} Buyer's Guide</span>
		<span class="card__tag">PDF · Free</span>
	</div>

	<div class="card__body">
		<h3 class="card__title">{title}</h3>
		<ul class="card__points">
			{#each points as point (point)}
				<li>{point}</li>
			{/each}
		</ul>

		{#if status === 'success'}
			<p class="card__success" role="status">
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
					<path d="M3.5 9.5l3.5 3.5 7.5-8" stroke="currentColor" stroke-width="1.5" />
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
					<p class="card__message" class:is-error={status === 'error'} role="alert">
						{#if status === 'error'}{message}{/if}
					</p>
				</form>
			</div>
		{/if}
	</div>
</article>

<style>
	.card {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
		border: 1px solid var(--border);
		background: var(--white);
		/* No shadow at rest — brand rule. */
	}

	/* Cover panel: typographic stand-in for the real guide cover. */
	.card__cover {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-lg);
	}

	.card__cover--green {
		background: var(--green);
		color: var(--on-green);
	}

	.card__cover--gold {
		background: var(--gold);
		color: var(--green);
	}

	.card__wordmark {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		/* Slightly recede the wordmark against the cover title. */
		opacity: 0.82;
	}

	.card__cover-title {
		font-family: var(--serif);
		font-weight: 600;
		font-size: var(--text-h3);
		line-height: 1.08;
		letter-spacing: var(--tracking-tight);
		margin-top: auto;
	}

	.card__tag {
		font-family: var(--sans);
		font-size: var(--text-small);
		font-weight: 400;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		padding-top: var(--space-sm);
		border-top: 1px solid currentColor;
		/* Hairline reads as a faint rule, not a hard line, on either cover tone. */
		opacity: 0.85;
	}

	.card__body {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-lg);
	}

	.card__title {
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h3);
		color: var(--green);
		line-height: 1.15;
	}

	.card__points {
		list-style: none;
		display: grid;
		gap: 0.6rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--charcoal);
	}

	.card__points li {
		position: relative;
		padding-left: 1.1rem;
		line-height: 1.4;
	}

	.card__points li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.5em;
		width: 4px;
		height: 4px;
		background: var(--gold);
		/* Square dot — keeps the zero-radius brand signal even at 4px. */
	}

	/* Reveal trigger — mobile shows it; desktop hides it (form is always open). */
	.card__reveal {
		display: none;
		align-items: center;
		gap: var(--space-sm);
		align-self: flex-start;
		margin-top: auto;
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

	/* Collapsible wrapper. The grid-rows 0fr→1fr technique animates the reveal
	   without a hard-coded max-height. Desktop pins it open. */
	.card__collapsible {
		margin-top: auto;
	}

	.card__form {
		display: grid;
		gap: var(--space-sm);
	}

	.card__label {
		/* Visually hidden; the placeholder + submit label carry the meaning. */
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

	/* Bottom-border input — the brand's form idiom. */
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
		/* Placeholder must clear the same 4.5:1 floor as body text. */
		color: var(--muted);
	}

	.card__input:focus-visible {
		outline: none;
		border-bottom-color: var(--green);
	}

	.card__input:disabled {
		opacity: 0.6;
	}

	/* Gold submit — brand's gold button tier. */
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

	.card__message {
		font-family: var(--sans);
		font-size: var(--text-small);
		min-height: 1.2em;
		color: var(--muted);
	}

	.card__message.is-error {
		/* Muted brick red — distinct without alarming, ~6.4:1 on white. */
		color: #9a3b2e;
	}

	.card__success {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-top: auto;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--green);
	}

	.card__success svg {
		flex: 0 0 auto;
		color: var(--gold);
	}

	@media (max-width: 720px) {
		.card {
			grid-template-columns: 1fr;
		}

		/* Top band rather than a tall side panel: compact, stacked, tight gap. */
		.card__cover {
			gap: var(--space-xs);
			padding: var(--space-md);
		}

		.card__cover-title {
			margin-top: 0;
			font-size: var(--text-h4);
		}

		.card__tag {
			border-top: 0;
			padding-top: 0;
		}

		/* Collapse the form until the reveal button is tapped. */
		.card__reveal {
			display: inline-flex;
		}

		.card__collapsible {
			display: grid;
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
</style>
