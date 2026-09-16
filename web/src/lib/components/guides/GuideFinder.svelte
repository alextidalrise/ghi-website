<script lang="ts">
	/**
	 * The Guides hub as a consultation.
	 *
	 * Two questions an advisor would ask — who are you buying as, where are you looking —
	 * and one answer. It replaces a catalogue grouped by country, which made a buyer scan
	 * for something they could simply be handed.
	 *
	 * Every choice is a link (`?for=…&in=…`), not a form control with client state: it works
	 * without JavaScript, survives a refresh, and the answer can be sent to someone. Links
	 * keep focus and scroll position so answering reads as ticking a box, not loading a page.
	 *
	 * The choice indicator is a square, never a round radio: square corners are the brand's
	 * rule everywhere, and a box that fills reads as "ticked" in the questionnaire idiom the
	 * site's forms already use (bottom rules, no field boxes).
	 */
	import { finderHref, type FinderState } from '$lib/guides/finder';
	import { guidePath } from '$lib/guides/routes';
	import { marketInProse } from '$lib/markets/markets';

	type Props = { finder: FinderState };

	let { finder }: Props = $props();

	const buyerType = $derived(finder.buyerType);
	const market = $derived(finder.market);
	const answer = $derived(finder.answer);

	/** "UK buyer" → "UK buyers"; "International buyer" → "international buyers". */
	function buyersNoun(name: string): string {
		const [first, ...rest] = name.trim().split(/\s+/);
		const lead = /^[A-Z]{2,}$/.test(first) ? first : first.toLowerCase();
		const phrase = [lead, ...rest].join(' ');
		return phrase.endsWith('s') ? phrase : `${phrase}s`;
	}

	/** "UK buyer" → "a UK buyer"; "International buyer" → "an international buyer". */
	function aBuyer(name: string): string {
		const noun = buyersNoun(name).replace(/s$/, '');
		return /^[aeiou]/i.test(noun) && !/^[A-Z]{2,}/.test(noun) ? `an ${noun}` : `a ${noun}`;
	}

	const prompt = $derived(
		!buyerType && !market
			? 'Answer both questions and your guide appears here.'
			: !buyerType
				? 'Now tell us who you are buying as.'
				: 'Now tell us where you are looking.'
	);

	// Re-keys the answer block so it re-enters when the pairing changes.
	const answerKey = $derived(`${buyerType?.slug ?? ''}|${market?.slug ?? ''}`);

	const askHref = $derived(
		market && buyerType
			? `/contact?enquiry=guide&country=${encodeURIComponent(market.slug)}&buyer=${encodeURIComponent(buyerType.slug)}`
			: '/contact?enquiry=guide'
	);
</script>

