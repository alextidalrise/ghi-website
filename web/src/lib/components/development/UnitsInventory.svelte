<script lang="ts">
	import type { PublicDevelopment } from '$lib/sanity/transforms';
	import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';
	import { formatListingPrice, formatPropertyType } from '$lib/listing/formatPrice';
	import { buildPublicImageUrl, buildImageSrcset, getImagePlaceholder } from '$lib/sanity/image';

	type Props = {
		units: PublicDevelopment['units'];
		unitTypes?: PublicDevelopment['unitTypes'];
		/** Development name, stripped from unit-type labels so chips read "Plots" not "Monte Rei plots". */
		developmentName?: string | null;
		/** Canonical path of the parent development; unit hrefs are nested under it. */
		developmentPath: string;
		/** Whether per-unit prices may be shown (false for enquiry-led developments). */
		showPricing?: boolean;
	};

	let {
		units,
		unitTypes = [],
		developmentName = null,
		developmentPath,
		showPricing = true
	}: Props = $props();

	type Row = {
		id: string;
		href: string | null;
		number: string;
		numberSort: number;
		available: boolean;
		statusLabel: string;
		price: string | null;
		priceValue: number | null;
		bedrooms: number | null;
		size: number | null;
		sizeLabel: string | null;
		floor: number | null;
		typeLabel: string | null;
		unitTypeKey: string | null;
		propertyTypeKey: string | null;
		phase: string | null;
		completion: string | null;
	};

	function num(value: unknown): number | null {
		return typeof value === 'number' ? value : null;
	}

	function str(value: unknown): string | null {
		return typeof value === 'string' && value.trim() ? value.trim() : null;
	}

	function firstImage(list: unknown): MediaAssetInput | null {
		return Array.isArray(list) && list.length > 0 ? (list[0] as MediaAssetInput) : null;
	}

	/** Drop the development-name prefix so "Monte Rei linked villas" reads as "Linked villas". */
	function shortTypeLabel(name: string): string {
		let label = name;
		const dev = developmentName?.trim();
		if (dev) {
			const escaped = dev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			label = label.replace(new RegExp(`^${escaped}\\s+`, 'i'), '').trim();
		}
		if (!label) label = name;
		return label.charAt(0).toUpperCase() + label.slice(1);
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

	// First gallery image per unit-type name, so a unit with no own photos can still
	// borrow its type's hero for the thumbnail and the selector tile.
	const typeImages = $derived.by(() => {
		const map = new Map<string, MediaAssetInput>();
		for (const ut of unitTypes ?? []) {
			const name = str((ut as Record<string, unknown>).unitTypeName);
			const img = firstImage((ut as Record<string, unknown>).gallery);
			if (name && img) map.set(name, img);
		}
		return map;
	});

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
			const available =
				status === 'available' || status === 'coming_soon' || status === 'under_offer';

			const number = str(u.unitNumber) ?? str(u.unitName) ?? str(u.ghiListingId) ?? 'Unit';

			const builtArea = num(specs?.builtArea);
			const areaUnit = (str(specs?.builtAreaUnit) ?? 'sqm') === 'sqft' ? 'sq ft' : 'm²';

			const unitTypeKey = str(u.unitTypeName);
			const propertyTypeKey = str(u.propertyType);

			return {
				id: String(u._id ?? number),
				href: available && slug ? `${developmentPath}/${slug}` : null,
				number,
				numberSort: numberSortKey(number),
				available,
				statusLabel: statusLabelFor(status),
				price: showPricing ? formatListingPrice(pricing) : null,
				priceValue: showPricing && typeof pricing?.price === 'number' ? pricing.price : null,
				bedrooms: num(specs?.bedrooms),
				size: builtArea,
				sizeLabel: builtArea != null ? `${builtArea.toLocaleString('en-GB')} ${areaUnit}` : null,
				floor: num(u.floor),
				typeLabel: propertyTypeKey ? formatPropertyType(propertyTypeKey) : unitTypeKey,
				unitTypeKey,
				propertyTypeKey,
				phase: str(u.phase),
				completion:
					pricing?.completionStatus && pricing.completionStatus !== 'unknown'
						? formatPropertyType(pricing.completionStatus)
						: null
			};
		})
	);

	const currency = $derived(
		((units ?? [])
			.map((u) => (u as { pricing?: { currency?: string | null } }).pricing?.currency)
			.find((c): c is string => Boolean(c))) ?? 'EUR'
	);

	// Columns appear only when at least one unit carries that data.
	const hasFloor = $derived(rows.some((r) => r.floor != null));
	const hasType = $derived(rows.some((r) => r.typeLabel != null));
	const hasPrice = $derived(showPricing && rows.some((r) => r.price != null));

	type Group = {
		key: string;
		label: string;
		count: number;
		availableCount: number;
		fromPrice: string | null;
		image: MediaAssetInput | null;
		memberIds: Set<string>;
	};

	function buildGroup(
		key: string,
		label: string,
		members: Row[],
		image: MediaAssetInput | null
	): Group {
		const prices = members.map((m) => m.priceValue).filter((v): v is number => v != null);
		const fromPrice =
			hasPrice && prices.length > 0
				? formatListingPrice({ price: Math.min(...prices), currency, priceQualifier: 'from' })
				: null;
		return {
			key,
			label,
			count: members.length,
			availableCount: members.filter((m) => m.available).length,
			fromPrice,
			image,
			memberIds: new Set(members.map((m) => m.id))
		};
	}

	// Prefer typed groups (each carries its own photo + from-price). Fall back to the
	// coarser property-type split for developments modelled without unit types.
	const unitTypeGroups = $derived.by((): Group[] => {
		const out: Group[] = [];
		for (const ut of unitTypes ?? []) {
			const name = str((ut as Record<string, unknown>).unitTypeName);
			if (!name) continue;
			const members = rows.filter((r) => r.unitTypeKey === name);
			if (members.length === 0) continue;
			out.push(
				buildGroup(name, shortTypeLabel(name), members, firstImage((ut as Record<string, unknown>).gallery))
			);
		}
		return out;
	});

	const propertyTypeGroups = $derived.by((): Group[] => {
		const order: string[] = [];
		const byKey = new Map<string, Row[]>();
		for (const r of rows) {
			const key = r.propertyTypeKey;
			if (!key) continue;
			if (!byKey.has(key)) {
				byKey.set(key, []);
				order.push(key);
			}
			byKey.get(key)!.push(r);
		}
		return order.map((key) =>
			buildGroup(key, formatPropertyType(key), byKey.get(key)!, typeImages.get(key) ?? null)
		);
	});

	const groups = $derived(
		unitTypeGroups.length >= 2
			? unitTypeGroups
			: propertyTypeGroups.length >= 2
				? propertyTypeGroups
				: []
	);
	const showSelector = $derived(groups.length >= 2);
	const selectorHasImages = $derived(groups.some((g) => g.image));

	let activeKey = $state<string | null>(null);
	const activeGroup = $derived(groups.find((g) => g.key === activeKey) ?? null);
	const filtered = $derived(
		activeGroup ? rows.filter((r) => activeGroup.memberIds.has(r.id)) : rows
	);

	const availableCount = $derived(rows.filter((r) => r.available).length);

	// --- Sorting -------------------------------------------------------------
	const sortOptions = $derived.by(() => {
		const opts: Array<[string, string]> = [];
		if (hasPrice) {
			opts.push(['price-asc', 'Price: low to high']);
			opts.push(['price-desc', 'Price: high to low']);
		}
		opts.push(['bedrooms-desc', 'Bedrooms: most first']);
		opts.push(['size-desc', 'Size: largest first']);
		opts.push(['number-asc', 'Unit number']);
		return opts;
	});
	const defaultSort = $derived(hasPrice ? 'price-asc' : 'number-asc');
	let sortValue = $state<string | null>(null);
	const effectiveSort = $derived(sortValue ?? defaultSort);

	function compare(a: Row, b: Row): number {
		const [key, dirStr] = effectiveSort.split('-');
		const dir = dirStr === 'asc' ? 1 : -1;
		switch (key) {
			case 'price': {
				// Units without a public price always sink to the bottom, both directions.
				if (a.priceValue == null && b.priceValue == null) return 0;
				if (a.priceValue == null) return 1;
				if (b.priceValue == null) return -1;
				return (a.priceValue - b.priceValue) * dir;
			}
			case 'bedrooms':
				return ((a.bedrooms ?? -Infinity) - (b.bedrooms ?? -Infinity)) * dir;
			case 'size':
				return ((a.size ?? -Infinity) - (b.size ?? -Infinity)) * dir;
			default:
				return (a.numberSort - b.numberSort) * dir || a.number.localeCompare(b.number) * dir;
		}
	}

	const sorted = $derived([...filtered].sort(compare));

	// --- Pagination ----------------------------------------------------------
	const PAGE_SIZE = 12;
	let page = $state(1);
	const pageCount = $derived(Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)));
	const safePage = $derived(Math.min(page, pageCount));
	const paged = $derived(sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE));

	function pageWindow(current: number, total: number): (number | '…')[] {
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
		const out: (number | '…')[] = [1];
		if (current > 3) out.push('…');
		for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) out.push(p);
		if (current < total - 2) out.push('…');
		out.push(total);
		return out;
	}
	const pages = $derived(pageWindow(safePage, pageCount));

	// --- Interaction ---------------------------------------------------------
	let sectionEl: HTMLElement | undefined = $state();
	let expandedId = $state<string | null>(null);

	function selectType(key: string | null) {
		activeKey = key;
		page = 1;
		expandedId = null;
	}

	function onSortChange(value: string) {
		sortValue = value;
		page = 1;
		expandedId = null;
	}

	function goToPage(p: number) {
		if (p < 1 || p > pageCount || p === safePage) return;
		page = p;
		expandedId = null;
		sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function toggleCard(id: string) {
		expandedId = expandedId === id ? null : id;
	}

	// Thumbnail (square crop) for selector tiles and mobile cards.
	function thumbSrc(asset: MediaAssetInput | null, size = 200): string | null {
		return buildPublicImageUrl(asset, { width: size, height: size, fit: 'crop', quality: 70 });
	}
	function thumbSrcset(asset: MediaAssetInput | null, size = 200): string {
		return buildImageSrcset(asset, [size, size * 2], { height: size, fit: 'crop', quality: 70 });
	}

	const homesWord = $derived(rows.length === 1 ? 'home' : 'homes');
	const resultLabel = $derived(
		activeGroup
			? `${sorted.length} of ${rows.length} homes`
			: `${sorted.length} ${sorted.length === 1 ? 'home' : 'homes'}`
	);
</script>

{#if rows.length > 0}
	<section bind:this={sectionEl} class="units content-wrap" aria-labelledby="units-heading">
		<div class="units__head">
			<h2 id="units-heading">Properties available</h2>
			<p class="units__count">{availableCount} of {rows.length} {homesWord} available</p>
		</div>

		{#if showSelector}
			<div
				class="units__filters"
				class:units__filters--photo={selectorHasImages}
				role="group"
				aria-label="Filter by property type"
			>
				<button
					type="button"
					class="tfilter"
					class:tfilter--active={activeKey === null}
					aria-pressed={activeKey === null}
					onclick={() => selectType(null)}
				>
					{#if selectorHasImages}
						<span class="tfilter__media tfilter__media--all" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none">
								<rect x="3" y="3" width="7.5" height="7.5" />
								<rect x="13.5" y="3" width="7.5" height="7.5" />
								<rect x="3" y="13.5" width="7.5" height="7.5" />
								<rect x="13.5" y="13.5" width="7.5" height="7.5" />
							</svg>
						</span>
					{/if}
					<span class="tfilter__body">
						<span class="tfilter__label">All homes</span>
						<span class="tfilter__meta">{rows.length} {homesWord}</span>
					</span>
				</button>

				{#each groups as group (group.key)}
					<button
						type="button"
						class="tfilter"
						class:tfilter--active={activeKey === group.key}
						aria-pressed={activeKey === group.key}
						onclick={() => selectType(group.key)}
					>
						{#if selectorHasImages}
							<span
								class="tfilter__media"
								aria-hidden="true"
								style:background-image={group.image && getImagePlaceholder(group.image)
									? `url(${getImagePlaceholder(group.image)})`
									: undefined}
							>
								{#if group.image}
									<img
										src={thumbSrc(group.image, 220)}
										srcset={thumbSrcset(group.image, 220)}
										sizes="(max-width: 720px) 2rem, 220px"
										alt=""
										width="220"
										height="220"
										loading="lazy"
										decoding="async"
									/>
								{:else}
									<span class="tfilter__media--all">
										<svg viewBox="0 0 24 24" fill="none">
											<rect x="4" y="4" width="16" height="16" />
										</svg>
									</span>
								{/if}
							</span>
						{/if}
						<span class="tfilter__body">
							<span class="tfilter__label">{group.label}</span>
							<span class="tfilter__meta">
								{group.count} {group.count === 1 ? 'home' : 'homes'}{#if group.fromPrice}<span class="tfilter__from"> · {group.fromPrice}</span>{/if}
							</span>
						</span>
					</button>
				{/each}
			</div>
		{/if}

		<div class="units__bar">
			<p class="units__showing" aria-live="polite">{resultLabel}</p>
			<label class="units__sortctl">
				<span class="units__sortctl-label">Sort</span>
				<span class="units__select">
					<select value={effectiveSort} onchange={(e) => onSortChange(e.currentTarget.value)}>
						{#each sortOptions as [value, label] (value)}
							<option {value}>{label}</option>
						{/each}
					</select>
					<span class="units__select-caret" aria-hidden="true">▾</span>
				</span>
			</label>
		</div>

		<!-- Desktop: a lean comparison table. -->
		<div class="units__desktop">
			<table class="utable">
				<thead>
					<tr>
						<th scope="col">Unit</th>
						{#if hasPrice}<th scope="col" class="utable__num">Price</th>{/if}
						<th scope="col" class="utable__num">Beds</th>
						<th scope="col" class="utable__num">Size</th>
						{#if hasFloor}<th scope="col" class="utable__num">Floor</th>{/if}
						{#if hasType && !activeGroup}<th scope="col">Type</th>{/if}
						<th scope="col"><span class="visually-hidden">View</span></th>
					</tr>
				</thead>
				<tbody>
					{#each paged as row (row.id)}
						<tr class:utable__row--reserved={!row.available}>
							<th scope="row" class="utable__unit">
								{#if row.href}
									<a href={row.href} class="utable__unitlink">{row.number}</a>
								{:else}
									<span>{row.number}</span>
								{/if}
							</th>
							{#if hasPrice}
								<td class="utable__num tabular-nums">{row.price ?? '—'}</td>
							{/if}
							<td class="utable__num tabular-nums">{row.bedrooms ?? '—'}</td>
							<td class="utable__num tabular-nums">{row.sizeLabel ?? '—'}</td>
							{#if hasFloor}
								<td class="utable__num tabular-nums">{row.floor ?? '—'}</td>
							{/if}
							{#if hasType && !activeGroup}
								<td>{row.typeLabel ?? '—'}</td>
							{/if}
							<td class="utable__action">
								{#if row.href}
									<a href={row.href} class="units__view">View<span aria-hidden="true"> →</span></a>
								{:else}
									<span class="units__statustag">{row.statusLabel}</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile: a compact list of one-tap-to-expand cards. -->
		<ul class="ucards">
			{#each paged as row (row.id)}
				<li class="ucard" class:ucard--reserved={!row.available}>
					<button
						type="button"
						class="ucard__head"
						aria-expanded={expandedId === row.id}
						aria-controls={`ucard-panel-${row.id}`}
						onclick={() => toggleCard(row.id)}
					>
						<span class="ucard__title"
							>{row.number}{#if row.typeLabel && !activeGroup}<span class="ucard__type"> · {row.typeLabel}</span
								>{/if}</span
						>
						<span class="ucard__rowmeta">
							{#if row.bedrooms != null || row.sizeLabel}
								<span class="ucard__specs"
									>{#if row.bedrooms != null}{row.bedrooms} {row.bedrooms === 1 ? 'bed' : 'beds'}{/if}{#if row.bedrooms != null && row.sizeLabel} · {/if}{#if row.sizeLabel}{row.sizeLabel}{/if}</span
								>
							{/if}
							{#if row.available && row.price}
								<span class="ucard__price">{row.price}</span>
							{:else if !row.available}
								<span class="ucard__status">{row.statusLabel}</span>
							{/if}
						</span>
						<span class="ucard__toggle" aria-hidden="true">{expandedId === row.id ? '−' : '+'}</span>
					</button>
					<div
						class="ucard__panel"
						id={`ucard-panel-${row.id}`}
						class:ucard__panel--open={expandedId === row.id}
					>
						<div class="ucard__panel-inner">
							<dl class="ucard__facts">
								{#if row.typeLabel}
									<div><dt>Type</dt><dd>{row.typeLabel}</dd></div>
								{/if}
								<div><dt>Status</dt><dd>{row.statusLabel}</dd></div>
								{#if row.floor != null}
									<div><dt>Floor</dt><dd>{row.floor}</dd></div>
								{/if}
								{#if row.phase}
									<div><dt>Phase</dt><dd>{row.phase}</dd></div>
								{/if}
								{#if row.completion}
									<div><dt>Completion</dt><dd>{row.completion}</dd></div>
								{/if}
							</dl>
							{#if row.href}
								<a href={row.href} class="ucard__view">View this home<span aria-hidden="true"> →</span></a>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>

		{#if pageCount > 1}
			<nav class="upager" aria-label="Inventory pages">
				<button
					type="button"
					class="upager__step"
					disabled={safePage === 1}
					onclick={() => goToPage(safePage - 1)}
				>
					<span aria-hidden="true">←</span><span class="visually-hidden">Previous page</span>
				</button>
				<ul class="upager__list">
					{#each pages as p, i (i)}
						{#if p === '…'}
							<li class="upager__gap" aria-hidden="true">…</li>
						{:else}
							<li>
								<button
									type="button"
									class="upager__page"
									class:upager__page--active={p === safePage}
									aria-current={p === safePage ? 'page' : undefined}
									onclick={() => goToPage(p)}
								>
									{p}
								</button>
							</li>
						{/if}
					{/each}
				</ul>
				<button
					type="button"
					class="upager__step"
					disabled={safePage === pageCount}
					onclick={() => goToPage(safePage + 1)}
				>
					<span aria-hidden="true">→</span><span class="visually-hidden">Next page</span>
				</button>
			</nav>
		{/if}
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
		margin-bottom: var(--space-lg);
	}

	.units__count {
		font-size: var(--text-ui);
		color: var(--muted);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
	}

	/* ---- Type selector ---------------------------------------------------- */
	.units__filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.tfilter {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.55rem 1rem 0.55rem 0.6rem;
		border: 1px solid var(--border);
		background: var(--white);
		color: var(--charcoal);
		font-family: var(--sans);
		text-align: left;
		cursor: pointer;
		transition:
			border-color var(--duration-hover) var(--ease),
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.tfilter:hover,
	.tfilter:focus-visible {
		border-color: var(--green);
	}

	.tfilter:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 2px;
	}

	.tfilter--active {
		background: var(--green);
		border-color: var(--green);
		color: var(--on-green);
	}

	.tfilter__body {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.tfilter__label {
		font-size: var(--text-ui);
		font-weight: 500;
		line-height: 1.2;
	}

	.tfilter__meta {
		font-size: var(--text-small);
		color: var(--muted);
		white-space: nowrap;
	}

	.tfilter--active .tfilter__meta {
		color: color-mix(in srgb, var(--on-green) 75%, transparent);
	}

	.tfilter__from {
		color: var(--green);
	}

	.tfilter--active .tfilter__from {
		color: var(--gold);
	}

	/* Photo variant: a thumbnail leads each tile. */
	.units__filters--photo .tfilter {
		flex-direction: column;
		align-items: stretch;
		gap: 0;
		width: clamp(8.5rem, 22vw, 11rem);
		padding: 0;
		overflow: hidden;
	}

	.tfilter__media {
		display: block;
		aspect-ratio: 3 / 2;
		background: color-mix(in srgb, var(--green) 6%, var(--white));
		overflow: hidden;
		/* Blurred LQIP shows through until the thumbnail paints over it. */
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	.tfilter__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: transform var(--duration-image) var(--ease);
	}

	.tfilter:hover .tfilter__media img,
	.tfilter:focus-visible .tfilter__media img {
		transform: scale(1.04);
	}

	.tfilter__media--all {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		color: var(--green);
	}

	.tfilter__media--all svg {
		width: 38%;
		height: auto;
	}

	.tfilter__media--all rect {
		fill: currentColor;
		opacity: 0.85;
	}

	.units__filters--photo .tfilter__body {
		padding: 0.6rem 0.75rem 0.7rem;
		gap: 0.2rem;
	}

	.units__filters--photo .tfilter__meta {
		white-space: normal;
	}

	/* ---- Sort bar --------------------------------------------------------- */
	.units__bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm) var(--space-md);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--green);
	}

	.units__showing {
		font-size: var(--text-ui);
		color: var(--muted);
	}

	.units__sortctl {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
	}

	.units__sortctl-label {
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.units__select {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.units__select select {
		appearance: none;
		border: 0;
		border-bottom: 1px solid var(--border);
		background: none;
		padding: 0.3rem 1.4rem 0.3rem 0;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--green);
		cursor: pointer;
		transition: border-color var(--duration-hover) var(--ease);
	}

	.units__select select:hover,
	.units__select select:focus-visible {
		border-bottom-color: var(--green);
	}

	.units__select select:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 3px;
	}

	.units__select-caret {
		position: absolute;
		right: 0.2rem;
		font-size: 0.7rem;
		color: var(--green);
		pointer-events: none;
	}

	/* ---- Desktop table ---------------------------------------------------- */
	.units__desktop {
		display: none;
	}

	.utable {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-ui);
	}

	.utable thead th {
		text-align: left;
		padding: var(--space-sm) var(--space-md) var(--space-xs) 0;
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.utable tbody th,
	.utable tbody td {
		padding: var(--space-sm) var(--space-md) var(--space-sm) 0;
		border-bottom: 1px solid var(--border);
		text-align: left;
		font-weight: 400;
		color: var(--charcoal);
		vertical-align: middle;
	}

	.utable tbody td.utable__num {
		white-space: nowrap;
	}

	.utable__unit {
		font-family: var(--serif);
		font-size: 1.05rem;
		color: var(--green);
	}

	.utable__unitlink {
		color: var(--green);
		text-decoration: none;
		border-bottom: 1px solid var(--border);
		transition: border-color var(--duration-hover) var(--ease);
	}

	.utable__unitlink:hover,
	.utable__unitlink:focus-visible {
		border-bottom-color: var(--green);
	}

	.utable__action {
		text-align: right;
		white-space: nowrap;
	}

	.utable__row--reserved th,
	.utable__row--reserved td {
		color: var(--muted);
	}

	.units__view {
		color: var(--green);
		text-decoration: none;
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		font-size: var(--text-small);
		transition: color var(--duration-hover) var(--ease);
		white-space: nowrap;
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

	.units__statustag {
		font-size: var(--text-small);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--muted);
	}

	/* ---- Mobile cards ----------------------------------------------------- */
	.ucards {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.ucard {
		border-bottom: 1px solid var(--border);
	}

	.ucard__head {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.3rem 0.9rem;
		width: 100%;
		padding: var(--space-sm) 2.75rem var(--space-sm) 0;
		border: 0;
		background: none;
		text-align: left;
		cursor: pointer;
		font-family: var(--sans);
	}

	.ucard__head:focus-visible {
		outline: 2px solid var(--green);
		outline-offset: 2px;
	}

	.ucard__title {
		font-family: var(--serif);
		font-size: 1.2rem;
		color: var(--green);
		line-height: 1.25;
	}

	.ucard__type {
		font-size: 1.05rem;
		color: var(--charcoal);
	}

	/* Specs + price ride the right edge, so prices line up down the list. */
	.ucard__rowmeta {
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		margin-left: auto;
	}

	.ucard__specs {
		font-size: var(--text-ui);
		color: var(--muted);
		white-space: nowrap;
	}

	.ucard__price {
		font-size: var(--text-body);
		font-weight: 500;
		color: var(--green);
		white-space: nowrap;
	}

	.ucard__status {
		font-size: var(--text-small);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--muted);
		white-space: nowrap;
	}

	.ucard__toggle {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid var(--border);
		font-size: 1.1rem;
		line-height: 1;
		color: var(--green);
	}

	.ucard--reserved .ucard__title,
	.ucard--reserved .ucard__specs {
		color: var(--muted);
	}

	.ucard__panel {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--duration-lift) var(--ease);
	}

	.ucard__panel--open {
		grid-template-rows: 1fr;
	}

	.ucard__panel-inner {
		overflow: hidden;
		min-height: 0;
	}

	.ucard__facts {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem var(--space-md);
		padding: 0.25rem 0 var(--space-sm);
	}

	.ucard__facts div {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.ucard__facts dt {
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.ucard__facts dd {
		font-size: var(--text-ui);
		color: var(--charcoal);
	}

	.ucard__view {
		display: inline-block;
		margin: 0 0 var(--space-md);
		color: var(--green);
		font-weight: 500;
		font-size: var(--text-ui);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		border-bottom: 1px solid var(--gold);
		padding-bottom: 0.15rem;
	}

	.ucard__view:hover,
	.ucard__view:focus-visible {
		color: var(--gold);
	}

	/* ---- Pagination ------------------------------------------------------- */
	.upager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		margin-top: var(--space-lg);
	}

	.upager__list {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		list-style: none;
	}

	.upager__page,
	.upager__step {
		display: grid;
		place-items: center;
		min-width: 2.25rem;
		height: 2.25rem;
		padding: 0 0.5rem;
		border: 1px solid transparent;
		background: none;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--green);
		cursor: pointer;
		transition:
			border-color var(--duration-hover) var(--ease),
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.upager__page:hover,
	.upager__step:not(:disabled):hover,
	.upager__page:focus-visible,
	.upager__step:focus-visible {
		border-color: var(--green);
	}

	.upager__page--active {
		background: var(--green);
		border-color: var(--green);
		color: var(--on-green);
	}

	.upager__step:disabled {
		color: var(--border);
		cursor: default;
	}

	.upager__gap {
		padding: 0 0.25rem;
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

	/* ---- Responsive switch ------------------------------------------------ */
	@media (min-width: 721px) {
		.units__desktop {
			display: block;
		}

		.ucards {
			display: none;
		}
	}

	/* Mobile: the type filters become one scrollable row of compact text pills
	   (no photo, no counts) — just the type name, so they all sit on a single line. */
	/* The development page is a column-flex at these widths, and content-wrap's
	   auto inline margins cancel the flex stretch — so the section shrink-wraps its
	   content and bleeds off-screen. Pin it to the viewport width instead. */
	@media (max-width: 760px) {
		.units {
			width: 100%;
		}
	}

	@media (max-width: 720px) {
		.units,
		.ucards,
		.ucard {
			min-width: 0;
		}

		/* Type filters: compact photo tiles that share one row — image with a small
		   label beneath it, count/price dropped to keep them narrow. */
		.units__filters {
			flex-wrap: nowrap;
			gap: 0.5rem;
		}

		.tfilter {
			flex: 1 1 0;
			min-width: 0;
			width: auto;
		}

		.tfilter__meta {
			display: none;
		}

		.units__filters--photo .tfilter__body {
			padding: 0.4rem 0.35rem 0.5rem;
			align-items: center;
			text-align: center;
		}

		.tfilter__label {
			font-size: var(--text-small);
			line-height: 1.2;
		}

		/* Card rows: the title absorbs the slack so specs + price never clip. */
		.ucard__title {
			flex: 1 1 auto;
			min-width: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ucard__panel {
			transition: none;
		}

		.tfilter__media img,
		.units__view span {
			transition: none;
		}
	}
</style>
