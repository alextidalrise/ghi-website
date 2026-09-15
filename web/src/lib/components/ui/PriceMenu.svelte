<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { pointer, ensurePointer } from '$lib/ui/pointer.svelte';
	import { autoPosition } from '$lib/ui/floating';
	import { getCurrencyOptional } from '$lib/currency/currency.svelte';
	import { currencyPrefix, displayFromEur, eurFromDisplay, formatMoneyRange } from '$lib/currency/filterPrice';
	import { FALLBACK_RATES } from '$lib/currency/rates';
	import './filterControls.css';

	type Props = {
		minPrice?: number | null;
		maxPrice?: number | null;
		label?: string;
		/** Called on apply (panel close on pointer; the submit button drives no-JS/touch). */
		onchange?: () => void;
	};

	let {
		minPrice = $bindable<number | null>(null),
		maxPrice = $bindable<number | null>(null),
		label = 'Price',
		onchange
	}: Props = $props();

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const panelId = `${uid}-panel`;

	// The public min/max are canonically EUR (the URL and query never leave euros). This
	// control presents them in the currency the visitor chose in the switcher, converting
	// to EUR only when it commits. `null`/EUR mean "as listed", the SSR default — then
	// display equals EUR exactly and nothing is approximated.
	const currency = getCurrencyOptional();
	const displayCurrency = $derived(currency?.chosen ?? 'EUR');
	const rates = currency?.rates ?? FALLBACK_RATES;
	const converts = $derived(displayCurrency !== 'EUR');
	const symbol = $derived(currencyPrefix(displayCurrency));

	const toDisplay = (eur: number | null) =>
		eur == null ? null : displayFromEur(eur, displayCurrency, rates);
	const toEur = (shown: number | null) =>
		shown == null ? null : eurFromDisplay(shown, displayCurrency, rates);

	// Editable, chosen-currency mirror of the EUR min/max that the number inputs bind to.
	// svelte-ignore state_referenced_locally
	let minDisplay = $state<number | null>(toDisplay(minPrice));
	// svelte-ignore state_referenced_locally
	let maxDisplay = $state<number | null>(toDisplay(maxPrice));

	// Reseed the mirror from the APPLIED EUR values when those change (a navigation, or the
	// post-commit snap to the rounded figure). The currency is read untracked, so a switch —
	// or the switcher hydrating mid-edit — never runs this branch and never wipes an
	// in-progress entry (typing writes only the mirror; nothing reactively writes EUR back).
	$effect(() => {
		const eurMin = minPrice;
		const eurMax = maxPrice;
		untrack(() => {
			minDisplay = eurMin == null ? null : displayFromEur(eurMin, displayCurrency, rates);
			maxDisplay = eurMax == null ? null : displayFromEur(eurMax, displayCurrency, rates);
		});
	});

	// When the visitor switches currency with the panel open, re-express whatever is in the
	// inputs in the new currency (via EUR) rather than resetting it.
	// svelte-ignore state_referenced_locally
	let priorCurrency = displayCurrency;
	$effect(() => {
		const next = displayCurrency;
		untrack(() => {
			if (next === priorCurrency) return;
			minDisplay = minDisplay == null ? null : displayFromEur(eurFromDisplay(minDisplay, priorCurrency, rates), next, rates);
			maxDisplay = maxDisplay == null ? null : displayFromEur(eurFromDisplay(maxDisplay, priorCurrency, rates), next, rates);
			priorCurrency = next;
		});
	});

	/** Push the chosen-currency mirror back into the EUR min/max the URL is built from. */
	function commit() {
		minPrice = toEur(minDisplay);
		maxPrice = toEur(maxDisplay);
	}

	const isEmpty = $derived(minPrice == null && maxPrice == null);
	const valueText = $derived(formatMoneyRange(toDisplay(minPrice), toDisplay(maxPrice), displayCurrency));
	const showCustom = $derived(pointer.enhanced);

	let open = $state(false);
	let triggerEl = $state<HTMLButtonElement>();
	let panelEl = $state<HTMLDivElement>();
	let detach: (() => void) | undefined;

	$effect(() => {
		ensurePointer();
		return () => detach?.();
	});

	async function openPanel() {
		if (open || !panelEl || !triggerEl) return;
		open = true;
		panelEl.showPopover();
		await tick();
		detach = autoPosition(triggerEl, panelEl, { matchTriggerWidth: false });
		panelEl.querySelector<HTMLInputElement>('input')?.focus();
	}

	function closePanel(focusTrigger = true) {
		if (!open) return;
		open = false;
		detach?.();
		detach = undefined;
		panelEl?.hidePopover();
		if (focusTrigger) triggerEl?.focus({ preventScroll: true });
	}

	function toggle() {
		if (open) closePanel();
		else openPanel();
	}

	function apply() {
		commit();
		closePanel();
		onchange?.();
	}

	function onPanelKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			apply();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			closePanel();
		}
	}

	function onTriggerKeydown(event: KeyboardEvent) {
		if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
			event.preventDefault();
			openPanel();
		}
	}

	function onWindowPointerDown(event: PointerEvent) {
		if (!open) return;
		const target = event.target as Node;
		if (triggerEl?.contains(target) || panelEl?.contains(target)) return;
		closePanel(false);
	}
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