<section class="finder content-wrap" aria-label="Find your buying guide">
	<div class="finder__questions">
		<div class="question" role="group" aria-labelledby="finder-for">
			<h2 class="question__prompt" id="finder-for">Who are you buying as?</h2>
			<ul class="question__choices">
				{#each finder.buyerTypes as type (type.slug)}
					{@const chosen = type.slug === buyerType?.slug}
					<li>
						<a
							class="choice"
							class:choice--chosen={chosen}
							href={finderHref(type.slug, market?.slug ?? null)}
							aria-current={chosen ? 'true' : undefined}
							data-sveltekit-noscroll
							data-sveltekit-keepfocus
						>
							<span class="choice__box" aria-hidden="true"></span>
							<span class="choice__label">{type.name}</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<div class="question" role="group" aria-labelledby="finder-in">
			<h2 class="question__prompt" id="finder-in">Where are you looking?</h2>
			<ul class="question__choices">
				{#each finder.markets as m (m.slug)}
					{@const chosen = m.slug === market?.slug}
					<li>
						<a
							class="choice"
							class:choice--chosen={chosen}
							href={finderHref(buyerType?.slug ?? null, m.slug)}
							aria-current={chosen ? 'true' : undefined}
							data-sveltekit-noscroll
							data-sveltekit-keepfocus
						>
							<span class="choice__box" aria-hidden="true"></span>
							<span class="choice__label">{m.name}</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<div class="finder__answer" aria-live="polite">
		{#key answerKey}
			{#if answer.state === 'incomplete'}
				<div class="answer answer--waiting">
					<p class="waiting">{prompt}</p>
				</div>
			{:else if answer.state === 'found'}
				<article class="answer" aria-labelledby="finder-answer-title">
					<h2 class="answer__title" id="finder-answer-title">{answer.guide.title}</h2>
					{#if answer.guide.tagline}
						<p class="answer__tagline">{answer.guide.tagline}</p>
					{/if}

					<!-- The action sits straight under the title and tagline so it lands in view the
					     moment the second box is ticked; the chapter list below is the proof. -->
					<div class="answer__actions">
						<a class="answer__read" href={guidePath(answer.guide.slug)}>Read the guide</a>
						{#if answer.guide.reviewed}
							<span class="answer__reviewed">{answer.guide.reviewed}</span>
						{/if}
					</div>

					{#if answer.guide.chapters.length > 0}
						<h3 class="answer__covers">What it covers</h3>
						<ol class="answer__chapters">
							{#each answer.guide.chapters as chapter, i (i)}
								<li class="answer__chapter">
									<!-- Numbered the way the guide's own contents rail numbers them. -->
									<span class="answer__index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
									<span>{chapter}</span>
								</li>
							{/each}
						</ol>
					{/if}

					{#if answer.alternate}
						<p class="answer__alternate">
							Buying as {aBuyer(answer.alternate.buyerType.name)} instead?
							<a href={finderHref(answer.alternate.buyerType.slug, market?.slug ?? null)} data-sveltekit-noscroll>
								See that guide <span aria-hidden="true">→</span>
							</a>
						</p>
					{/if}
				</article>
			{:else if buyerType && market}
				<article class="answer answer--missing" aria-labelledby="finder-answer-title">
					<h2 class="answer__title" id="finder-answer-title">
						No written guide for {buyersNoun(buyerType.name)} in {marketInProse(market.name)} yet
					</h2>
					<p class="answer__tagline">
						We will talk you through buying there — the process, the costs and the order it all
						happens in.
					</p>
					<div class="answer__actions">
						<a class="answer__read" href={askHref}>Ask how it works</a>
					</div>
					{#if answer.alternate}
						<p class="answer__alternate">
							There is a guide for {buyersNoun(answer.alternate.buyerType.name)} in {marketInProse(market.name)}.
							<a href={finderHref(answer.alternate.buyerType.slug, market.slug)} data-sveltekit-noscroll>
								See that guide <span aria-hidden="true">→</span>
							</a>
						</p>
					{/if}
				</article>
			{/if}
		{/key}
	</div>
</section>

<style>
	/* Top padding kept to one step below the page rhythm: the answer panel has to land in
	   the first desktop viewport under a tall green hero. */
	.finder {
		padding-block: var(--space-xl) var(--section-gap);
	}

	/* The two questions sit side by side on a wide screen so the answer lands in view the
	   moment the second box is ticked; they stack on narrower screens. */
	.finder__questions {
		display: grid;
		gap: var(--space-xl);
	}

	@media (min-width: 56rem) {
		.finder__questions {
			grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
			gap: var(--space-2xl);
		}
	}

	.question {
		min-width: 0;
	}

	.question__prompt {
		margin: 0 0 var(--space-sm);
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h3);
		color: var(--green);
	}

	/* One bottom rule under the row of choices: the questionnaire idiom, a line to tick
	   along rather than a set of boxed fields. */
	.question__choices {
		display: flex;
		flex-wrap: wrap;
		gap: 0 var(--space-lg);
		margin: 0;
		padding: 0 0 var(--space-xs);
		list-style: none;
		border-bottom: 1px solid var(--border);
	}

	.choice {
		display: inline-flex;
		align-items: center;
		gap: 0.7rem;
		min-height: 2.75rem;
		text-decoration: none;
		color: var(--charcoal);
	}

	.choice__box {
		flex-shrink: 0;
		width: 1rem;
		height: 1rem;
		border: 1px solid color-mix(in oklch, var(--green) 55%, transparent);
		background: var(--white);
		transition:
			background-color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease),
			box-shadow var(--duration-hover) var(--ease);
	}

	.choice__label {
		font-family: var(--sans);
		font-weight: 300;
		font-size: 1.0625rem;
		line-height: 1.3;
	}

	.choice:hover .choice__box {
		border-color: var(--green);
	}

	.choice:hover .choice__label {
		color: var(--green);
	}

	.choice:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 4px;
	}

	/* Chosen: the box fills green inside a white inset, so it reads as ticked rather than
	   as a solid block, and the label steps up a weight. */
	.choice--chosen .choice__box {
		border-color: var(--green);
		background: var(--green);
		box-shadow: inset 0 0 0 3px var(--white);
	}

	.choice--chosen .choice__label {
		font-weight: 400;
		color: var(--green);
	}

	.finder__answer {
		margin-top: var(--space-xl);
	}

	/* Before both answers the panel is already there, holding the prompt: the reader can see
	   where the answer will arrive. Shallower than an answer, so it does not read as one. */
	.answer.answer--waiting {
		padding-block: var(--space-lg);
	}

	.waiting {
		margin: 0;
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		color: var(--muted);
	}

	/* The answer: the contained-panel idiom (1px frame, gold top edge, faint green bed) the
	   routes panels use, so it reads as the one thing on the page handed to the reader. */
	.answer {
		padding: clamp(1.5rem, 4vw, 2.75rem);
		border: 1px solid var(--border);
		border-block-start: 1px solid var(--gold);
		background: var(--surface-tint);
	}

	.answer__title {
		margin: 0;
		font-family: var(--serif);
		font-weight: 400;
		font-size: var(--text-h2);
		line-height: 1.12;
		color: var(--green);
		max-width: 26ch;
	}

	.answer__tagline {
		margin: var(--space-sm) 0 0;
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.7;
		color: var(--charcoal);
		max-width: 60ch;
	}

	.answer__covers {
		margin: var(--space-xl) 0 var(--space-xs);
		font-family: var(--sans);
		font-weight: 400;
		font-size: var(--text-ui);
		color: var(--muted);
	}

	.answer__chapters {
		display: grid;
		column-gap: var(--space-xl);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	@media (min-width: 40rem) {
		.answer__chapters {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	.answer__chapter {
		display: flex;
		gap: var(--space-sm);
		align-items: baseline;
		padding-block: 0.7rem;
		border-top: 1px solid color-mix(in oklch, var(--green) 14%, transparent);
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-body);
		line-height: 1.45;
		color: var(--charcoal);
	}

	.answer__index {
		flex-shrink: 0;
		font-size: var(--text-small);
		font-feature-settings: 'tnum';
		color: var(--muted);
	}

	.answer__actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm) var(--space-lg);
		margin-top: var(--space-md);
	}

	/* The page's primary action: filled green, per the button tiers. */
	.answer__read {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0.875rem 2rem;
		background: var(--green);
		color: var(--white);
		border: 1px solid var(--green);
		font-family: var(--sans);
		font-size: var(--text-ui);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		text-decoration: none;
		transition:
			background-color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	.answer__read:hover,
	.answer__read:focus-visible {
		background: var(--charcoal);
		border-color: var(--charcoal);
	}

	.answer__read:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	.answer__reviewed {
		font-family: var(--sans);
		font-size: var(--text-small);
		color: var(--muted);
	}

	.answer__alternate {
		margin: var(--space-md) 0 0;
		padding-top: var(--space-md);
		border-top: 1px solid color-mix(in oklch, var(--green) 14%, transparent);
		font-family: var(--sans);
		font-weight: 300;
		font-size: var(--text-ui);
		color: var(--charcoal);
	}

	.answer__alternate a {
		color: var(--green);
		font-weight: 400;
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition:
			color var(--duration-hover) var(--ease),
			border-color var(--duration-hover) var(--ease);
	}

	/* On the tint panel gold ink would drop to ~1.8:1, so the text stays green and only the
	   underline takes the gold. */
	.answer__alternate a:hover,
	.answer__alternate a:focus-visible {
		border-bottom-color: var(--gold);
	}

	.answer__alternate a:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 3px;
	}

	/* The one authored moment: the answer settles in when the pairing changes. It starts
	   visible (never from zero opacity) so a slow device or a missed frame shows the answer
	   rather than a blank panel. */
	@media (prefers-reduced-motion: no-preference) {
		.answer {
			animation: answer-settle 0.55s var(--ease) both;
		}

		@keyframes answer-settle {
			from {
				opacity: 0.55;
				transform: translateY(8px);
			}
			to {
				opacity: 1;
				transform: none;
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.choice__box,
		.answer__read,
		.answer__alternate a {
			transition: none;
		}
	}
</style>
