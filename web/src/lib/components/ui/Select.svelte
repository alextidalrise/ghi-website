<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import { pointer, ensurePointer } from '$lib/ui/pointer.svelte';
	import { autoPosition, type FloatingAlign } from '$lib/ui/floating';
	import './filterControls.css';

	type Option = { label: string; value: string; disabled?: boolean };

	type Props = {
		/** Bound current value. Empty string means "no selection" (the placeholder). */
		value?: string;
		options: Option[];
		label: string;
		/** Empty-state label, rendered as the value="" option. Omit for an always-set field. */
		placeholder?: string;
		/** Form field name — keeps the native control as the no-JS submit source of truth. */
		name?: string;
		disabled?: boolean;
		variant?: 'tray' | 'chip' | 'pill';
		/** Inline alignment of the dropdown panel against its trigger. */
		align?: FloatingAlign;
		/** Pill variant: mark the control "active" (green) when a value is set. Sort opts out. */
		activeWhenSet?: boolean;
		title?: string;
		/** Flag stamp for the chip variant. */
		flag?: Snippet;
		onchange?: (value: string) => void;
	};

	let {
		value = $bindable(''),
		options,
		label,
		placeholder,
		name,
		disabled = false,
		variant = 'pill',
		align = 'start',
		activeWhenSet = true,
		title,
		flag,
		onchange
	}: Props = $props();

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const valueId = `${uid}-value`;
	const panelId = `${uid}-panel`;
	const optionId = (index: number) => `${uid}-opt-${index}`;

	// The placeholder is option 0 when present; selecting it clears the field.
	const allOptions = $derived<Option[]>(
		placeholder ? [{ label: placeholder, value: '' }, ...options] : options
	);
	const selected = $derived(options.find((option) => option.value === value));
	const displayText = $derived(selected?.label ?? placeholder ?? '');
	const isEmpty = $derived(!selected);
	const isCell = $derived(variant !== 'pill');

	// Render the bespoke listbox only on measured fine-pointer devices and never when
	// disabled (a disabled field keeps the inert native control).
	const showCustom = $derived(pointer.enhanced && !disabled);

	let open = $state(false);
	let activeIndex = $state(-1);
	let triggerEl = $state<HTMLButtonElement>();
	let panelEl = $state<HTMLDivElement>();
	let nativeEl = $state<HTMLSelectElement>();
	let detach: (() => void) | undefined;

	let typeahead = '';
	let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		ensurePointer();
		return () => {
			detach?.();
			clearTimeout(typeaheadTimer);
		};
	});

	function indexOfValue(): number {
		const found = allOptions.findIndex((option) => option.value === value);
		return found >= 0 ? found : 0;
	}

	function firstEnabled(from: number, step: number): number {
		let i = from;
		for (let guard = 0; guard < allOptions.length; guard++) {
			if (i < 0) i = allOptions.length - 1;
			if (i >= allOptions.length) i = 0;
			if (!allOptions[i].disabled) return i;
			i += step;
		}
		return from;
	}

	async function openPanel() {
		if (open || !panelEl || !triggerEl) return;
		open = true;
		activeIndex = firstEnabled(indexOfValue(), 1);
		panelEl.showPopover();
		await tick();
		detach = autoPosition(triggerEl, panelEl, { align, matchTriggerWidth: isCell });
		panelEl.focus({ preventScroll: true });
		scrollActiveIntoView();
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

	function commit(option: Option) {
		if (option.disabled) return;
		value = option.value;
		closePanel();
		onchange?.(option.value);
	}

	function onNativeChange() {
		onchange?.(value);
	}

	function scrollActiveIntoView() {
		if (activeIndex < 0) return;
		const node = panelEl?.querySelector<HTMLElement>(`#${CSS.escape(optionId(activeIndex))}`);
		node?.scrollIntoView({ block: 'nearest' });
	}

	function onTriggerKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp':
			case 'Enter':
			case ' ':
				event.preventDefault();
				openPanel();
				break;
		}
	}

	function onPanelKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				activeIndex = firstEnabled(activeIndex + 1, 1);
				scrollActiveIntoView();
				break;
			case 'ArrowUp':
				event.preventDefault();
				activeIndex = firstEnabled(activeIndex - 1, -1);
				scrollActiveIntoView();
				break;
			case 'Home':
				event.preventDefault();
				activeIndex = firstEnabled(0, 1);
				scrollActiveIntoView();
				break;
			case 'End':
				event.preventDefault();
				activeIndex = firstEnabled(allOptions.length - 1, -1);
				scrollActiveIntoView();
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (activeIndex >= 0) commit(allOptions[activeIndex]);
				break;
			case 'Escape':
				event.preventDefault();
				closePanel();
				break;
			case 'Tab':
				event.preventDefault();
				closePanel();
				break;
			default:
				if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) onTypeahead(event.key);
		}
	}

	function onTypeahead(char: string) {
		clearTimeout(typeaheadTimer);
		typeahead += char.toLowerCase();
		typeaheadTimer = setTimeout(() => (typeahead = ''), 600);
		const match = allOptions.findIndex(
			(option) => !option.disabled && option.label.toLowerCase().startsWith(typeahead)
		);
		if (match >= 0) {
			activeIndex = match;
			scrollActiveIntoView();
		}
	}

	// Light-dismiss for the manual popover: close on outside pointerdown.
	function onWindowPointerDown(event: PointerEvent) {
		if (!open) return;
		const target = event.target as Node;
		if (triggerEl?.contains(target) || panelEl?.contains(target)) return;
		closePanel(false);
	}
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

