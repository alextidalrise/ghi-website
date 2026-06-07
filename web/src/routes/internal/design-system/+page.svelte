<script lang="ts">
	import ListingGrid from '$lib/components/listing/ListingGrid.svelte';

	let { data } = $props();

	const colors = [
		{
			name: 'Deep Golf Green',
			token: '--green',
			value: 'var(--green)',
			usage: 'Primary typography, structural borders, dark surfaces, and primary actions.'
		},
		{
			name: 'On Green',
			token: '--on-green',
			value: 'var(--on-green)',
			usage: 'Light ink for text and icons on green surfaces. Not a page or panel surface.'
		},
		{
			name: 'Sand Gold',
			token: '--gold',
			value: 'var(--gold)',
			usage: 'Accent only: overlines, hover states, and moments that earn emphasis.'
		},
		{
			name: 'Charcoal',
			token: '--charcoal',
			value: 'var(--charcoal)',
			usage: 'Body copy and secondary headings on light surfaces.'
		},
		{
			name: 'Stone Border',
			token: '--border',
			value: 'var(--border)',
			usage: 'One-pixel dividers, input lines, and quiet card definition.'
		},
		{
			name: 'Muted',
			token: '--muted',
			value: 'var(--muted)',
			usage: 'Supporting copy, descriptions, metadata, and subdued UI.'
		}
	];

	const typeSamples = [
		{
			label: 'Display',
			token: '--text-display',
			className: 'text-display',
			copy: 'Homes beside the fairway'
		},
		{
			label: 'Heading 2',
			token: '--text-h2',
			className: 'text-h2',
			copy: 'Curated homes on premier golf courses'
		},
		{
			label: 'Heading 3',
			token: '--text-h3',
			className: 'text-h3',
			copy: 'Sotogrande, Quinta do Lago, Marbella'
		},
		{
			label: 'Body',
			token: '--text-body',
			className: 'text-body',
			copy: 'The system favours calm authority, generous spacing, and restrained detail over search-engine noise.'
		}
	];

	const spacing = [
		['XS', '--space-xs', '8px', 'Tight pairings'],
		['SM', '--space-sm', '16px', 'Label to field'],
		['MD', '--space-md', '24px', 'Component padding'],
		['LG', '--space-lg', '32px', 'Local groups'],
		['XL', '--space-xl', '48px', 'Section groups'],
		['2XL', '--space-2xl', '80px', 'Major pauses']
	];
</script>

<svelte:head>
	<title>Design System | Golf Homes International</title>
	<meta name="robots" content="noindex,nofollow,noarchive" />
</svelte:head>

