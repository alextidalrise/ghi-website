/**
 * Minimal floating-panel positioning for the filter dropdowns.
 *
 * The panels live in the top layer (Popover API), so they already escape every
 * ancestor's `overflow`/stacking context — all that's left is to tether each panel
 * to its trigger with viewport-fixed coordinates, flip above when the viewport edge
 * is close, and clamp height to the available space. Kept dependency-free and
 * deliberately small; CSS anchor positioning isn't universal yet, so JS owns this.
 */

export type FloatingAlign = 'start' | 'end';

export type FloatingOptions = {
	/** Align the panel's inline edge to the trigger's start (left) or end (right). */
	align?: FloatingAlign;
	/** Gap between trigger and panel, in px. */
	gap?: number;
	/** Floor the panel width to the trigger width (selects read as "from this field"). */
	matchTriggerWidth?: boolean;
	/** Smallest panel height worth showing before we'd rather flip. */
	minHeight?: number;
};

const VIEWPORT_MARGIN = 8;

/** Position `panel` (a fixed, top-layer element) against `trigger`. Call while open. */
export function positionFloating(
	trigger: HTMLElement,
	panel: HTMLElement,
	options: FloatingOptions = {}
): void {
	const { align = 'start', gap = 6, matchTriggerWidth = true, minHeight = 140 } = options;

	// Let the panel size to content first so measurements reflect its natural box.
	panel.style.maxHeight = '';
	const triggerRect = trigger.getBoundingClientRect();
	if (matchTriggerWidth) {
		panel.style.minWidth = `${triggerRect.width}px`;
	}

	const panelRect = panel.getBoundingClientRect();
	const viewportH = window.innerHeight;
	const viewportW = window.innerWidth;

	const spaceBelow = viewportH - triggerRect.bottom - gap - VIEWPORT_MARGIN;
	const spaceAbove = triggerRect.top - gap - VIEWPORT_MARGIN;

	// Flip above only when below can't hold the panel and above has more room.
	const flipUp = panelRect.height > spaceBelow && spaceAbove > spaceBelow;
	const available = Math.max(minHeight, flipUp ? spaceAbove : spaceBelow);
	const height = Math.min(panelRect.height, available);
	panel.style.maxHeight = `${Math.round(available)}px`;

	const top = flipUp ? triggerRect.top - gap - height : triggerRect.bottom + gap;

	// Inline: align to the requested edge, then clamp inside the viewport.
	const width = Math.max(panelRect.width, matchTriggerWidth ? triggerRect.width : 0);
	let left = align === 'end' ? triggerRect.right - width : triggerRect.left;
	left = Math.min(left, viewportW - width - VIEWPORT_MARGIN);
	left = Math.max(VIEWPORT_MARGIN, left);

	panel.style.position = 'fixed';
	panel.style.top = `${Math.round(Math.max(VIEWPORT_MARGIN, top))}px`;
	panel.style.left = `${Math.round(left)}px`;
}

/**
 * Position now, then keep the panel pinned through scroll/resize. Returns a cleanup
 * function that detaches the listeners — call it when the panel closes.
 */
export function autoPosition(
	trigger: HTMLElement,
	panel: HTMLElement,
	options: FloatingOptions = {}
): () => void {
	const update = () => positionFloating(trigger, panel, options);
	update();
	// Capture-phase scroll so we react to any scrolling ancestor, not just the window.
	window.addEventListener('scroll', update, true);
	window.addEventListener('resize', update);
	return () => {
		window.removeEventListener('scroll', update, true);
		window.removeEventListener('resize', update);
	};
}
