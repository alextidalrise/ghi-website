<script lang="ts">
	import { tick } from 'svelte';
	import { pointer, ensurePointer } from '$lib/ui/pointer.svelte';
	import { autoPosition, type FloatingAlign } from '$lib/ui/floating';
	import './filterControls.css';

	type Option = { label: string; value: string };

	type Props = {
		/** Bound array of selected values. */
		value?: string[];
		options: Option[];
		label: string;
		/** Form field name shared by every checkbox — the no-JS submit source of truth. */
		name: string;
		/** 'tray' renders as a tray cell (matching the single-selects); 'pill' stands alone. */
		variant?: 'tray' | 'pill';
		align?: FloatingAlign;
		/** Called on apply (panel close on pointer; the submit button drives no-JS/touch). */
		onchange?: (value: string[]) => void;
	};

	let {
		value = $bindable<string[]>([]),
		options,
		label,
		name,
		variant = 'pill',
		align = 'start',
		onchange
	}: Props = $props();

	const isCell = $derived(variant === 'tray');

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const panelId = `${uid}-panel`;
	const detailsId = `${uid}-details`;
	const optionId = (index: number) => `${uid}-opt-${index}`;

	const count = $derived(value.length);
	const valueText = $derived(
		count === 0
			? ''
			: count === 1
				? (options.find((option) => option.value === value[0])?.label ?? '1 selected')
				: `${count} selected`
	);
	const showCustom = $derived(pointer.enhanced);

	let open = $state(false);
	let activeIndex = $state(-1);
	let dirty = false;
	let triggerEl = $state<HTMLButtonElement>();
	let panelEl = $state<HTMLDivElement>();
	let detach: (() => void) | undefined;

	$effect(() => {
		ensurePointer();
		return () => detach?.();
	});

	function isSelected(optionValue: string) {
		return value.includes(optionValue);
	}

	async function openPanel() {
		if (open || !panelEl || !triggerEl) return;
		open = true;
		dirty = false;
		activeIndex = 0;
		panelEl.showPopover();
		await tick();
		detach = autoPosition(triggerEl, panelEl, { align, matchTriggerWidth: false });
		panelEl.focus({ preventScroll: true });
	}

	function closePanel(focusTrigger = true) {
		if (!open) return;
		open = false;
		detach?.();
		detach = undefined;
		panelEl?.hidePopover();
		if (focusTrigger) triggerEl?.focus({ preventScroll: true });
		// Apply-on-close: only navigate if the selection actually changed.
		if (dirty) {
			dirty = false;
			onchange?.(value);
		}
	}

	function toggle() {
		if (open) closePanel();
		else openPanel();
	}

	function onTriggerKeydown(event: KeyboardEvent) {
		if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
			event.preventDefault();
			openPanel();
		}
	}

	function toggleOption(optionValue: string) {
		value = isSelected(optionValue)
			? value.filter((entry) => entry !== optionValue)
			: [...value, optionValue];
		dirty = true;
	}

	function onPanelKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				activeIndex = (activeIndex + 1) % options.length;
				scrollActiveIntoView();
				break;
			case 'ArrowUp':
				event.preventDefault();
				activeIndex = (activeIndex - 1 + options.length) % options.length;
				scrollActiveIntoView();
				break;
			case 'Home':
				event.preventDefault();
				activeIndex = 0;
				scrollActiveIntoView();
				break;
			case 'End':
				event.preventDefault();
				activeIndex = options.length - 1;
				scrollActiveIntoView();
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (activeIndex >= 0) toggleOption(options[activeIndex].value);
				break;
			case 'Escape':
			case 'Tab':
				event.preventDefault();
				closePanel();
				break;
		}
	}

	function scrollActiveIntoView() {
		if (activeIndex < 0) return;
		panelEl
			?.querySelector<HTMLElement>(`#${CSS.escape(optionId(activeIndex))}`)
			?.scrollIntoView({ block: 'nearest' });
	}

	function onWindowPointerDown(event: PointerEvent) {
		if (!open) return;
		const target = event.target as Node;
		if (triggerEl?.contains(target) || panelEl?.contains(target)) return;
		closePanel(false);
	}

	// No-JS / touch: checkboxes bind into `value`; the submit button applies.
	function onCheckbox(optionValue: string, checked: boolean) {
		value = checked
			? [...new Set([...value, optionValue])]
			: value.filter((entry) => entry !== optionValue);
	}
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