<article class="design-system">
	<header class="ds-hero on-dark">
		<div class="ds-hero__eyebrow">Internal Reference</div>
		<h1>Golf Homes International<br /><em>Design System</em></h1>
		<p>
			A working reference for the live website tokens, components, and editorial rhythm. This page
			is available for local and protected preview builds only.
		</p>
	</header>

	<nav class="ds-jump" aria-label="Design system sections">
		<a href="#color">Color</a>
		<a href="#type">Type</a>
		<a href="#spacing">Spacing</a>
		<a href="#buttons">Buttons</a>
		<a href="#cards">Cards</a>
		<a href="#forms">Forms</a>
	</nav>

	<section class="ds-section" id="color">
		<div class="ds-section__head">
			<span>01</span>
			<h2>Color Palette</h2>
			<p>
				Restrained by default. Green carries authority, linen softens the page, and gold appears
				only when attention has been earned.
			</p>
		</div>

		<div class="color-grid">
			{#each colors as color (color.token)}
				<article class="color-card">
					<span class="color-card__swatch" style={`--swatch: ${color.value}`}></span>
					<div>
						<h3>{color.name}</h3>
						<p class="color-card__token">{color.token}</p>
						<p>{color.usage}</p>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="ds-section" id="type">
		<div class="ds-section__head">
			<span>02</span>
			<h2>Typography</h2>
			<p>
				Playfair Display sets the editorial tone. Libre Franklin keeps browsing, filtering, and
				enquiry flows legible.
			</p>
		</div>

		<div class="type-stack">
			{#each typeSamples as sample (sample.token)}
				<article class="type-row">
					<div>
						<p class="type-row__label">{sample.label}</p>
						<p class="type-row__token">{sample.token}</p>
					</div>
					<p class={sample.className}>{sample.copy}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="ds-section" id="spacing">
		<div class="ds-section__head">
			<span>03</span>
			<h2>Grid And Spacing</h2>
			<p>
				The brand feels considered because space is allowed to do real work. Keep local groups
				tight and section changes generous.
			</p>
		</div>

		<div class="spacing-list">
			{#each spacing as item (item[1])}
				<div class="spacing-row">
					<span>{item[0]}</span>
					<strong>{item[1]}</strong>
					<em>{item[2]}</em>
					<p>{item[3]}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="ds-section" id="buttons">
		<div class="ds-section__head">
			<span>04</span>
			<h2>Buttons And Links</h2>
			<p>
				Square corners and one-pixel borders are deliberate. Choose the button by surface and
				hierarchy, not by decoration.
			</p>
		</div>

		<div class="button-surface">
			<a class="button button--primary" href="#forms">Primary Action</a>
			<a class="button button--outline" href="#cards">Outline Action</a>
			<a class="button button--gold" href="#type">Gold Action</a>
			<a class="text-link" href="#color">Text link</a>
		</div>
	</section>

	<section class="ds-feature on-dark">
		<div>
			<p class="text-overline">Hero Composition</p>
			<h2>Your life on<br /><em>the fairway.</em></h2>
			<p>
				Hero surfaces pair quiet copy with one decisive image. Text sits with enough room to
				breathe; photography carries the lifestyle promise.
			</p>
			<a class="button button--on-dark" href="#cards">View Card System</a>
		</div>
		<img
			src="/design-system/assets/andalucia-golf-villa.png"
			alt="Mediterranean golf villa beside a green fairway"
			width="960"
			height="540"
		/>
	</section>

	<section class="ds-section" id="cards">
		<div class="ds-section__head">
			<span>05</span>
			<h2>Property Cards</h2>
			<p>
				Photography first, chrome second. Cards use borders rather than shadows, tabular numbers,
				and small metadata that does not compete with the listing title.
			</p>
		</div>

		<div class="property-grid">
			<article class="property-card">
				<img
					src="/design-system/assets/andalucia-golf-villa.png"
					alt="Andalucian golf villa with a pool and fairway view"
					width="720"
					height="480"
				/>
				<div class="property-card__body">
					<p class="property-card__meta">Sotogrande, Spain</p>
					<h3>Frontline Golf Villa</h3>
					<p>
						A calm, private address with open fairway views, shaded terraces, and direct access to
						the club.
					</p>
					<div class="property-card__footer">
						<span>EUR 2,950,000</span>
						<a href="#forms">Enquire</a>
					</div>
				</div>
			</article>

			<article class="property-card">
				<div class="property-card__body">
					<p class="property-card__meta">Quinta do Lago, Portugal</p>
					<h3>Low-Built Fairway Home</h3>
					<p>
						When a price is withheld, the card states "Price on request" and holds the same
						editorial grid as every other listing.
					</p>
					<div class="property-card__footer">
						<span>Price on request</span>
						<a href="#forms">Request details</a>
					</div>
				</div>
			</article>
		</div>

		<div class="ds-subsection">
			<h3 class="ds-subsection__title">Live component</h3>
			<p class="ds-subsection__copy">
				Wired <code>ListingGrid</code> and <code>PropertyCard</code> using verification fixtures and
				public transforms.
			</p>
			<ListingGrid cards={data.demoCards.map((card) => ({ kind: 'property' as const, card }))} />
		</div>
	</section>

	<section class="ds-section" id="forms">
		<div class="ds-section__head">
			<span>06</span>
			<h2>Form Elements</h2>
			<p>
				Inputs should feel like a considered questionnaire. Bottom borders keep the surface quiet;
				inline validation keeps correction close to the field.
			</p>
		</div>

		<form class="form-demo" aria-label="Design system form example">
			<label>
				<span>Full name</span>
				<input type="text" placeholder="Jane Doe" />
			</label>
			<label>
				<span>Email address</span>
				<input type="email" placeholder="jane@example.com" />
			</label>
			<label>
				<span>Preferred region</span>
				<select>
					<option>Andalucia</option>
					<option>Algarve</option>
					<option>Costa del Sol</option>
				</select>
			</label>
			<label>
				<span>Budget range</span>
				<input class="is-error" type="text" aria-invalid="true" aria-describedby="budget-error" />
				<small id="budget-error">Please enter a guide budget before submitting.</small>
			</label>
			<button class="button button--primary" type="button">Send Enquiry</button>
		</form>
	</section>
</article>

<style>
	.design-system {
		background: var(--white);
		color: var(--charcoal);
	}

	.ds-hero {
		min-height: calc(100dvh - var(--nav-height));
		display: grid;
		align-content: end;
		padding: clamp(5rem, 10vw, 9rem) var(--content-padding);
		background:
			linear-gradient(to right, oklch(0.22 0.03 165 / 0.92), oklch(0.22 0.03 165 / 0.72)),
			url('/design-system/assets/andalucia-golf-villa.png') center / cover;
	}

	.ds-hero__eyebrow,
	.ds-section__head span,
	.type-row__label,
	.property-card__meta,
	label span {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--gold);
	}

	.ds-hero h1,
	.ds-feature h2 {
		color: var(--on-green);
		margin-top: var(--space-md);
	}

	.ds-hero h1 em,
	.ds-feature h2 em {
		font-style: italic;
		font-weight: 600;
	}

	.ds-hero p,
	.ds-feature p {
		max-width: 42rem;
		margin-top: var(--space-lg);
		color: oklch(0.87 0.015 85);
		font-family: var(--serif);
		font-size: var(--text-h4);
		line-height: 1.65;
	}

	.ds-jump {
		position: sticky;
		top: var(--nav-height);
		z-index: 20;
		display: flex;
		justify-content: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--content-padding);
		background: oklch(0.99 0.006 85 / 0.94);
		border-bottom: 1px solid var(--border);
		backdrop-filter: blur(16px);
	}

	.ds-jump a {
		padding: 0.45rem 0.75rem;
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-small);
		font-weight: 400;
		letter-spacing: var(--tracking-wide);
		text-decoration: none;
		text-transform: uppercase;
		transition:
			color var(--duration-hover) var(--ease),
			background var(--duration-hover) var(--ease);
	}

	.ds-jump a:hover,
	.ds-jump a:focus-visible {
		background: var(--green);
		color: var(--white);
	}

	.ds-section {
		max-width: var(--content-max);
		margin-inline: auto;
		padding: var(--section-gap) var(--content-padding) 0;
	}

	.ds-section__head {
		display: grid;
		grid-template-columns: minmax(3rem, 0.18fr) minmax(0, 0.82fr);
		gap: var(--space-md) var(--space-xl);
		margin-bottom: var(--space-xl);
	}

	.ds-section__head h2 {
		margin: 0;
	}

	.ds-section__head p {
		grid-column: 2;
		max-width: 45rem;
		color: var(--muted);
	}

	.color-grid,
	.property-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
		gap: var(--space-md);
	}

	.ds-subsection {
		margin-top: var(--space-2xl);
		padding-top: var(--space-xl);
		border-top: 1px solid var(--border);
	}

	.ds-subsection__title {
		margin: 0 0 var(--space-sm);
		font-family: var(--serif);
		font-size: var(--text-h3);
		color: var(--green);
	}

	.ds-subsection__copy {
		max-width: 42rem;
		margin-bottom: var(--space-lg);
		color: var(--muted);
	}

	.ds-subsection__copy code {
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--green);
	}

	.color-card {
		display: grid;
		grid-template-columns: 5rem 1fr;
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid var(--border);
		background: var(--white);
	}

	.color-card__swatch {
		min-height: 5rem;
		background: var(--swatch);
		border: 1px solid var(--border);
	}

	.color-card h3,
	.property-card h3 {
		margin-bottom: var(--space-xs);
		font-size: var(--text-h4);
	}

	.color-card p,
	.property-card p {
		color: var(--muted);
	}

	.color-card__token,
	.type-row__token {
		margin-bottom: var(--space-sm);
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-small);
		font-weight: 400;
	}

	.type-stack {
		border-top: 1px solid var(--border);
	}

	.type-row {
		display: grid;
		grid-template-columns: minmax(10rem, 0.28fr) 1fr;
		gap: var(--space-lg);
		align-items: baseline;
		padding: var(--space-lg) 0;
		border-bottom: 1px solid var(--border);
	}

	.type-row > p {
		max-width: 46rem;
	}

	.spacing-list {
		border: 1px solid var(--border);
	}

	.spacing-row {
		display: grid;
		grid-template-columns: 4rem minmax(8rem, 1fr) 5rem minmax(10rem, 1fr);
		gap: var(--space-md);
		align-items: center;
		padding: var(--space-md);
		border-bottom: 1px solid var(--border);
	}

	.spacing-row:last-child {
		border-bottom: 0;
	}

	.spacing-row span,
	.spacing-row strong,
	.spacing-row em {
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-style: normal;
		font-weight: 400;
	}

	.spacing-row span {
		color: var(--gold);
		letter-spacing: var(--tracking-wide);
	}

	.spacing-row p {
		color: var(--muted);
	}

	.button-surface {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xl);
		background: var(--white);
		border: 1px solid var(--border);
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 3rem;
		padding: 0.875rem 2rem;
		border: 1px solid var(--green);
		font-family: var(--sans);
		font-size: 0.85rem;
		font-weight: 400;
		letter-spacing: var(--tracking-wide);
		text-decoration: none;
		text-transform: uppercase;
		transition:
			background var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.button--primary {
		background: var(--green);
		color: var(--white);
	}

	.button--primary:hover,
	.button--primary:focus-visible {
		background: var(--charcoal);
		border-color: var(--charcoal);
	}

	.button--outline {
		background: transparent;
		color: var(--green);
	}

	.button--outline:hover,
	.button--outline:focus-visible {
		background: var(--green);
		color: var(--white);
	}

	.button--gold {
		background: var(--gold);
		border-color: var(--gold);
		color: var(--green);
	}

	.button--gold:hover,
	.button--gold:focus-visible {
		background: var(--green);
		border-color: var(--green);
		color: var(--white);
	}

	.button--on-dark {
		border-color: oklch(0.88 0.02 85 / 0.45);
		color: var(--on-green);
	}

	.button--on-dark:hover,
	.button--on-dark:focus-visible {
		background: var(--on-green);
		color: var(--green);
	}

	.text-link {
		color: var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 400;
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition:
			border-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.text-link:hover,
	.text-link:focus-visible {
		color: var(--gold);
		border-color: currentColor;
	}

	.ds-feature {
		display: grid;
		grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
		gap: var(--space-2xl);
		align-items: center;
		margin-top: var(--section-gap);
		padding: var(--space-2xl) var(--content-padding);
		background: var(--green-deep);
	}

	.ds-feature img {
		width: 100%;
		aspect-ratio: 16 / 10;
		object-fit: cover;
	}

	.ds-feature .button {
		margin-top: var(--space-lg);
	}

	.property-card {
		border: 1px solid var(--border);
		background: var(--white);
	}

	.property-card img {
		width: 100%;
		aspect-ratio: 3 / 2;
		object-fit: cover;
	}

	.property-card__body {
		padding: var(--space-lg);
	}

	.property-card__meta {
		margin-bottom: var(--space-sm);
		color: var(--gold);
	}

	.property-card__footer {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		margin-top: var(--space-lg);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 400;
		font-feature-settings: 'tnum';
	}

	.property-card__footer a {
		color: var(--green);
		text-decoration: none;
		border-bottom: 1px solid transparent;
	}

	.property-card__footer a:hover,
	.property-card__footer a:focus-visible {
		border-color: currentColor;
	}

	.form-demo {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-lg) var(--space-xl);
		padding: var(--space-xl);
		border: 1px solid var(--border);
		background: var(--white);
	}

	label {
		display: grid;
		gap: var(--space-xs);
	}

	input,
	select {
		width: 100%;
		padding: 0.875rem 0;
		border: 0;
		border-bottom: 1px solid var(--border);
		border-radius: 0;
		background: transparent;
		color: var(--charcoal);
		font: inherit;
	}

	input:focus,
	select:focus {
		outline: 0;
		border-color: var(--green);
	}

	input.is-error {
		border-color: oklch(0.52 0.11 30);
	}

	small {
		color: oklch(0.46 0.12 30);
		font-family: var(--sans);
		font-size: var(--text-small);
	}

	.form-demo .button {
		align-self: end;
		justify-self: start;
	}

	@media (max-width: 800px) {
		.ds-jump {
			justify-content: flex-start;
			overflow-x: auto;
		}

		.ds-section__head,
		.type-row,
		.spacing-row,
		.ds-feature,
		.form-demo {
			grid-template-columns: 1fr;
		}

		.ds-section__head p {
			grid-column: auto;
		}

		.ds-feature {
			gap: var(--space-xl);
		}
	}
</style>
