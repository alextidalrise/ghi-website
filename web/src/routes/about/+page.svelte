<script lang="ts">
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';
	import { jsonLdScriptHtml } from '$lib/listing/breadcrumbs';

	let { data } = $props();

	// The trusted network, surfaced as outline chips. The Partners page holds the
	// full directory; this is the at-a-glance version that links through to it.
	const network = ['Lawyers', 'Tax advisers', 'Mortgage brokers', 'On-the-ground specialists'];

	// Destinations strip — real project location imagery (3:2). These are the places
	// named in the copy; "and beyond" is carried in the section intro, not a fourth tile.
	// Images come from each location's Sanity heroImage (auto AVIF/WebP + srcset) via the
	// loader, so the strip uses the same optimized pipeline as the rest of the site.
	const destinations = $derived(data.destinations);

	// Team. Photo URLs are intentionally null until the real headshots land — the
	// markup renders a sized monogram frame in their place, never a broken <img>.
	// The `bio` lines are PLACEHOLDER copy in brand voice, written so the section
	// reads complete in review; replace with the real one-liners before launch.
	// The `role` lines are the confirmed copy supplied by the client.
	const team = [
		{
			name: 'James Pryor',
			initials: 'JP',
			photo: null as string | null,
			lead: true,
			// PLACEHOLDER bio — replace with James's real background line.
			bio: 'Years spent living and playing across the Costa del Sol, with the local knowledge that only comes from being on the course and in the communities week after week.',
			role: 'James leads the day to day and is the person you will speak to when you enquire.'
		},
		{
			name: 'Jack Ballantine',
			initials: 'JB',
			photo: null as string | null,
			lead: false,
			// PLACEHOLDER bio — replace with Jack's real background line.
			bio: 'A career in international real estate, from city new-builds to resort developments across southern Europe, brought to bear on where the market is heading.',
			role: 'Jack focuses on strategy and growth.'
		},
		{
			name: 'Alex Chapman',
			initials: 'AC',
			photo: null as string | null,
			lead: false,
			// PLACEHOLDER bio — replace with Alex's real background line.
			bio: 'Builds the platform end to end, from the listings you browse to the systems that keep the portfolio curated and honest.',
			role: 'Alex built and runs the platform and technology behind the business.'
		}
	];

	// WhatsApp stays a styled-but-inert placeholder until the GHI number is wired,
	// matching the EnquiryRail convention (see EnquiryRail.svelte whatsAppHref).
	const whatsAppHref: string | null = null;

	function launchWhatsApp() {
		if (whatsAppHref) window.open(whatsAppHref, '_blank', 'noopener');
	}
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

