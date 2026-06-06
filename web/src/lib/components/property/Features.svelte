<script lang="ts">
	import type { PublicContent } from '$lib/sanity/transforms';

	type Props = {
		content: PublicContent | null | undefined;
	};

	let { content }: Props = $props();

	const YES_VALUES = new Set(['yes', 'true', 'included', 'available']);

	/* Below this many features, a two-tier split (signature lead + grouped tail)
	   separates too little to be worth it; we show one calm list instead. */
	const SPLIT_MIN = 7;
	/* Signature sizing. A feature must clear MIN_SCORE to headline, so a thin
	   listing leads with three strong lines rather than padding with parking and
	   orientation. If too few clear it, we drop the lead and show the grouped
	   index alone. */
	const SIGNATURE_MIN = 3;
	const SIGNATURE_MAX = 5;
	const MIN_SCORE = 50;
	const FALLBACK_GROUP = 'Additional';

	/* Display groups for the "also includes" tail, in narrative order: where the
	   home sits, its outdoor life, its interior, its wellbeing, its leisure, the
	   practical things. Each keyword is matched whole-word (see matchWord); first
	   group to match wins, so list order doubles as precedence. Unmatched labels
	   fall to "Additional". The vocabulary is tuned to the real amenity strings. */
	const GROUPS: { title: string; match: string[] }[] = [
		{
			title: 'Setting & views',
			match: [
				'view',
				'orientation',
				'facing',
				'frontline',
				'front-line',
				'front line',
				'golf course',
				'golf-course',
				'golf',
				'sea',
				'coastline',
				'panoramic',
				'la concha',
				'beachfront',
				'aspect',
				'sunset',
				'sunrise'
			]
		},
		{
			title: 'Outdoor living',
			match: [
				'pool',
				'terrace',
				'garden',
				'jacuzzi',
				'outdoor kitchen',
				'bbq',
				'barbecue',
				'pergola',
				'alfresco',
				'chill',
				'patio',
				'deck',
				'irrigation'
			]
		},
		{
			title: 'Wellness & leisure',
			match: ['spa', 'sauna', 'turkish', 'hammam', 'gym', 'fitness', 'wellness', 'steam', 'massage']
		},
		{
			title: 'Entertainment',
			match: [
				'cinema',
				'billiard',
				'poker',
				'games',
				'entertainment',
				'wine',
				'cellar',
				'bodega',
				'playroom',
				'bar'
			]
		},
		{
			title: 'Interior',
			match: [
				'kitchen',
				'floor',
				'ceiling',
				'living',
				'open-plan',
				'open plan',
				'palette',
				'fireplace',
				'lounge',
				'dining',
				'balcony',
				'basement',
				'wardrobe',
				'furnished',
				'tv',
				'toilet',
				'blinds',
				'glass door',
				'appliance',
				'marble',
				'en-suite',
				'ensuite',
				'en suite',
				'master',
				'walk-in',
				'dressing',
				'bedroom',
				'bathroom',
				'lift',
				'elevator',
				'air conditioning',
				'heating',
				'underfloor',
				'smart',
				'automation',
				'architecture',
				'interior',
				'design',
				'gaggenau',
				'study',
				'office'
			]
		},
		{
			title: 'Parking & access',
			match: ['garage', 'parking', 'carport', 'driveway', 'slot', 'gated', 'storage', 'entrance', 'solar', 'security', 'alarm']
		},
		{
			title: 'Location & lifestyle',
			match: [
				'near',
				'nearby',
				'beach',
				'beachside',
				'promenade',
				'restaurant',
				'shopping',
				'centro',
				'school',
				'college',
				'lifestyle',
				'location',
				'setting',
				'community',
				'district',
				'minutes',
				'walk',
				'access',
				'corridor',
				'marina',
				'puerto',
				'close',
				'town',
				'shop',
				'transport'
			]
		}
	];

	/* Whole-word, plural-aware match: keeps "spa" out of "spaces" and "sea" out
	   of "search" while still letting "view" catch "views". Substring matching
	   silently miscategorises, so every keyword test goes through here. */
	function matchWord(label: string, keyword: string): boolean {
		const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return new RegExp(`\\b${escaped}(?:s|es)?\\b`, 'i').test(label);
	}

	/* Signature ranking: higher tier = more likely to headline. Tuned to the real
	   amenity vocabulary (views and pools sell a home; parking and orientation do
	   not). Communal facilities never headline, so they are capped below the
	   signature floor. */
	const SCORE_TIERS: { score: number; words: string[] }[] = [
		{
			score: 100,
			words: ['panoramic', 'coastline', 'sea', 'la concha', 'front-line', 'front line', 'frontline', 'golf course', 'golf-course', 'golf view', 'beachfront']
		},
		{ score: 92, words: ['view'] },
		{ score: 88, words: ['pool'] },
		{ score: 80, words: ['spa', 'sauna', 'turkish bath', 'hammam', 'gym', 'jacuzzi', 'wellness', 'steam room'] },
		{ score: 70, words: ['cinema', 'wine cellar', 'cellar', 'billiard', 'poker'] },
		{ score: 60, words: ['gaggenau', 'tobal', 'aalto', 'architecture', 'designer', 'interiors'] },
		{ score: 52, words: ['terrace', 'garden', 'outdoor kitchen'] },
		{ score: 38, words: ['lift', 'elevator', 'underfloor', 'home automation', 'solar'] },
		{ score: 28, words: ['garage', 'parking', 'carport', 'driveway'] },
		{ score: 8, words: ['orientation', 'facing', 'storage', 'aspect'] }
	];

	function score(label: string): number {
		let s = 0;
		for (const tier of SCORE_TIERS) {
			if (tier.score > s && tier.words.some((w) => matchWord(label, w))) s = tier.score;
		}
		const shared = matchWord(label, 'communal') || matchWord(label, 'community');
		return shared ? Math.min(s, 45) : s;
	}

	function groupOf(label: string): string {
		return GROUPS.find((g) => g.match.some((m) => matchWord(label, m)))?.title ?? FALLBACK_GROUP;
	}

	/* No more than this many signature lines from one theme, so a view-rich home
	   leads with a view, a pool and an interior standout rather than five
	   near-identical "X view" lines. */
	const PER_GROUP_CAP = 2;

	type Group = { title: string; items: string[] };
	type Model = { signature: string[]; groups: Group[]; flat: string[] };

	/* Build the ordered, de-duplicated feature pool, then either split it into a
	   ranked signature lead plus a grouped tail (long lists) or leave it as one
	   quiet list (short lists). Boolean / value-less feature highlights are folded
	   in for parity with the prior behaviour; highlights whose value is a
	   descriptive note carry internal provenance, not public copy, and are
	   skipped. */
	const model = $derived.by((): Model => {
		const seen = new Set<string>();
		const pool: string[] = [];
		const add = (raw: string | null | undefined) => {
			/* Strip the internal "per source" / "per source text" provenance suffix
			   that the enrichment pipeline leaves on some labels; it is an editorial
			   annotation, never public copy. */
			const label = raw?.trim().replace(/[,\s]+per\s+source(?:\s+text)?\.?$/i, '').trim();
			if (!label) return;
			const key = label.toLowerCase();
			if (seen.has(key)) return;
			seen.add(key);
			pool.push(label);
		};

		for (const highlight of content?.featureHighlights ?? []) {
			const label = highlight?.label?.trim();
			if (!label) continue;
			const value = highlight.value?.trim();
			if (!value || YES_VALUES.has(value.toLowerCase())) add(label);
		}
		for (const amenity of content?.amenities ?? []) add(amenity);

		if (pool.length < SPLIT_MIN) {
			return { signature: [], groups: [], flat: pool };
		}

		/* Pick the strongest features above the floor, best first, but always
		   leave at least two for the tail so the split reads as lead-plus-list.
		   If too few clear the floor, drop the lead entirely and let the grouped
		   index carry the whole set. */
		const maxSignature = Math.min(SIGNATURE_MAX, pool.length - 2);
		const ranked = pool
			.map((label, i) => ({ label, i, s: score(label) }))
			.sort((a, b) => b.s - a.s || a.i - b.i);

		const picked: string[] = [];
		const perGroup = new Map<string, number>();
		for (const x of ranked) {
			if (picked.length >= maxSignature || x.s < MIN_SCORE) break;
			const g = groupOf(x.label);
			const used = perGroup.get(g) ?? 0;
			if (used >= PER_GROUP_CAP) continue;
			perGroup.set(g, used + 1);
			picked.push(x.label);
		}
		const signature = picked.length >= SIGNATURE_MIN ? picked : [];

		const sig = new Set(signature);
		const rest = pool.filter((label) => !sig.has(label));

		const buckets = new Map<string, string[]>();
		for (const label of rest) {
			const title = groupOf(label);
			const list = buckets.get(title) ?? [];
			list.push(label);
			buckets.set(title, list);
		}
		const order = [...GROUPS.map((g) => g.title), FALLBACK_GROUP];
		const groups = order
			.filter((title) => buckets.has(title))
			.map((title) => ({ title, items: buckets.get(title)! }));

		return { signature, groups, flat: [] };
	});

	const hasFeatures = $derived(
		model.signature.length + model.groups.length + model.flat.length > 0
	);
