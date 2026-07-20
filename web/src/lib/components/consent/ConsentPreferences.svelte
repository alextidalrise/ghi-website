<script lang="ts">
	import { getConsent } from '$lib/analytics';
	import { CONSENT_CATEGORIES, type ConsentCategoryId } from '$lib/consent/copy';
	import { commitConsent } from '$lib/consent/commit';
	import ConsentSwitch from './ConsentSwitch.svelte';

	/**
	 * The preference panel.
	 *
	 * A native <dialog> opened with showModal(), following the Gallery lightbox already in
	 * the codebase. The native modal gives the focus trap, the Escape handling, the inert
	 * background and the focus restore on close — all four accessibility requirements —
	 * without a hand-rolled trap to keep correct.
	 *
	 * Toggles are local until saved. Closing without saving discards, which is the standard
	 * modal contract; "Save preferences" is the panel's only filled button so the exit
	 * paths never look like the way to commit.
	 */
	const consent = getConsent();

	let dialogEl = $state<HTMLDialogElement | null>(null);
	let saving = $state(false);

	// Seeded from the store each time the panel opens, not bound to it — an abandoned
	// change must not leak into the real decision.
	let draft = $state({ analytics: false, marketing: false });

	$effect(() => {
		const el = dialogEl;
		if (!el) return;

		if (consent.preferencesOpen) {
			if (!el.open) {
				draft = { analytics: consent.analytics, marketing: consent.marketing };
				saving = false;
				el.showModal();
			}
		} else if (el.open) {
			el.close();
		}
	});

	// Lock background scroll while the panel owns the viewport, matching Gallery.
	$effect(() => {
		if (!consent.preferencesOpen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	});

	function close() {
		consent.closePreferences();
	}

	/** Fires for both an explicit close() and the native Escape cancel. */
	function onDialogClose() {
		if (consent.preferencesOpen) consent.closePreferences();
	}

	/** A click on the dialog element itself is a click on the backdrop area. */
	function onSurfaceClick(event: MouseEvent) {
		if (event.target === event.currentTarget) close();
	}

	function setCategory(id: ConsentCategoryId, value: boolean) {
		if (id === 'analytics') draft = { ...draft, analytics: value };
		if (id === 'marketing') draft = { ...draft, marketing: value };
	}

	function draftValue(id: ConsentCategoryId): boolean {
		return id === 'analytics' ? draft.analytics : draft.marketing;
	}

	/** Same reload-aware treatment as the banner, via the one shared helper. */
	async function record(next: { analytics: boolean; marketing: boolean }) {
		if (saving) return;
		await commitConsent(consent, next, (value) => (saving = value));
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogEl}
	class="consent-panel"
	aria-labelledby="consent-panel-title"
	onclose={onDialogClose}
	onclick={onSurfaceClick}
>
	<div class="consent-panel__surface">
		<header class="consent-panel__header">
			<h2 class="consent-panel__title" id="consent-panel-title">Cookie preferences</h2>
			<button type="button" class="consent-panel__close" onclick={close} aria-label="Close cookie preferences">
				<span aria-hidden="true">×</span>
			</button>
		</header>

		<p class="consent-panel__intro">
			Choose what we may store on your device. You can change this at any time from
			<span class="consent-panel__nowrap">Cookie settings</span> in the footer.
			<a class="consent-panel__policy" href="/cookies">Cookie policy</a>
		</p>

		<ul class="consent-panel__categories">
			{#each CONSENT_CATEGORIES as category (category.id)}
				<li class="consent-panel__category">
					<div class="consent-panel__category-text">
						<h3 class="consent-panel__category-label">{category.label}</h3>
						<p class="consent-panel__category-description">{category.description}</p>
					</div>

					<div class="consent-panel__control">
						{#if category.locked}
							<!-- Static by design. A disabled switch invites a click that does nothing;
							     a plain statement of fact does not. The visual is decorative here,
							     the words carry the meaning. -->
							<span class="consent-panel__locked">Always on</span>
						{:else}
							<ConsentSwitch
								checked={draftValue(category.id)}
								label={category.label}
								onchange={(value) => setCategory(category.id, value)}
							/>
						{/if}
					</div>
				</li>
			{/each}
		</ul>

		<footer class="consent-panel__footer">
			{#if saving}
				<p class="consent-panel__status" role="status">Saving your choice…</p>
			{:else}
				<button type="button" class="consent-panel__save" onclick={() => record(draft)}>
					Save preferences
				</button>

				<div class="consent-panel__shortcuts">
					<button
						type="button"
						class="consent-panel__shortcut"
						onclick={() => record({ analytics: true, marketing: true })}
					>
						Accept all
					</button>
					<button
						type="button"
						class="consent-panel__shortcut"
						onclick={() => record({ analytics: false, marketing: false })}
					>
						Reject all
					</button>
				</div>
			{/if}
		</footer>
	</div>
</dialog>

<style>
	.consent-panel {
		width: min(34rem, calc(100vw - var(--space-md) * 2));
		max-width: none;
		max-height: calc(100vh - var(--space-xl) * 2);
		margin: auto;
		padding: 0;
		background: var(--white);
		border: 1px solid var(--border);
		color: var(--charcoal);
		overflow: hidden;
	}

	.consent-panel::backdrop {
		background: rgba(14, 20, 16, 0.55);
	}

	.consent-panel__surface {
		max-height: calc(100vh - var(--space-xl) * 2);
		padding: var(--space-lg);
		overflow-y: auto;
	}

	.consent-panel__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.consent-panel__title {
		font-family: var(--serif);
		font-size: var(--text-h3);
		font-weight: 400;
		line-height: 1.2;
		color: var(--green);
	}

	.consent-panel__close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 2.75rem;
		height: 2.75rem;
		/* Pulled back so the glyph optically aligns with the panel edge despite the
		   touch-sized hit area. */
		margin: -0.5rem -0.75rem 0 0;
		background: none;
		border: 0;
		color: var(--muted);
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		transition: color var(--duration-hover) var(--ease);
	}

	.consent-panel__close:hover,
	.consent-panel__close:focus-visible {
		color: var(--green);
	}

	.consent-panel__intro {
		margin-top: var(--space-xs);
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.6;
		color: var(--charcoal);
		text-wrap: pretty;
	}

	.consent-panel__nowrap {
		white-space: nowrap;
	}

	.consent-panel__policy {
		color: var(--green);
		text-decoration: none;
		border-bottom: 1px solid var(--gold);
		transition: color var(--duration-hover) var(--ease);
	}

	.consent-panel__policy:hover,
	.consent-panel__policy:focus-visible {
		color: var(--gold);
	}

	.consent-panel__categories {
		list-style: none;
		margin-top: var(--space-md);
		border-top: 1px solid var(--border);
	}

	/* Hairline-separated rows, no cards and no nested frames — the panel is already a
	   framed object. */
	.consent-panel__category {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-md) 0;
		border-bottom: 1px solid var(--border);
	}

	.consent-panel__category-label {
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--green);
	}

	.consent-panel__category-description {
		margin-top: 0.375rem;
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.6;
		color: var(--muted);
		text-wrap: pretty;
	}

	.consent-panel__control {
		flex: none;
		display: flex;
		align-items: center;
		min-height: 2.75rem;
	}

	.consent-panel__locked {
		font-family: var(--sans);
		font-size: var(--text-small);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--muted);
		white-space: nowrap;
	}

	.consent-panel__footer {
		margin-top: var(--space-md);
	}

	/* The panel's one filled button. By this point the visitor has made a choice; saving
	   it is the action, and the shortcuts below are the way out. */
	.consent-panel__save {
		width: 100%;
		min-height: 3rem;
		padding: 0.875rem 2rem;
		background: var(--green);
		border: 1px solid var(--green);
		color: var(--white);
		font-family: var(--sans);
		font-size: 0.85rem;
		font-weight: 400;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		cursor: pointer;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.consent-panel__save:hover,
	.consent-panel__save:focus-visible {
		background: var(--charcoal);
		border-color: var(--charcoal);
	}

	.consent-panel__shortcuts {
		display: flex;
		justify-content: center;
		gap: var(--space-lg);
		margin-top: var(--space-sm);
	}

	/* Accept and reject stay equal to each other here too, one tier below Save. */
	.consent-panel__shortcut {
		padding: 0.5rem 0;
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

	.consent-panel__shortcut:hover,
	.consent-panel__shortcut:focus-visible {
		color: var(--green);
		border-bottom-color: var(--gold);
	}

	.consent-panel__status {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 3rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--muted);
	}

	.consent-panel__save:focus-visible,
	.consent-panel__shortcut:focus-visible,
	.consent-panel__close:focus-visible,
	.consent-panel__policy:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 2px;
	}

	/* On phones the panel becomes a full-height sheet: the three descriptions plus the
	   footer do not fit a centred box comfortably at 360px. */
	@media (max-width: 600px) {
		.consent-panel {
			width: 100vw;
			max-width: 100vw;
			height: 100dvh;
			max-height: 100dvh;
			margin: 0;
			border: 0;
		}

		.consent-panel__surface {
			max-height: 100dvh;
			padding: var(--space-md) var(--space-sm) calc(var(--space-md) + env(safe-area-inset-bottom));
		}

		.consent-panel__category {
			/* Stacked: a switch pushed to the right edge beside three lines of description
			   leaves the description in a column too narrow to read. */
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-xs);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.consent-panel__save,
		.consent-panel__shortcut,
		.consent-panel__close,
		.consent-panel__policy {
			transition: none;
		}
	}
</style>
