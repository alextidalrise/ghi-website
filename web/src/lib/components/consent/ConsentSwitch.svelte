<script lang="ts">
	/**
	 * A square on/off switch — the project's first.
	 *
	 * DESIGN.md mandates `border-radius: 0` everywhere, which rules out the usual pill
	 * track. Rather than round a corner for this one control, the switch keeps the sliding
	 * affordance (which is what makes a switch read as "this is on now" rather than
	 * "selected for later") and squares it off: rectangular track, square thumb.
	 *
	 * `role="switch"` on a real <button>, so it is operable with Space and Enter for free
	 * and announces its state. The button is 44px tall for touch; the visible track is
	 * smaller and centred within it.
	 */
	type Props = {
		checked: boolean;
		/** Labels the control for assistive tech — the visible label sits outside it. */
		label: string;
		onchange: (checked: boolean) => void;
	};

	let { checked, label, onchange }: Props = $props();
</script>

<button
	type="button"
	role="switch"
	aria-checked={checked}
	aria-label={label}
	class="consent-switch"
	onclick={() => onchange(!checked)}
>
	<span class="consent-switch__track">
		<span class="consent-switch__thumb"></span>
	</span>
</button>

<style>
	.consent-switch {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* Comfortable touch target for the older audience PRODUCT.md describes; the
		   visible track is deliberately smaller than the hit area. */
		min-width: 3.5rem;
		min-height: 2.75rem;
		padding: 0;
		background: none;
		border: 0;
		cursor: pointer;
	}

	.consent-switch__track {
		display: block;
		position: relative;
		width: 2.75rem;
		height: 1.5rem;
		background: var(--white);
		border: 1px solid var(--muted);
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.consent-switch__thumb {
		position: absolute;
		top: 0.125rem;
		left: 0.125rem;
		width: 1.125rem;
		height: 1.125rem;
		background: var(--muted);
		/* Transform, not `left` — a layout property would be animated here otherwise. */
		transition:
			transform 180ms var(--ease),
			background var(--duration-hover) var(--ease);
	}

	.consent-switch[aria-checked='true'] .consent-switch__track {
		background: var(--green);
		border-color: var(--green);
	}

	.consent-switch[aria-checked='true'] .consent-switch__thumb {
		background: var(--on-green);
		transform: translateX(1.125rem);
	}

	.consent-switch:hover .consent-switch__track {
		border-color: var(--green);
	}

	.consent-switch:hover .consent-switch__thumb {
		background: var(--green);
	}

	.consent-switch[aria-checked='true']:hover .consent-switch__thumb {
		background: var(--on-green);
	}

	.consent-switch:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 2px;
	}

	.consent-switch:active .consent-switch__thumb {
		/* A slight widening on press, squared off like everything else. */
		width: 1.375rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.consent-switch__track,
		.consent-switch__thumb {
			transition: none;
		}
	}
</style>