{#snippet customBody()}
	<div class="fc-panel__list">
		{#each options as option, index (option.value)}
			<!-- aria-activedescendant listbox: the container owns focus + keyboard;
			     pointer click is a shortcut for toggling an option. -->
			<!-- svelte-ignore a11y_interactive_supports_focus -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				id={optionId(index)}
				class="fc-option"
				role="option"
				aria-selected={isSelected(option.value)}
				data-active={index === activeIndex}
				onclick={() => toggleOption(option.value)}
				onpointermove={() => (activeIndex = index)}
			>
				<span class="fc-option__marker" aria-hidden="true">
					<svg viewBox="0 0 16 16" fill="none">
						<path d="M3 8.5 6.5 12 13 4.5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</span>
				<span class="fc-option__label">{option.label}</span>
			</div>
		{/each}
	</div>
	<button class="fc-apply" type="button" onclick={() => closePanel()}>Apply</button>
{/snippet}

{#snippet nativeBody()}
	<legend class="fc-sr-only">{label}</legend>
	<div class="fc-panel__list">
		{#each options as option (option.value)}
			<label class="fc-option fc-option--label">
				<input
					class="fc-check"
					type="checkbox"
					{name}
					value={option.value}
					checked={isSelected(option.value)}
					onchange={(event) => onCheckbox(option.value, event.currentTarget.checked)}
				/>
				<span class="fc-option__label">{option.label}</span>
			</label>
		{/each}
	</div>
	<button class="fc-apply" type="submit">Apply</button>
{/snippet}

{#if showCustom}
	{#if isCell}
		<div class="fc-field fc-field--tray fc-field--multi" class:is-empty={count === 0}>
			<span class="fc-label" id={labelId}>{label}</span>
			<button
				bind:this={triggerEl}
				type="button"
				class="fc-trigger fc-trigger--cell"
				aria-haspopup="listbox"
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
				class="fc-panel fc-panel--multi"
				popover="manual"
				role="listbox"
				aria-multiselectable="true"
				aria-labelledby={labelId}
				tabindex="-1"
				aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
				onkeydown={onPanelKeydown}
			>
				{@render customBody()}
			</div>
		</div>
	{:else}
		<div class="fc-pill-host">
			<button
				bind:this={triggerEl}
				type="button"
				class="fc-pill"
				class:is-active={count > 0}
				aria-haspopup="listbox"
				aria-controls={panelId}
				aria-expanded={open}
				onclick={toggle}
				onkeydown={onTriggerKeydown}
			>
				<span class="fc-pill__label" id={labelId}>{label}</span>
				{#if valueText}<span class="fc-value">{valueText}</span>{/if}
				<span class="fc-chevron" aria-hidden="true"></span>
			</button>
			<div
				bind:this={panelEl}
				id={panelId}
				class="fc-panel fc-panel--multi"
				popover="manual"
				role="listbox"
				aria-multiselectable="true"
				aria-labelledby={labelId}
				tabindex="-1"
				aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
				onkeydown={onPanelKeydown}
			>
				{@render customBody()}
			</div>
		</div>
	{/if}
{:else if isCell}
	<details class="fc-field fc-field--tray fc-field--multi fc-multi-details" class:is-empty={count === 0}>
		<summary class="fc-field__summary">
			<span class="fc-label" id={labelId}>{label}</span>
			<span class="fc-control">
				<span class="fc-value">{valueText || 'Any'}</span>
				<span class="fc-chevron" aria-hidden="true"></span>
			</span>
		</summary>
		<fieldset class="fc-panel fc-panel--multi fc-panel--static" aria-labelledby={labelId}>
			{@render nativeBody()}
		</fieldset>
	</details>
{:else}
	<details class="fc-pill-host fc-details" id={detailsId}>
		<summary class="fc-pill fc-pill--native fc-pill--summary" class:is-active={count > 0}>
			<span class="fc-pill__label" id={labelId}>{label}</span>
			{#if valueText}<span class="fc-value">{valueText}</span>{/if}
			<span class="fc-chevron" aria-hidden="true"></span>
		</summary>
		<fieldset class="fc-panel fc-panel--multi fc-panel--static" aria-labelledby={labelId}>
			{@render nativeBody()}
		</fieldset>
	</details>
{/if}

<style>
	.fc-pill-host {
		position: relative;
		display: inline-flex;
	}

	/* Native disclosure: the summary is the pill, the fieldset drops below it. */
	.fc-details {
		display: inline-block;
	}

	.fc-details .fc-pill--summary {
		list-style: none;
		user-select: none;
	}

	.fc-details .fc-pill--summary::-webkit-details-marker {
		display: none;
	}

	.fc-details[open] .fc-pill--summary :global(.fc-chevron) {
		transform: translateY(2px) rotate(225deg);
	}

	/* Static (non-popover) panel for the no-JS / touch details path. */
	.fc-panel--static {
		position: absolute;
		top: calc(100% + 0.375rem);
		left: 0;
		z-index: 50;
		min-width: 13rem;
		max-width: min(20rem, 90vw);
		max-height: 18rem;
	}

	.fc-option--label {
		margin: 0;
	}

	.fc-details .fc-check {
		flex: none;
		width: 1rem;
		height: 1rem;
		accent-color: var(--green);
		cursor: pointer;
	}

	/* ---- Tray-cell (variant="tray") ---- */
	.fc-field--multi {
		position: relative;
	}

	.fc-check {
		flex: none;
		width: 1rem;
		height: 1rem;
		accent-color: var(--green);
		cursor: pointer;
	}

	/* Native details rendered as a tray cell: summary stacks label over value. */
	.fc-multi-details .fc-field__summary {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		cursor: pointer;
	}

	.fc-multi-details .fc-field__summary::-webkit-details-marker {
		display: none;
	}

	.fc-multi-details .fc-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.fc-multi-details .fc-value {
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

	.fc-multi-details.is-empty .fc-value {
		font-style: italic;
		color: var(--muted);
	}

	.fc-multi-details .fc-field__summary .fc-chevron {
		flex: none;
		width: 0.6em;
		height: 0.6em;
		border-right: 1.5px solid var(--muted);
		border-bottom: 1.5px solid var(--muted);
		transform: translateY(-0.12em) rotate(45deg);
		transition: transform var(--duration-hover) var(--ease);
	}

	.fc-multi-details[open] .fc-field__summary .fc-chevron {
		transform: translateY(0.06em) rotate(225deg);
	}

	/* The popover panel for the tray cell anchors under the cell. */
	.fc-field--multi .fc-panel--static {
		position: absolute;
		top: calc(100% + 0.375rem);
		left: 0;
		z-index: 50;
	}
</style>
