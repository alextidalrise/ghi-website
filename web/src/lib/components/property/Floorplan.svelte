<script lang="ts">
	// Floorplans are gated behind a request CTA: rather than preview the plan inline (their
	// formats vary too much), we always invite a request and email it over. The assets are
	// stripped from the payload server-side (see gatePropertyFloorplans), so this component
	// renders no image data.
	type Props = {
		/** Routes the visitor to the enquiry rail, flagged as a floorplan request. */
		onRequest: () => void;
	};

	let { onRequest }: Props = $props();
</script>

<section class="floorplan" aria-label="Floorplan">
	<div class="floorplan__head">
		<span class="floorplan__label">Floorplan</span>
	</div>

	<button type="button" class="floorplan__cta" onclick={onRequest}>
		<span class="floorplan__icon" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="3" width="18" height="18" />
				<path d="M3 9h9M12 3v18M12 14h9M16 14v7" />
			</svg>
		</span>
		<span class="floorplan__body">
			<span class="floorplan__title">Request floorplan</span>
			<span class="floorplan__note">Sent on request — we'll email it straight over.</span>
		</span>
		<span class="floorplan__arrow" aria-hidden="true">→</span>
	</button>
</section>

<style>
	.floorplan {
		padding-block: var(--space-sm);
	}

	/* Overline header, matching the Key Facts rhythm directly above it. */
	.floorplan__head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-bottom: 0.85rem;
	}

	.floorplan__label {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	/* --- Request CTA ---------------------------------------------------- */
	/* A bordered card, not a button-link: an icon to anchor it, the ask and a
	   reassurance line, and an arrow that leans in on intent. Mirrors the column's
	   hairline system so it reads as a deliberate panel. */
	.floorplan__cta {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		padding: clamp(0.9rem, 2.5vw, 1.15rem) clamp(1rem, 3vw, 1.35rem);
		border: 1px solid var(--border);
		background: var(--white);
		text-align: left;
		cursor: pointer;
		color: var(--green);
		transition:
			border-color var(--duration-hover) var(--ease),
			background var(--duration-hover) var(--ease);
	}

	.floorplan__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 2.75rem;
		height: 2.75rem;
		color: var(--green);
		background: oklch(0.96 0.01 165);
		border: 1px solid var(--border);
		transition:
			color var(--duration-hover) var(--ease),
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.floorplan__body {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
		flex: 1;
	}

	.floorplan__title {
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		color: var(--green);
		transition: color var(--duration-hover) var(--ease);
	}

	.floorplan__note {
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.4;
		color: var(--muted);
		text-wrap: pretty;
	}

	.floorplan__arrow {
		flex-shrink: 0;
		font-size: 1.1rem;
		color: var(--green);
		transition:
			transform var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.floorplan__cta:hover,
	.floorplan__cta:focus-visible {
		border-color: var(--green);
	}

	.floorplan__cta:hover .floorplan__icon,
	.floorplan__cta:focus-visible .floorplan__icon {
		color: var(--white);
		background: var(--green);
		border-color: var(--green);
	}

	.floorplan__cta:hover .floorplan__title,
	.floorplan__cta:focus-visible .floorplan__title,
	.floorplan__cta:hover .floorplan__arrow,
	.floorplan__cta:focus-visible .floorplan__arrow {
		color: var(--gold);
	}

	.floorplan__cta:hover .floorplan__arrow,
	.floorplan__cta:focus-visible .floorplan__arrow {
		transform: translateX(3px);
	}

	.floorplan__cta:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 3px;
	}

	@media (prefers-reduced-motion: reduce) {
		.floorplan__cta,
		.floorplan__icon,
		.floorplan__title,
		.floorplan__arrow {
			transition: none;
		}
	}
</style>