{#snippet checkMark()}
	<span class="fc-option__marker" aria-hidden="true">
		<svg viewBox="0 0 16 16" fill="none">
			<path d="M3 8.5 6.5 12 13 4.5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</span>
{/snippet}

{#snippet optionRow(option: Option, index: number)}
	<!-- aria-activedescendant listbox: options aren't individually focusable;
	     the listbox container owns focus + keyboard. Pointer click is a shortcut. -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		id={optionId(index)}
		class="fc-option"
		role="option"
		aria-selected={option.value === value}
		aria-disabled={option.disabled ? 'true' : undefined}
		data-active={index === activeIndex}
		onclick={() => commit(option)}
		onpointermove={() => (activeIndex = index)}
	>
		{@render checkMark()}
		<span class="fc-option__label">{option.label}</span>
	</div>
{/snippet}

{#if isCell}
	<div
		class="fc-field fc-field--{variant}"
		class:is-empty={isEmpty}
		class:is-disabled={disabled}
	>
		<span class="fc-label" id={labelId}>{label}</span>
		<div class="fc-control">
			{#if variant === 'chip'}
				<span class="fc-flag">{@render flag?.()}</span>
			{/if}

			{#if showCustom}
				<button
					bind:this={triggerEl}
					type="button"
					class="fc-trigger fc-trigger--cell"
					aria-haspopup="listbox"
					aria-controls={panelId}
					aria-expanded={open}
					aria-labelledby="{labelId} {valueId}"
					onclick={toggle}
					onkeydown={onTriggerKeydown}
				>
					<span class="fc-value" id={valueId}>{displayText}</span>
					<span class="fc-chevron" aria-hidden="true"></span>
				</button>
			{:else}
				<select
					bind:this={nativeEl}
					bind:value
					{name}
					{disabled}
					{title}
					class="fc-native"
					aria-labelledby={labelId}
					onchange={onNativeChange}
				>
					{#if placeholder}<option value="">{placeholder}</option>{/if}
					{#each options as option (option.value)}
						<option value={option.value} disabled={option.disabled}>{option.label}</option>
					{/each}
				</select>
			{/if}
		</div>

		{#if showCustom}
			<div
				bind:this={panelEl}
				id={panelId}
				class="fc-panel"
				popover="manual"
				role="listbox"
				aria-labelledby={labelId}
				tabindex="-1"
				aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
				onkeydown={onPanelKeydown}
			>
				<div class="fc-panel__list">
					{#each allOptions as option, index (option.value)}{@render optionRow(option, index)}{/each}
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="fc-pill-host">
		{#if showCustom}
			<button
				bind:this={triggerEl}
				type="button"
				class="fc-pill"
				class:is-active={activeWhenSet && !isEmpty}
				aria-haspopup="listbox"
				aria-controls={panelId}
				aria-expanded={open}
				onclick={toggle}
				onkeydown={onTriggerKeydown}
			>
				<span class="fc-pill__label" id={labelId}>{label}</span>
				{#if !isEmpty}<span class="fc-value" id={valueId}>{displayText}</span>{/if}
				<span class="fc-chevron" aria-hidden="true"></span>
			</button>
		{:else}
			<div class="fc-pill fc-pill--native" class:is-active={activeWhenSet && !isEmpty}>
				<span class="fc-pill__label" id={labelId}>{label}</span>
				<select
					bind:this={nativeEl}
					bind:value
					{name}
					{disabled}
					{title}
					class="fc-native fc-native--inline"
					aria-label={label}
					onchange={onNativeChange}
				>
					{#if placeholder}<option value="">{placeholder}</option>{/if}
					{#each options as option (option.value)}
						<option value={option.value} disabled={option.disabled}>{option.label}</option>
					{/each}
				</select>
			</div>
		{/if}

		{#if showCustom}
			<div
				bind:this={panelEl}
				id={panelId}
				class="fc-panel"
				popover="manual"
				role="listbox"
				aria-labelledby={labelId}
				tabindex="-1"
				aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
				onkeydown={onPanelKeydown}
			>
				<div class="fc-panel__list">
					{#each allOptions as option, index (option.value)}{@render optionRow(option, index)}{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.fc-pill-host {
		position: relative;
		display: inline-flex;
	}

	/* The native pill: label + inline native select, styled to match the custom pill. */
	.fc-pill--native {
		gap: 0.5ch;
	}

	.fc-pill--native :global(.fc-native--inline) {
		appearance: none;
		border: 0;
		background: transparent;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		color: var(--green);
		padding: 0 1.1em 0 0;
		cursor: pointer;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9' fill='none'%3E%3Cpath d='M1 1.5 7 7l6-5.5' stroke='%231F3D34' stroke-width='1.5'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0 center;
		background-size: 0.5em auto;
	}

	.fc-pill--native :global(.fc-native--inline:focus-visible) {
		outline: 2px solid var(--green);
		outline-offset: 3px;
	}
</style>
