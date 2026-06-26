<script lang="ts">
	import { tick } from 'svelte';
	import { pointer, ensurePointer } from '$lib/ui/pointer.svelte';
	import { autoPosition } from '$lib/ui/floating';
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

	const isEmpty = $derived(minPrice == null && maxPrice == null);
	const valueText = $derived(formatRange(minPrice, maxPrice));
	const showCustom = $derived(pointer.enhanced);

	let open = $state(false);
	let triggerEl = $state<HTMLButtonElement>();
	let panelEl = $state<HTMLDivElement>();
	let detach: (() => void) | undefined;

	$effect(() => {
		ensurePointer();
		return () => detach?.();
	});

	function short(value: number): string {
		if (value >= 1_000_000) {
			const millions = value / 1_000_000;
			const text = millions % 1 === 0 ? String(millions) : millions.toFixed(2).replace(/0+$/, '');
			return `€${text}M`;
		}
		if (value >= 1000) return `€${Math.round(value / 1000)}k`;
		return `€${value}`;
	}

	function formatRange(min: number | null, max: number | null): string {
		if (min != null && max != null) return `${short(min)}–${short(max)}`;
		if (min != null) return `${short(min)}+`;
		if (max != null) return `Up to ${short(max)}`;
		return '';
	}

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
			<input
				type="number"
				name="minPrice"
				min="0"
				step="50000"
				inputmode="numeric"
				placeholder="No min"
				bind:value={minPrice}
			/>
		</label>
		<label class="fc-price__field">
			<span>Max</span>
			<input
				type="number"
				name="maxPrice"
				min="0"
				step="50000"
				inputmode="numeric"
				placeholder="No max"
				bind:value={maxPrice}
			/>
		</label>
	</div>
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
			<button class="fc-apply" type="submit">Apply price</button>
		</div>
	</details>
{/if}

<style>
	.fc-field--price {
		position: relative;
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
