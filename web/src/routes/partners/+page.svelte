<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import PartnerCategory from '$lib/components/partners/PartnerCategory.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	const heroMarkers = ['Independently verified', 'No referral pressure', 'Your choice'];
	const attributes = ['Independent', 'Vetted', 'English-speaking', 'No hidden incentives'];

	const related = [
		{ href: '/spain', title: 'Buying in Spain', desc: 'Areas, golf and the buying process' },
		{ href: '/portugal', title: 'Buying in Portugal', desc: 'The Portugal-specific route' },
		{ href: '/contact', title: 'Contact us', desc: 'General questions and enquiries' }
	];
</script>

<svelte:head>
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<link rel="canonical" href={data.seo.canonicalUrl} />
	{#if data.seo.noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}

	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.seo.canonicalUrl} />
	<meta property="og:title" content={data.seo.title} />
	<meta property="og:description" content={data.seo.description} />

	{@html jsonLdScriptHtml(data.breadcrumbJsonLd)}
</svelte:head>

<article class="partners-page">
	<Breadcrumbs items={data.breadcrumbs} hideCurrent />

	<!-- Hero: white editorial. The single green band is reserved for the closing CTA. -->
	<header class="hero content-wrap">
		<p class="text-overline">Vetted only</p>
		<h1 class="hero__title">Our Trusted Partners</h1>
		<p class="hero__lead">
			Independent legal, tax, financial and property professionals across Spain and Portugal, each
			vetted to protect buyers at every stage of the purchase.
		</p>
		<ul class="hero__markers">
			{#each heroMarkers as marker (marker)}
				<li>{marker}</li>
			{/each}
		</ul>
	</header>

	<!-- Why we work with partners -->
	<section class="why content-wrap" aria-labelledby="why-heading">
		<h2 id="why-heading" class="why__heading">Why we work with partners</h2>
		<p class="why__body">
			Buying abroad means trusting people you have never met with decisions that matter. We keep a
			deliberately small network of independent professionals, each chosen for their record with
			international buyers, not for what they pay us. We hold no referral fees that could sway our
			advice. When you are ready, we make a personal introduction. Who you work with, and whether to
			proceed, stays entirely your decision.
		</p>
		<ul class="why__attrs">
			{#each attributes as attribute (attribute)}
				<li>{attribute}</li>
			{/each}
		</ul>
	</section>

	<!-- Partner directory -->
	<div class="directory content-wrap">
		{#each data.categories as category (category.id)}
			<PartnerCategory {category} />
		{/each}
	</div>

	<!-- Become a partner: the page's one green band -->
	<section class="become on-dark" aria-labelledby="become-heading">
		<div class="become__inner content-wrap">
			<div class="become__copy">
				<p class="text-overline become__overline">Become a partner</p>
				<h2 id="become-heading" class="become__heading">Are you a professional in this space?</h2>
				<p class="become__body">
					We work with a small number of vetted legal, tax, financial and property specialists. If
					you would like to be considered, we would be glad to hear from you.
				</p>
			</div>
			<div class="become__action">
				<a class="become__button" href="/contact?enquiry=partner">Apply to partner with us</a>
				<p class="become__support">
					Inbound partnership enquiries only.<br />
					Average response within five working days.
				</p>
			</div>
		</div>
	</section>

	<!-- Related -->
	<section class="related content-wrap" aria-labelledby="related-heading">
		<h2 id="related-heading" class="related__heading">Related</h2>
		<ul class="related__grid">
			{#each related as item (item.href)}
				<li>
					<a class="related__card" href={item.href}>
						<h3 class="related__title">{item.title}</h3>
						<p class="related__desc">{item.desc}</p>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</article>

<style>
	.partners-page {
		padding-bottom: var(--space-2xl);
	}

	/* Hero — white editorial. */
	.hero {
		padding-top: var(--space-xl);
		padding-bottom: var(--section-gap);
	}

	.hero__title {
		margin-top: var(--space-sm);
		margin-bottom: var(--space-md);
		max-width: 16ch;
	}

	.hero__lead {
		font-family: var(--sans);
		font-weight: 300;
		font-size: 1.125rem;
		line-height: 1.7;
		color: var(--charcoal);
		max-width: 52ch;
	}

	.hero__markers {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin-top: var(--space-lg);
		list-style: none;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--muted);
	}

	.hero__markers li {
		display: inline-flex;
		align-items: center;
	}

	/* Gold dot between markers, the brand's metadata separator. */
	.hero__markers li:not(:last-child)::after {
		content: '';
		width: 3px;
		height: 3px;
		margin-left: 1.25rem;
		background: var(--gold);
	}

	/* Why section. */
	.why {
		display: grid;
		gap: var(--space-md);
		padding-bottom: var(--section-gap);
	}

	.why__body {
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.8;
		color: var(--charcoal);
		max-width: 68ch;
	}

	.why__attrs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		margin-top: var(--space-sm);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border);
		list-style: none;
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--gold);
	}

	.why__attrs li {
		display: inline-flex;
		align-items: center;
	}

	.why__attrs li:not(:last-child)::after {
		content: '';
		width: 3px;
		height: 3px;
		margin-left: 1.5rem;
		background: var(--gold);
	}

	/* Directory — stacked categories separated by whitespace. */
	.directory {
		display: grid;
		gap: var(--section-gap);
		padding-bottom: var(--section-gap);
	}

	/* Become a partner — full-bleed green band, the page's single green moment. */
	.become {
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		padding-block: clamp(3rem, 4.5vw, 4.25rem);
		background:
			radial-gradient(120% 90% at 14% -20%, oklch(0.37 0.05 165) 0%, transparent 52%),
			linear-gradient(180deg, oklch(0.31 0.035 165) 0%, oklch(0.24 0.03 165) 100%);
		border-block: 1px solid oklch(0.82 0.05 85 / 0.28);
	}

	.become__inner {
		display: grid;
		gap: var(--space-xl);
		align-items: end;
	}

	.become__overline {
		color: var(--gold);
	}

	.become__heading {
		margin-top: var(--space-md);
		color: var(--on-green);
		max-width: 18ch;
	}

	.become__body {
		margin-top: var(--space-md);
		font-family: var(--sans);
		font-size: var(--text-body);
		color: var(--on-green);
		max-width: 48ch;
	}

	.become__action {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-md);
	}

	.become__button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.9rem 1.85rem;
		background: var(--gold);
		color: var(--green);
		border: 1px solid var(--gold);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.become__button:hover,
	.become__button:focus-visible {
		background: transparent;
		color: var(--on-green);
		border-color: rgba(245, 241, 232, 0.65);
	}

	.become__button:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.become__support {
		font-family: var(--sans);
		font-size: var(--text-small);
		line-height: 1.6;
		color: rgba(245, 241, 232, 0.7);
	}

	@media (min-width: 760px) {
		.become__inner {
			grid-template-columns: 1fr auto;
			gap: var(--space-2xl);
		}
	}

	/* Related. */
	.related {
		padding-top: var(--section-gap);
	}

	.related__heading {
		margin-bottom: var(--space-lg);
	}

	.related__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
		gap: var(--space-md);
		list-style: none;
	}

	.related__card {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		height: 100%;
		padding: var(--space-lg);
		border: 1px solid var(--border);
		text-decoration: none;
		transition: border-color var(--duration-hover) var(--ease);
	}

	.related__card:hover,
	.related__card:focus-visible {
		border-color: var(--gold);
	}

	.related__card:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.related__title {
		color: var(--green);
	}

	.related__desc {
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--muted);
	}

	/* One quiet hero entrance; the rest of the page relies on hover feedback rather
	   than a uniform per-section reveal. */
	@media (prefers-reduced-motion: no-preference) {
		.hero > * {
			opacity: 0;
			transform: translateY(14px);
			animation: hero-rise 0.7s var(--ease) forwards;
		}

		.hero > :nth-child(1) {
			animation-delay: 0.05s;
		}
		.hero > :nth-child(2) {
			animation-delay: 0.12s;
		}
		.hero > :nth-child(3) {
			animation-delay: 0.19s;
		}
		.hero > :nth-child(4) {
			animation-delay: 0.26s;
		}

		@keyframes hero-rise {
			to {
				opacity: 1;
				transform: none;
			}
		}
	}
</style>