</script>

{#if hasFeatures}
	<section class="features" aria-labelledby="features-heading">
		<h2 id="features-heading">Features</h2>

		{#if model.signature.length > 0}
			<ul class="features__signature">
				{#each model.signature as feature (feature)}
					<li>{feature}</li>
				{/each}
			</ul>

			{#if model.groups.length > 0}
				<p class="features__more-label"><span>Also includes</span></p>
			{/if}
		{/if}

		{#if model.groups.length > 0}
			<div class="features__groups">
				{#each model.groups as group (group.title)}
					<div class="features__group">
						<h3 class="features__group-title">{group.title}</h3>
						<ul class="features__group-list">
							{#each group.items as item (item)}
								<li>{item}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		{:else if model.flat.length > 0}
			<ul class="features__flat">
				{#each model.flat as feature (feature)}
					<li>{feature}</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

<style>
	.features {
		padding-block: var(--space-xl);
	}

	.features h2 {
		margin-bottom: var(--space-lg);
	}

	/* Signature lead: the handful of features that define the home, set in the
	   display serif so the eye lands here first. No bullets; scale and leading
	   carry it. */
	.features__signature {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-width: 52ch;
	}

	.features__signature li {
		font-family: var(--serif);
		font-size: clamp(1.125rem, 1rem + 0.7vw, 1.4rem);
		line-height: 1.35;
		color: var(--green);
		text-wrap: balance;
	}

	/* Amenity strings arrive lowercase ("private pool"); lift the first letter
	   while leaving proper nouns ("La Concha", "Gaggenau") untouched. */
	.features__signature li::first-letter {
		text-transform: uppercase;
	}

	/* "Also includes" divider: a quiet overline trailed by a hairline rule. */
	.features__more-label {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-top: var(--space-xl);
		margin-bottom: var(--space-lg);
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.features__more-label::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--border);
	}

	/* Grouped tail: themed columns that pack vertically, breakpoint-free (one
	   column on phones, more as width allows). Multi-column flow keeps a short
	   group from leaving dead space beside a tall one; each group stays whole. */
	.features__groups {
		columns: 15rem;
		column-gap: var(--space-xl);
	}

	.features__group {
		break-inside: avoid;
		margin-bottom: var(--space-lg);
	}

	.features__group-title {
		font-family: var(--sans);
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: var(--space-sm);
	}

	.features__group-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.features__group-list li {
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.45;
		color: var(--charcoal);
	}

	/* Short lists skip the split: one calm multi-column list. */
	.features__flat {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 0.5rem var(--space-xl);
	}

	.features__flat li {
		font-family: var(--sans);
		font-size: var(--text-ui);
		line-height: 1.45;
		color: var(--charcoal);
	}
</style>
