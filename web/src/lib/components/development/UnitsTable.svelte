<script lang="ts">
	import type { PublicDevelopment } from '$lib/sanity/transforms';
	import { formatListingPrice, formatPropertyType } from '$lib/listing/formatPrice';

	type Props = {
		units: PublicDevelopment['units'];
		/** Canonical path of the parent development; unit hrefs are nested under it. */
		developmentPath: string;
		/** Whether per-unit prices may be shown (false for enquiry-led developments). */
		showPricing?: boolean;
	};

	let { units, developmentPath, showPricing = true }: Props = $props();

	type Row = {
		id: string;
		href: string | null;
		number: string;
		numberSort: number;
		available: boolean;
		statusLabel: string;
		price: string | null;
		priceSort: number;
		bedrooms: number | null;
		size: number | null;
		sizeLabel: string | null;
		floor: number | null;
		type: string | null;
		phase: string | null;
		completion: string | null;
	};

	function num(value: unknown): number | null {
		return typeof value === 'number' ? value : null;
	}

	function str(value: unknown): string | null {
		return typeof value === 'string' && value.trim() ? value.trim() : null;
	}

	function statusLabelFor(status: string | null): string {
		if (!status || status === 'available') return 'Available';
		return formatPropertyType(status);
	}

	/** Natural-ish numeric key from a unit number like "14.04" so sorting is sensible. */
	function numberSortKey(value: string): number {
		const match = value.match(/[\d.]+/);
		return match ? Number.parseFloat(match[0]) : Number.MAX_SAFE_INTEGER;
	}

	const rows = $derived.by((): Row[] =>
		(units ?? []).map((unit) => {
			const u = unit as Record<string, unknown>;
			const pricing = (u.pricing ?? null) as {
				price?: number | null;
				availabilityStatus?: string | null;
				completionStatus?: string | null;
			} | null;
			const specs = (u.specs ?? null) as Record<string, unknown> | null;

			const slug = str(u.slug);
			const status = pricing?.availabilityStatus ?? 'available';
			const available = status === 'available' || status === 'coming_soon' || status === 'under_offer';

			const number =
				str(u.unitNumber) ?? str(u.unitName) ?? str(u.ghiListingId) ?? 'Unit';

			const builtArea = num(specs?.builtArea);
			const areaUnit = (str(specs?.builtAreaUnit) ?? 'sqm') === 'sqft' ? 'sq ft' : 'm²';

			const priceText = showPricing ? formatListingPrice(pricing) : null;

			return {
				id: String(u._id ?? number),
				href: available && slug ? `${developmentPath}/${slug}` : null,
				number,
				numberSort: numberSortKey(number),
				available,
				statusLabel: statusLabelFor(status),
				price: priceText,
				priceSort: typeof pricing?.price === 'number' ? pricing.price : Number.MAX_SAFE_INTEGER,
				bedrooms: num(specs?.bedrooms),
				size: builtArea,
				sizeLabel: builtArea != null ? `${builtArea.toLocaleString('en-GB')} ${areaUnit}` : null,
				floor: num(u.floor),
				type: str(u.propertyType) ? formatPropertyType(str(u.propertyType)) : str(u.unitTypeName),
				phase: str(u.phase),
				completion: pricing?.completionStatus ? formatPropertyType(pricing.completionStatus) : null
			};
		})
	);

	// Columns appear only when at least one unit carries that data, so villa-style
	// developments without floors/phases don't ship empty columns.
	const hasFloor = $derived(rows.some((r) => r.floor != null));
	const hasPhase = $derived(rows.some((r) => r.phase != null));
	const hasType = $derived(rows.some((r) => r.type != null));
	const hasCompletion = $derived(rows.some((r) => r.completion != null));
	const hasPrice = $derived(showPricing && rows.some((r) => r.price != null));

	type SortKey = 'number' | 'status' | 'price' | 'bedrooms' | 'size' | 'floor' | 'type' | 'phase' | 'completion';

	let sortKey = $state<SortKey>('number');
	let sortDir = $state<'asc' | 'desc'>('asc');

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	function compare(a: Row, b: Row): number {
		const dir = sortDir === 'asc' ? 1 : -1;
		switch (sortKey) {
			case 'price':
				return (a.priceSort - b.priceSort) * dir;
			case 'bedrooms':
				return ((a.bedrooms ?? Infinity) - (b.bedrooms ?? Infinity)) * dir;
			case 'size':
				return ((a.size ?? Infinity) - (b.size ?? Infinity)) * dir;
			case 'floor':
				return ((a.floor ?? Infinity) - (b.floor ?? Infinity)) * dir;
			case 'status':
				return a.statusLabel.localeCompare(b.statusLabel) * dir;
			case 'type':
				return (a.type ?? '').localeCompare(b.type ?? '') * dir;
			case 'phase':
				return (a.phase ?? '').localeCompare(b.phase ?? '') * dir;
			case 'completion':
				return (a.completion ?? '').localeCompare(b.completion ?? '') * dir;
			case 'number':
			default:
				return (a.numberSort - b.numberSort) * dir || a.number.localeCompare(b.number) * dir;
		}
	}

	const sorted = $derived([...rows].sort(compare));
	const availableCount = $derived(rows.filter((r) => r.available).length);

	const columns = $derived.by(() => {
		const cols: Array<{ key: SortKey; label: string; numeric?: boolean }> = [
			{ key: 'number', label: 'Unit' },
			{ key: 'status', label: 'Status' }
		];
		if (hasPrice) cols.push({ key: 'price', label: 'Price', numeric: true });
		cols.push({ key: 'bedrooms', label: 'Beds', numeric: true });
		cols.push({ key: 'size', label: 'Size', numeric: true });
		if (hasFloor) cols.push({ key: 'floor', label: 'Floor', numeric: true });
		if (hasType) cols.push({ key: 'type', label: 'Type' });
		if (hasPhase) cols.push({ key: 'phase', label: 'Phase' });
		if (hasCompletion) cols.push({ key: 'completion', label: 'Completion' });
		return cols;
	});