{#snippet fields()}
	<div class="fc-price">
		<label class="fc-price__field">
			<span>Min</span>
			<span class="fc-price__input">
				<span class="fc-price__sym" aria-hidden="true">{symbol}</span>
				<input
					type="number"
					name="minPrice"
					min="0"
					step="50000"
					inputmode="numeric"
					placeholder="No min"
					bind:value={minDisplay}
				/>
			</span>
		</label>
		<label class="fc-price__field">
			<span>Max</span>
			<span class="fc-price__input">
				<span class="fc-price__sym" aria-hidden="true">{symbol}</span>
				<input
					type="number"
					name="maxPrice"
					min="0"
					step="50000"
					inputmode="numeric"
					placeholder="No max"
					bind:value={maxDisplay}
				/>
			</span>
		</label>
	</div>
	{#if converts}
		<p class="fc-price__note">Approximate — homes are matched on their euro value.</p>
	{/if}
{/snippet}

{#if showCustom}
	<div class="fc-field fc-field--tray fc-field--price" class:is-empty={isEmpty}>
		<span class="fc-label" id={labelId}>{label}</span>
		<button
			bind:this={triggerEl}
			type="button"
			class="fc-trigger fc-trigger--cell"
			aria-haspopup="dialog"
			aria-controls={panelId}
			aria-expanded={open}
			aria-labelledby={labelId}
			onclick={toggle}
			onkeydown={onTriggerKeydown}
		>
			<span class="fc-value">{valueText || 'Any'}</span>
			<span class="fc-chevron" aria-hidden="true"></span>
		</button>

		<div
			bind:this={panelEl}
			id={panelId}
			class="fc-panel fc-panel--price"
			popover="manual"
			role="dialog"
			tabindex="-1"
			aria-label="Price range"
			onkeydown={onPanelKeydown}
		>
			{@render fields()}
			<button class="fc-apply" type="button" onclick={apply}>Apply price</button>
		</div>
	</div>
{:else}
	<details class="fc-field fc-field--tray fc-field--price fc-price-details" class:is-empty={isEmpty}>
		<summary class="fc-field__summary">
			<span class="fc-label" id={labelId}>{label}</span>
			<span class="fc-control">
				<span class="fc-value">{valueText || 'Any'}</span>
				<span class="fc-chevron" aria-hidden="true"></span>
			</span>
		</summary>
		<div class="fc-panel fc-panel--price fc-panel--static">
			{@render fields()}
			<!-- Touch/no-JS path. With JS the host form intercepts submit and reads the EUR
			     min/max, so commit the chosen-currency mirror first; without JS the currency
			     is always EUR (the switcher never hydrated), so the named inputs already hold
			     euros and this handler simply never runs. -->
			<button class="fc-apply" type="submit" onclick={commit}>Apply price</button>
		</div>
	</details>
{/if}

<style>
	.fc-field--price {
		position: relative;
	}

	/* Currency mark sits inline before each number, sharing the field's hairline underline. */
	.fc-price__input {
		display: flex;
		align-items: baseline;
		gap: 0.3ch;
		border-bottom: 1px solid var(--border);
	}

	.fc-price__input:focus-within {
		border-color: var(--green);
	}

	.fc-price__sym {
		flex: none;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--muted);
	}

	/* The mark owns the underline now, so the input drops its own. */
	.fc-price__input input {
		border-bottom: 0;
	}

	/* One quiet line, shown only when a conversion is in play, so the approximation is
	   never a surprise: the figures are indicative and matched on the euro value. */
	.fc-price__note {
		margin: 0.75rem 0 0;
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.4;
		color: var(--muted);
	}

	/* The custom-trigger cell mirrors a Select cell: value + drawn chevron. */
	.fc-field--price .fc-trigger--cell .fc-value {
		flex: 1;
		min-width: 0;
		font-family: var(--serif);
		font-size: 1.1875rem;
		line-height: 1.15;
		color: var(--charcoal);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.fc-field--price.is-empty .fc-value {
		font-style: italic;
		color: var(--muted);
	}

	/* Details summary fills the cell and stacks label over value, like a Select cell. */
	.fc-price-details .fc-field__summary {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		cursor: pointer;
	}

	.fc-price-details .fc-field__summary::-webkit-details-marker {
		display: none;
	}

	.fc-price-details .fc-field__summary .fc-chevron {
		flex: none;
		width: 0.6em;
		height: 0.6em;
		border-right: 1.5px solid var(--muted);
		border-bottom: 1.5px solid var(--muted);
		transform: translateY(-0.12em) rotate(45deg);
		transition: transform var(--duration-hover) var(--ease);
	}

	.fc-price-details[open] .fc-field__summary .fc-chevron {
		transform: translateY(0.06em) rotate(225deg);
	}

	.fc-panel--price {
		min-width: 17rem;
	}

	.fc-panel--price.fc-panel--static {
		position: absolute;
		top: calc(100% + 0.375rem);
		left: 0;
		z-index: 50;
	}

	.fc-price-details .fc-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.fc-price-details .fc-value {
		flex: 1;
		min-width: 0;
		font-family: var(--serif);
		font-size: 1.1875rem;
		line-height: 1.15;
		color: var(--charcoal);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