<article class="about-page">
	<Breadcrumbs items={data.breadcrumbs} hideCurrent />

	<!-- Hero — white editorial. The page's single green band is reserved for the close. -->
	<header class="hero content-wrap">
		<h1 class="hero__title">Built around people, not just listings</h1>
		<p class="hero__lead">
			Specialists in golf property across Spain and Portugal, here to make buying abroad simpler,
			safer and a lot less daunting.
		</p>
	</header>

	<!-- Our story — long-form prose, narrowed measure, with one italic lift. -->
	<section class="story content-wrap" aria-labelledby="story-heading">
		<h2 id="story-heading" class="story__heading">Our story</h2>
		<div class="story__body">
			<p>
				Golf Homes International started with two things we care about more than most: golf and
				property. Between us we have spent around six years living in Spain and Portugal, playing the
				courses and getting to know the communities.
			</p>
			<p>
				Buying a home abroad is an emotional decision as much as a financial one, and for most people
				it is something they do only once or twice in a lifetime. What we kept seeing was how little
				care goes into the parts that matter most. Having the right professional beside you at every
				stage is too often left to chance.
			</p>
			<blockquote class="story__quote">
				So we built something different: not just a place to find golf property, but a way of buying
				that puts the right people around you and supports your decision, rather than pushing a sale.
			</blockquote>
		</div>
	</section>

	<!-- The right people — tier 2: hairline-ruled band, network chips, link to Partners. -->
	<section class="people content-wrap" aria-labelledby="people-heading">
		<div class="people__intro">
			<h2 id="people-heading" class="people__heading">The right people around you</h2>
			<p class="people__body">
				We work with a trusted group of professionals across the whole buying process, and people on
				the ground in Spain and Portugal. You are free to use your own; but if you would like, we can
				introduce you to people we know and trust. The right person at the right stage takes a huge
				amount of stress out of buying abroad, and in our experience that is exactly the part most
				people overlook.
			</p>
		</div>
		<ul class="people__chips">
			{#each network as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
		<a class="people__link" href="/partners">
			<span>See our trusted partners</span>
			<svg viewBox="0 0 26 12" fill="none" aria-hidden="true">
				<path d="M0 6h23M19 1.5 24 6l-5 4.5" stroke="currentColor" stroke-width="1.5" />
			</svg>
		</a>
	</section>

	<!-- Why golf, and why these places — tier 2: full-bleed white bracketed by hairline
	     rules. The section is itself photographic, so it stays off the green/photo tiers. -->
	<section class="places" aria-labelledby="places-heading">
		<div class="places__inner content-wrap">
			<div class="places__intro">
				<h2 id="places-heading" class="places__heading">Why golf, and why these places</h2>
				<p class="places__body">
					Golf is at the heart of what we do. Every location we cover is a genuine golfing
					destination: Marbella, Sotogrande, the Algarve and beyond, places where world-class
					courses, the climate and the lifestyle have built established, sought-after property
					markets around the game. If golf is part of why you are buying abroad, these are the
					places that deliver it.
				</p>
			</div>
			<ul class="places__grid">
				{#each destinations as place (place.name)}
					<li class="place">
						<div class="place__frame">
							{#if place.image}
								<img
									src={place.image}
									srcset={place.srcset || undefined}
									sizes="(max-width: 48rem) 100vw, 30vw"
									alt={place.alt}
									loading="lazy"
									decoding="async"
									width="900"
									height="600"
								/>
							{/if}
						</div>
						<div class="place__label">
							<h3 class="place__name">{place.name}</h3>
							<p class="place__region">{place.region}</p>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<!-- Who we are — framing line, then the team masthead (editorial rows, not a card grid). -->
	<section class="team content-wrap" aria-labelledby="team-heading">
		<div class="team__intro">
			<h2 id="team-heading" class="team__heading">Who we are</h2>
			<p class="team__body">
				We are a UK business, and most of the people we help are buying from the UK, though not all.
				Wherever you are coming from, the aim is the same: to make buying golf property in Spain and
				Portugal simpler, safer and a lot less daunting.
			</p>
		</div>

		<ul class="team__list">
			{#each team as member (member.name)}
				<li class="member" class:member--lead={member.lead}>
					<div class="member__portrait">
						{#if member.photo}
							<img src={member.photo} alt={`Portrait of ${member.name}`} loading="lazy" />
						{:else}
							<!-- Sized monogram frame until the real headshot lands. -->
							<span class="member__monogram" aria-hidden="true">{member.initials}</span>
						{/if}
					</div>
					<div class="member__text">
						{#if member.lead}
							<p class="member__flag text-overline">Your first point of contact</p>
						{/if}
						<h3 class="member__name">{member.name}</h3>
						<p class="member__bio">{member.bio}</p>
						<p class="member__role">{member.role}</p>
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<!-- Talk to us — the page's single green band. -->
	<section class="talk on-dark" aria-labelledby="talk-heading">
		<div class="talk__inner content-wrap">
			<div class="talk__copy">
				<h2 id="talk-heading" class="talk__heading">Talk to us</h2>
				<p class="talk__body">
					No pressure and no obligation. Whether you are ready to view or just starting to think
					about it, we are happy to help.
				</p>
			</div>
			<div class="talk__actions">
				<a class="talk__btn talk__btn--primary" href="/contact">Get in touch</a>
				<a class="talk__btn talk__btn--outline" href="/front-line-collection">Browse properties</a>
				<button type="button" class="talk__btn talk__btn--whatsapp" onclick={launchWhatsApp}>
					<svg viewBox="0 0 32 32" aria-hidden="true">
						<path
							d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.44 1.64 6.3L3 29l6.86-1.8A12.9 12.9 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-2.04 0-3.94-.58-5.55-1.58l-.4-.24-4.07 1.07 1.08-3.97-.26-.41A10.74 10.74 0 0 1 5.2 16C5.2 10.04 10.04 5.2 16 5.2S26.8 10.04 26.8 16 21.96 26.8 16 26.8z"
						/>
						<path
							d="M21.6 18.86c-.3-.16-1.78-.92-2.06-1.02-.28-.1-.48-.16-.68.15-.2.3-.78.96-.96 1.16-.18.2-.36.22-.66.07-.3-.15-1.27-.49-2.41-1.55-.89-.83-1.49-1.85-1.66-2.16-.18-.3-.02-.47.13-.62.14-.14.3-.36.46-.54.15-.18.2-.3.3-.51.1-.2.05-.38-.02-.54-.07-.15-.68-1.7-.93-2.32-.24-.6-.49-.52-.68-.53l-.58-.01c-.2 0-.53.08-.81.38-.28.3-1.06 1.06-1.06 2.58s1.09 3 1.24 3.2c.15.21 2.13 3.4 5.18 4.77.72.32 1.29.51 1.73.65.73.24 1.39.2 1.91.12.58-.09 1.78-.74 2.04-1.46.25-.71.25-1.32.18-1.45-.07-.13-.27-.21-.57-.36z"
						/>
					</svg>
					<span>WhatsApp</span>
				</button>
			</div>
		</div>
	</section>
</article>

<style>
	.about-page {
		/* The page closes on the full-bleed green "Talk to us" band, which meets the
		   green site footer directly; no trailing white gap between the two. */
		padding-bottom: 0;
	}

	/* ---- Hero ---------------------------------------------------------------- */
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
		max-width: 50ch;
	}

	/* ---- Our story ---------------------------------------------------------- */
	.story {
		padding-bottom: var(--section-gap);
	}

	.story__heading {
		margin-bottom: var(--space-lg);
	}

	.story__body {
		display: grid;
		gap: var(--space-md);
		max-width: 68ch;
	}

	.story__body p {
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.8;
		color: var(--charcoal);
	}

	/* The single typographic lift in the story — Playfair italic, no quote marks,
	   no side-stripe. An opening hairline plus a gold diamond mark it (gold as an
	   accent mark, never the rule colour); there is no closing rule, so it never
	   doubles up against the next section's full-bleed divider. Large italic Playfair
	   has tall ascenders and deep descenders, so the leading is generous. */
	.story__quote {
		margin-top: var(--space-md);
		padding-top: var(--space-lg);
		border-top: 1px solid var(--border);
		font-family: var(--serif);
		font-style: italic;
		font-weight: 400;
		font-size: clamp(1.375rem, 1rem + 1.5vw, 1.8125rem);
		line-height: 1.7;
		color: var(--green);
		text-wrap: pretty;
	}

	.story__quote::before {
		content: '';
		display: block;
		width: 7px;
		height: 7px;
		margin-bottom: var(--space-md);
		background: var(--gold);
		transform: rotate(45deg);
	}

	/* ---- The right people --------------------------------------------------- */
	.people {
		padding-block: var(--section-gap);
		border-top: 1px solid var(--border);
	}

	.people__heading {
		margin-bottom: var(--space-md);
	}

	.people__body {
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.8;
		color: var(--charcoal);
		max-width: 64ch;
	}

	.people__chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
		margin-top: var(--space-lg);
		list-style: none;
	}

	.people__chips li {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border);
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--green);
	}

	.people__link {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		margin-top: var(--space-lg);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 400;
		color: var(--green);
		text-decoration: none;
		transition: color var(--duration-hover) var(--ease);
	}

	.people__link svg {
		width: 1.4rem;
		height: auto;
		stroke: currentColor;
		transition: transform var(--duration-hover) var(--ease);
	}

	.people__link:hover,
	.people__link:focus-visible {
		color: var(--gold);
	}

	.people__link:hover svg,
	.people__link:focus-visible svg {
		transform: translateX(3px);
	}

	.people__link:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* ---- Why these places — full-bleed white, hairline-bracketed ------------- */
	.places {
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		padding-block: var(--section-gap);
		border-block: 1px solid var(--border);
	}

	.places__intro {
		max-width: 64ch;
		margin-bottom: var(--space-xl);
	}

	.places__heading {
		margin-bottom: var(--space-md);
	}

	.places__body {
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.8;
		color: var(--charcoal);
	}

	.places__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
		gap: var(--space-lg);
		list-style: none;
	}

	.place {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.place__frame {
		overflow: hidden;
		border: 1px solid var(--border);
		aspect-ratio: 3 / 2;
	}

	.place__frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--duration-image) var(--ease);
	}

	.place:hover .place__frame img {
		transform: scale(1.03);
	}

	.place__name {
		color: var(--green);
	}

	.place__region {
		margin-top: 0.25rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--muted);
	}

	/* ---- Who we are / team -------------------------------------------------- */
	.team {
		padding-top: var(--section-gap);
	}

	.team__intro {
		max-width: 64ch;
		margin-bottom: var(--space-2xl);
	}

	.team__heading {
		margin-bottom: var(--space-md);
	}

	.team__body {
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.8;
		color: var(--charcoal);
	}

	.team__list {
		list-style: none;
	}

	/* Editorial masthead rows, not a card grid: portrait + text, hairline-separated. */
	.member {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-md);
		padding-block: var(--space-xl);
		border-top: 1px solid var(--border);
	}

	.member:last-child {
		border-bottom: 1px solid var(--border);
	}

	.member__portrait {
		position: relative;
		width: 9rem;
		aspect-ratio: 4 / 5;
		overflow: hidden;
		border: 1px solid var(--border);
		background: var(--green);
	}

	.member__portrait img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--duration-image) var(--ease);
	}

	.member:hover .member__portrait img {
		transform: scale(1.03);
	}

	/* Monogram placeholder — on-brand, never a grey avatar or broken image. */
	.member__monogram {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--serif);
		font-size: 2.25rem;
		font-weight: 400;
		color: var(--on-green);
		letter-spacing: 0.02em;
	}

	.member__flag {
		margin-bottom: var(--space-sm);
		color: var(--gold);
	}

	.member__name {
		color: var(--green);
	}

	.member__bio {
		margin-top: var(--space-sm);
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.75;
		color: var(--charcoal);
		max-width: 60ch;
	}

	.member__role {
		margin-top: var(--space-sm);
		font-family: var(--sans);
		font-size: var(--text-ui);
		color: var(--muted);
		max-width: 60ch;
	}

	@media (min-width: 680px) {
		.member {
			grid-template-columns: 9rem 1fr;
			gap: var(--space-xl);
			align-items: start;
		}
	}

	/* ---- Talk to us — single green band ------------------------------------- */
	.talk {
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		margin-top: var(--section-gap);
		padding-block: clamp(3rem, 4.5vw, 4.25rem) clamp(3.5rem, 5vw, 5rem);
		/* Gradient settles to the footer's exact green so the band flows into the
		   footer with no seam; the radial glow keeps the CTA distinct up top. */
		background:
			radial-gradient(120% 90% at 14% -20%, oklch(0.37 0.05 165) 0%, transparent 52%),
			linear-gradient(180deg, oklch(0.31 0.035 165) 0%, var(--green) 100%);
		/* Top gold hairline divides the band from the white team section above; no
		   bottom rule, since the dark footer (not white content) follows it. */
		border-top: 1px solid oklch(0.82 0.05 85 / 0.28);
	}

	.talk__inner {
		display: grid;
		gap: var(--space-xl);
		align-items: end;
	}

	.talk__heading {
		color: var(--on-green);
	}

	.talk__body {
		margin-top: var(--space-md);
		font-family: var(--sans);
		font-size: var(--text-body);
		color: var(--on-green);
		max-width: 46ch;
	}

	.talk__actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.talk__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
		padding: 0.9rem 1.85rem;
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		cursor: pointer;
		border: 1px solid transparent;
		transition:
			background var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.talk__btn:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* Gold primary — the lead action, matching the EnquiryRail WhatsApp weighting. */
	.talk__btn--primary {
		background: var(--gold);
		color: var(--green);
		border-color: var(--gold);
	}

	.talk__btn--primary:hover,
	.talk__btn--primary:focus-visible {
		background: transparent;
		color: var(--on-green);
		border-color: rgba(245, 241, 232, 0.65);
	}

	.talk__btn--outline {
		background: transparent;
		color: var(--on-green);
		border-color: rgba(245, 241, 232, 0.4);
	}

	.talk__btn--outline:hover,
	.talk__btn--outline:focus-visible {
		background: var(--on-green);
		color: var(--green);
		border-color: var(--on-green);
	}

	.talk__btn--whatsapp {
		background: transparent;
		color: var(--on-green);
		border-color: rgba(245, 241, 232, 0.4);
	}

	.talk__btn--whatsapp svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: currentColor;
	}

	.talk__btn--whatsapp:hover,
	.talk__btn--whatsapp:focus-visible {
		background: var(--on-green);
		color: var(--green);
		border-color: var(--on-green);
	}

	@media (min-width: 760px) {
		.talk__inner {
			grid-template-columns: 1fr auto;
			gap: var(--space-2xl);
		}
	}

	/* ---- Motion: one quiet hero entrance; hover feedback carries the rest. ---- */
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

		@keyframes hero-rise {
			to {
				opacity: 1;
				transform: none;
			}
		}
	}
</style>