</script>

{#if rows.length > 0}
	<section class="units content-wrap" aria-labelledby="units-heading">
		<div class="units__head">
			<h2 id="units-heading">Properties available</h2>
			<p class="units__count">
				{availableCount} of {rows.length}
				{rows.length === 1 ? 'home' : 'homes'} available
			</p>
		</div>

		<div class="units__scroll">
			<table class="units__table">
				<thead>
					<tr>
						{#each columns as col (col.key)}
							<th
								scope="col"
								class:units__th--numeric={col.numeric}
								aria-sort={sortKey === col.key
									? sortDir === 'asc'
										? 'ascending'
										: 'descending'
									: 'none'}
							>
								<button
									type="button"
									class="units__sort"
									onclick={() => toggleSort(col.key)}
								>
									<span>{col.label}</span>
									<span class="units__caret" aria-hidden="true">
										{#if sortKey === col.key}{sortDir === 'asc' ? '▲' : '▼'}{:else}↕{/if}
									</span>
								</button>
							</th>
						{/each}
						<th scope="col"><span class="visually-hidden">View</span></th>
					</tr>
				</thead>
				<tbody>
					{#each sorted as row (row.id)}
						<tr class:units__row--reserved={!row.available}>
							<th scope="row" data-label="Unit" class="units__cell-unit">
								{#if row.href}
									<a href={row.href} class="units__link">{row.number}</a>
								{:else}
									<span>{row.number}</span>
								{/if}
							</th>
							<td data-label="Status">{row.statusLabel}</td>
							{#if hasPrice}
								<td data-label="Price" class="units__td--numeric tabular-nums">
									{row.price ?? '—'}
								</td>
							{/if}
							<td data-label="Beds" class="units__td--numeric tabular-nums">
								{row.bedrooms ?? '—'}
							</td>
							<td data-label="Size" class="units__td--numeric tabular-nums">
								{row.sizeLabel ?? '—'}
							</td>
							{#if hasFloor}
								<td data-label="Floor" class="units__td--numeric tabular-nums">
									{row.floor ?? '—'}
								</td>
							{/if}
							{#if hasType}
								<td data-label="Type">{row.type ?? '—'}</td>
							{/if}
							{#if hasPhase}
								<td data-label="Phase">{row.phase ?? '—'}</td>
							{/if}
							{#if hasCompletion}
								<td data-label="Completion">{row.completion ?? '—'}</td>
							{/if}
							<td data-label="" class="units__cell-action">
								{#if row.href}
									<a href={row.href} class="units__view">
										View<span aria-hidden="true"> →</span>
									</a>
								{:else}
									<span class="units__reserved-tag">{row.statusLabel}</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/if}

<style>
	.units {
		padding-block: var(--space-xl);
	}

	.units__head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-sm) var(--space-md);
		margin-bottom: var(--space-md);
	}

	.units__count {
		font-size: var(--text-ui);
		color: var(--muted);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
	}

	/* Horizontal escape valve on mid widths before the mobile stack kicks in. */
	.units__scroll {
		overflow-x: auto;
	}

	.units__scroll:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 2px;
	}

	.units__table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-ui);
	}

	.units__table thead th {
		border-bottom: 1px solid var(--green);
		text-align: left;
		vertical-align: bottom;
		padding: 0 var(--space-md) var(--space-xs) 0;
	}

	.units__th--numeric {
		text-align: right;
	}

	.units__sort {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0;
		border: 0;
		background: none;
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		cursor: pointer;
	}

	.units__th--numeric .units__sort {
		flex-direction: row-reverse;
	}

	.units__sort:hover,
	.units__sort:focus-visible {
		color: var(--charcoal);
	}

	.units__sort:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 2px;
	}

	.units__caret {
		font-size: 0.6rem;
		color: var(--muted);
	}

	.units__table tbody td,
	.units__table tbody th {
		padding: var(--space-sm) var(--space-md) var(--space-sm) 0;
		border-bottom: 1px solid var(--border);
		text-align: left;
		font-weight: 400;
		color: var(--charcoal);
		vertical-align: middle;
	}

	.units__td--numeric {
		text-align: right;
		white-space: nowrap;
	}

	.units__cell-unit {
		font-family: var(--serif);
		font-size: 1.05rem;
		color: var(--green);
	}

	.units__link {
		color: var(--green);
		text-decoration: none;
		border-bottom: 1px solid var(--border);
		transition: border-color var(--duration-hover) var(--ease);
	}

	.units__link:hover,
	.units__link:focus-visible {
		border-bottom-color: var(--green);
	}

	.units__cell-action {
		text-align: right;
		white-space: nowrap;
	}

	.units__view {
		color: var(--green);
		text-decoration: none;
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		font-size: var(--text-small);
		transition: color var(--duration-hover) var(--ease);
	}

	.units__view span {
		display: inline-block;
		transition: transform var(--duration-hover) var(--ease);
	}

	.units__view:hover,
	.units__view:focus-visible {
		color: var(--gold);
	}

	.units__view:hover span,
	.units__view:focus-visible span {
		transform: translateX(3px);
	}

	.units__reserved-tag {
		font-size: var(--text-small);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--muted);
	}

	/* Reserved/sold units stay listed but recede and don't invite a click. */
	.units__row--reserved {
		color: var(--muted);
	}

	.units__row--reserved th,
	.units__row--reserved td {
		color: var(--muted);
	}

	.visually-hidden {
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

	/* Mobile: the wide table collapses to one stacked record per unit, each field on
	   its own labelled row. Far more usable than a pinch-zoom horizontal scroll. */
	@media (max-width: 720px) {
		.units__scroll {
			overflow-x: visible;
		}

		.units__table thead {
			position: absolute;
			width: 1px;
			height: 1px;
			margin: -1px;
			overflow: hidden;
			clip: rect(0 0 0 0);
		}

		.units__table,
		.units__table tbody,
		.units__table tr,
		.units__table td,
		.units__table th {
			display: block;
			width: 100%;
		}

		.units__table tbody tr {
			padding: var(--space-md) 0;
			border-bottom: 1px solid var(--border);
		}

		.units__table tbody td,
		.units__table tbody th {
			display: flex;
			justify-content: space-between;
			gap: var(--space-md);
			padding: 0.3rem 0;
			border: 0;
			text-align: right;
		}

		.units__table tbody th[data-label]::before,
		.units__table tbody td[data-label]:not([data-label=''])::before {
			content: attr(data-label);
			font-family: var(--sans);
			font-size: var(--text-overline);
			font-weight: 500;
			letter-spacing: var(--tracking-overline);
			text-transform: uppercase;
			color: var(--muted);
			text-align: left;
		}

		.units__cell-unit {
			font-size: 1.25rem;
			margin-bottom: 0.25rem;
		}

		.units__cell-action {
			margin-top: var(--space-xs);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.units__link,
		.units__view,
		.units__view span {
			transition: none;
		}
	}
</style>
