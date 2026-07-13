#!/usr/bin/env node
/**
 * Seed the Insights section.
 *
 * Content policy: only real articles go in here. Every article below is transcribed from
 * an approved design-team mockup — copy, section order, pull quotes and FAQ are the
 * editorial team's, not invented. If you need more articles, transcribe another mockup or
 * write real copy; do not pad the grid with filler.
 *
 * Currently seeded:
 *   • Living by the Fairways (lifestyle, featured) — from the "hybrid editorial" mockup.
 *
 * Defaults to the `development` dataset. `--delete` removes everything it seeds.
 *
 * Usage:
 *   pnpm --filter sanity insights:seed
 *   pnpm --filter sanity insights:seed:dry-run
 *   pnpm --filter sanity insights:delete
 */
import { createClient, type IdentifiedSanityDocumentStub } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN = process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const deleteMode = args.includes('--delete');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetIndex >= 0 ? args[datasetIndex + 1] : (process.env.SANITY_STUDIO_DATASET ?? 'development');

const LOCAL_ASSETS_DIR = join(__dirname, '../../../web/static/design-system/assets');
const LOCAL_HERO = 'andalucia-golf-villa.png';

const AUTHOR_IDS = {
	ghi: 'author.golf-homes-international'
};

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config/sanity/config.json');
	if (!existsSync(configPath)) return undefined;
	try {
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string };
		return config.authToken;
	} catch {
		return undefined;
	}
}

// ── Portable-text + block helpers ─────────────────────────────────────────────
let counter = 0;
const key = (prefix: string) => `${prefix}${(counter += 1)}`;

type Block = Record<string, unknown>;

const span = (text: string) => ({ _type: 'span' as const, _key: key('s'), marks: [], text });
const block = (style: string, text: string, listItem?: 'bullet' | 'number') => ({
	_type: 'block' as const,
	_key: key('b'),
	style,
	markDefs: [],
	...(listItem ? { listItem, level: 1 } : {}),
	children: [span(text)]
});
const para = (text: string) => block('normal', text);
const h3 = (text: string) => block('h3', text);
const bullet = (text: string) => block('normal', text, 'bullet');

const callout = (tone: 'note' | 'important', title: string, body: string): Block => ({
	_type: 'guideCallout',
	_key: key('co'),
	tone,
	title,
	body
});
const keyFigures = (
	caption: string,
	rows: Array<{ label: string; value: string; note?: string }>
): Block => ({
	_type: 'guideKeyFigures',
	_key: key('kf'),
	caption,
	rows: rows.map((r) => ({ _key: key('kfr'), ...r }))
});
/**
 * Body photography, drawn from the location taxonomy's hero images — GHI's own pictures of
 * real places, already published on the area pages.
 *
 * NOT from the listing galleries. Every one of the ~5,700 images in `propertyListing.media`
 * carries `publicUseApproved: false` / `imageRightsStatus: "needs_rights_review"`, so
 * putting one in an article would publish photography that has not cleared rights review.
 * The location heroes carry no rights gate and are already public. Keep it that way.
 */
const LOCATION_IMAGES = {
	losNaranjos: {
		id: 'image-7ceb06dca544717297a022919b01fbfb4deef81b-5272x3948-jpg',
		alt: 'Los Naranjos Golf course with La Concha mountain backdrop'
	},
	benahavis: {
		id: 'image-4634571129430a80693ab98877179d4b1de4cb9a-6941x4627-jpg',
		alt: 'Street scene in Benahavis village, Malaga, Andalusia, Spain'
	},
	// Natively 16:9 at 3848x2164 — it fills the figure frame with no crop and no softness.
	// (San Pedro's promenade shot reads well but is only 1600x608: a third of it would be
	// cropped away by the frame, and what was left would be soft on a retina screen.)
	quintaDoLago: {
		id: 'image-69041305cb8bd2876a07c298ef28ffe918b9cb4b-3848x2164-jpg',
		alt: 'View over Quinta do Lago golf and Ria Formosa landscape in Portugal'
	}
} as const;

const figure = (image: { id: string; alt: string }, caption: string): Block => ({
	_type: 'insightFigure',
	_key: key('fig'),
	image: {
		_type: 'mediaAssetMetadata',
		asset: { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: image.id } },
		altText: image.alt
	},
	caption
});

const cardGrid = (items: Array<{ heading: string; body: string }>): Block => ({
	_type: 'insightCardGrid',
	_key: key('cg'),
	items: items.map((i) => ({ _type: 'insightCardGridItem', _key: key('cgi'), ...i }))
});

const pullQuote = (quote: string, attribution?: string): Block => ({
	_type: 'insightPullQuote',
	_key: key('pq'),
	quote,
	...(attribution ? { attribution } : {})
});
const takeaways = (
	heading: string,
	items: Array<{ label?: string; text: string }>
): Block => ({
	_type: 'insightTakeaways',
	_key: key('tk'),
	heading,
	items: items.map((i) => ({
		_type: 'insightTakeawayItem',
		_key: key('tki'),
		...(i.label ? { label: i.label } : {}),
		text: i.text
	}))
});
const faq = (items: Array<{ q: string; a: string }>): Block => ({
	_type: 'insightFaq',
	_key: key('fq'),
	items: items.map((i) => ({
		_type: 'insightFaqItem',
		_key: key('fqi'),
		question: i.q,
		answer: i.a
	}))
});
const inlineCta = (heading: string, body: string, label = 'Speak to GHI', href = '/contact'): Block => ({
	_type: 'insightCtaCallout',
	_key: key('ic'),
	heading,
	body,
	buttonLabel: label,
	buttonHref: href
});

// Blocks in the library that this article's copy doesn't call for. Referenced so the
// helpers stay type-checked and ready for the next transcription.
void keyFigures;
void inlineCta;

const slugify = (text: string) =>
	text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 96);

// Every item in a Sanity array needs a unique _key, or the Studio refuses to edit the list.
const section = (heading: string, body: Block[]) => ({
	_type: 'insightSection',
	_key: key('sec'),
	heading,
	anchor: { _type: 'slug', current: slugify(heading) },
	body
});

function heroImage(assetId: string, altText: string) {
	return {
		_type: 'mediaAssetMetadata',
		asset: { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: assetId } },
		altText
	};
}

// ── Authors ──────────────────────────────────────────────────────────────────
function buildAuthors(): IdentifiedSanityDocumentStub[] {
	return [
		{
			_id: AUTHOR_IDS.ghi,
			_type: 'author',
			name: 'Golf Homes International',
			slug: { _type: 'slug', current: 'golf-homes-international' },
			role: 'Editorial team',
			bio: 'The GHI editorial team writes on the markets, places and practicalities behind a considered golf-property purchase in southern Europe.'
		}
	];
}

// ── Articles ──────────────────────────────────────────────────────────────────
type ArticleSpec = {
	id: string;
	title: string;
	/** A phrase from `title`, word for word, set in the hero's Playfair italic. */
	titleEmphasis?: string;
	slug: string;
	category: 'market' | 'lifestyle' | 'golf' | 'relocation';
	author: string;
	publishedAt: string;
	featured?: boolean;
	subhead: string;
	alt: string;
	heroCaption?: string;
	heroNote?: { heading: string; body: string };
	sections: Array<{ heading: string; body: Block[] }>;
	ctaHeading?: string;
	ctaBody?: string;
	seoTitle: string;
	metaDescription: string;
};

/**
 * Living by the Fairways — transcribed from
 * `living_by_the_fairways_golf_course_living_hybrid_editorial_self_.html`.
 * Copy is the design team's; only the "GHI Journal" kicker was dropped (we say Insights).
 */
const LIVING_BY_THE_FAIRWAYS: ArticleSpec = {
	id: 'insight.living-by-the-fairways',
	title: 'Living by the Fairways: The Quiet Luxury of Golf Course Living',
	// The mockup's own <em> — "The Quiet Luxury of <em>Golf Course Living</em>".
	titleEmphasis: 'Golf Course Living',
	slug: 'living-by-the-fairways',
	category: 'lifestyle',
	author: AUTHOR_IDS.ghi,
	publishedAt: '2026-07-01T08:00:00Z',
	featured: true,
	// The article's opening line, promoted out of the body to serve as the deck (and as the
	// index-card summary). The sentence it used to carry is now the hero note, which is where
	// the mockup puts it.
	subhead: 'There is a distinct sense of calm that comes with waking up beside a golf course.',
	alt: 'A contemporary golf villa above the fairway on the Costa del Sol at dusk',
	heroCaption:
		'Golf course living is strongest when fairway views are matched with privacy, light and everyday usability.',
	// Verbatim from the mockup's `.hero-card`.
	heroNote: {
		heading: 'More than a view.',
		body: 'For many buyers, the value of golf living is not just access to the game. It is the feeling of space, calm and connection to landscape.'
	},
	ctaHeading: 'Looking for a home beside the fairways?',
	ctaBody:
		'Tell GHI what kind of golf lifestyle you want and we can help you compare villas, apartments and resort homes in the settings that fit your brief.',
	sections: [
		{
			heading: 'More than a view',
			body: [
				// The mockup's opening sentence now runs as the hero deck; repeating it here would
				// be the same line twice in one screen.
				para(
					'The open outlook, the soft morning light across the greens, and the feeling of space all create a lifestyle that feels measured, refined and deeply connected to its surroundings.'
				),
				para(
					'For many international buyers, a golf home is not simply about access to the game. It is about the quality of daily life that comes with it.'
				),
				takeaways('What this article covers', [
					{ label: 'Lifestyle', text: 'calm, outlook, space and easy outdoor living.' },
					{
						label: 'Design lens',
						text: 'orientation, terraces, privacy and the home’s relationship to the landscape.'
					},
					{ label: 'Buyer value', text: 'the property should work beyond the first impression.' },
					{
						label: 'GHI role',
						text: 'helping buyers assess whether the setting fits how they want to live.'
					}
				])
			]
		},
		{
			heading: 'The quiet luxury of golf course living',
			body: [
				para(
					'Golf course living is not only about playing the game. For many international buyers, the appeal is space, light, greenery, privacy and a calmer rhythm of daily life.'
				),
				bullet('Best for buyers seeking outlook, calm and open space'),
				bullet('Strongest when the home is designed around view and orientation'),
				bullet('Needs careful checks on privacy, maintenance routes and community rules'),
				bullet('Works best when golf is part of a wider lifestyle story')
			]
		},
		{
			heading: 'A morning shaped by space and light',
			body: [
				para(
					'The day begins differently when the fairways are part of the view. From the first light across the course to the stillness of a private terrace, golf-front living brings a natural sense of openness into the home.'
				),
				figure(LOCATION_IMAGES.losNaranjos, 'Los Naranjos Golf, Nueva Andalucía.'),
				para(
					'Large windows, generous outdoor spaces and carefully considered architecture allow the landscape to become part of everyday life, rather than something enjoyed only occasionally.'
				)
			]
		},
		{
			heading: 'A lifestyle at a gentler pace',
			body: [
				para(
					'Life beside the fairways often feels more balanced. Mornings may begin with a walk, a relaxed breakfast outdoors, or an early round before the day properly begins.'
				),
				para(
					'Even for those who do not play regularly, the presence of the course adds structure, beauty and tranquillity to the setting. It creates a sense of order without feeling formal, and privacy without feeling isolated.'
				),
				pullQuote(
					'Golf-front living works best when the view is matched by privacy, outdoor space and a home that feels easy to use day to day.'
				)
			]
		},
		{
			heading: 'Homes designed around the view',
			body: [
				para(
					'The best golf homes are designed to make the most of their position. Orientation, elevation and outdoor living areas all play an important role in how the property feels.'
				),
				// The mockup sets these three as a card grid, not a stack of h3s: they are parallel
				// considerations the buyer weighs against each other, and side-by-side is the point.
				cardGrid([
					{
						heading: 'Orientation',
						body: 'Light, shade and exposure matter as much as the view itself.'
					},
					{
						heading: 'Privacy',
						body: 'The best homes feel connected to the course without feeling overlooked.'
					},
					{
						heading: 'Outdoor living',
						body: 'Terraces, pools, gardens and dining areas turn the setting into everyday value.'
					}
				])
			]
		},
		{
			heading: 'A setting that feels alive',
			body: [
				// Deliberately plain: a rest. This section sits between the card grid above and the
				// figure below, so it reads as a breath rather than a wall — and a figure here
				// would land a third of a screen from the next one, which is just the metronome
				// again at a larger scale. Variety means variation, not a device in every section.
				para(
					'Golf communities have a natural rhythm. There is movement across the course, activity around the clubhouse, and a quiet social energy that gives the area life without overwhelming it.'
				),
				para(
					'This balance is part of what makes golf property so attractive: residents can enjoy privacy at home while still having access to a wider lifestyle community when they want it.'
				)
			]
		},
		{
			heading: 'Wellbeing through outdoor living',
			body: [
				para(
					'Golf homes are often closely linked with wellbeing. Fresh air, walking routes, landscaped surroundings and year-round access to outdoor space all contribute to a healthier way of living.'
				),
				figure(
					LOCATION_IMAGES.quintaDoLago,
					'Quinta do Lago, above the Ria Formosa, Portugal.'
				),
				para(
					'In destinations with warm climates, this connection becomes even stronger, with terraces, pools, gardens and dining areas extending the home naturally into the landscape.'
				)
			]
		},
		{
			heading: 'More than a view, a way of living',
			body: [
				para(
					'A golf home is about more than the outlook. It is about lifestyle, access, design and long-term enjoyment.'
				),
				callout(
					'note',
					'GHI View',
					'The best golf homes are not simply close to a course. They are homes where the setting improves daily life, supports long-term use and still makes sense when you are not playing golf.'
				)
			]
		},
		{
			heading: 'FAQ',
			body: [
				faq([
					{
						q: 'Is frontline golf always the best position?',
						a: 'Not always. A strong frontline position can be exceptional, but privacy, orientation, course traffic and wider lifestyle fit still need checking.'
					},
					{
						q: 'What should buyers check with golf-course homes?',
						a: 'Buyers should check privacy, orientation, maintenance routes, community rules, noise, security, running costs and whether any golf benefits are formally included.'
					}
				])
			]
		}
	],
	seoTitle: 'Living by the Fairways: The Quiet Luxury of Golf Course Living',
	metaDescription:
		'What golf course living really offers: space, calm and a home shaped by the landscape, beyond access to the game itself.'
};

// Kept for the next article: a village street scene, unused by this one.
void LOCATION_IMAGES.benahavis;

const ARTICLES: ArticleSpec[] = [LIVING_BY_THE_FAIRWAYS];

function buildInsight(spec: ArticleSpec, assetId: string): IdentifiedSanityDocumentStub {
	return {
		_id: spec.id,
		_type: 'insight',
		title: spec.title,
		...(spec.titleEmphasis ? { titleEmphasis: spec.titleEmphasis } : {}),
		slug: { _type: 'slug', current: spec.slug },
		insightCategory: spec.category,
		author: { _type: 'reference', _ref: spec.author },
		publishedAt: spec.publishedAt,
		featured: spec.featured ?? false,
		subhead: spec.subhead,
		heroImage: heroImage(assetId, spec.alt),
		...(spec.heroCaption ? { heroCaption: spec.heroCaption } : {}),
		...(spec.heroNote
			? { heroNote: { _type: 'insightHeroNote', ...spec.heroNote } }
			: {}),
		sections: spec.sections.map((s) => section(s.heading, s.body)),
		...(spec.ctaHeading ? { ctaHeading: spec.ctaHeading } : {}),
		...(spec.ctaBody ? { ctaBody: spec.ctaBody } : {}),
		seo: {
			_type: 'seoFields',
			seoTitle: spec.seoTitle,
			metaDescription: spec.metaDescription,
			noindex: false
		}
	};
}

async function main() {
	console.log(`Insights → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);

	if (!TOKEN && !dryRun) {
		console.error(
			'Missing write credentials. Set SANITY_API_TOKEN=… (write token) or run `pnpm exec sanity login`.'
		);
		process.exit(1);
	}

	const client = createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-05-01',
		token: TOKEN,
		useCdn: false
	});

	if (deleteMode) {
		const ids = [...ARTICLES.map((a) => a.id), ...Object.values(AUTHOR_IDS)];
		console.log(`Deleting ${ids.length} insight/author documents…`);
		if (dryRun) {
			ids.forEach((id) => console.log(`  [dry-run] delete ${id}`));
			return;
		}
		for (const id of ids) {
			await client.delete(id).catch(() => client.delete({ query: '*[_id == $id]', params: { id } }));
			console.log(`  ✓ deleted ${id}`);
		}
		return;
	}

	const assetIds: string[] = [];
	if (dryRun) {
		assetIds.push('image-dry-run');
	} else {
		console.log('Uploading hero image…');
		const local = await client.assets.upload(
			'image',
			readFileSync(join(LOCAL_ASSETS_DIR, LOCAL_HERO)),
			{ filename: 'insight-fairway-villa.png' }
		);
		assetIds.push(local._id);
		console.log(`  uploaded → ${local._id}`);
	}

	const authors = buildAuthors();
	console.log(`Upserting ${authors.length} author…`);
	for (const doc of authors) {
		if (dryRun) {
			console.log(`  [dry-run] ${doc._type} ${doc._id}`);
			continue;
		}
		await client.transaction().createOrReplace(doc).delete(`drafts.${doc._id}`).commit();
		console.log(`  ✓ ${doc._type} ${doc._id}`);
	}

	console.log(`Upserting ${ARTICLES.length} insight…`);
	for (let index = 0; index < ARTICLES.length; index += 1) {
		const spec = ARTICLES[index];
		const assetId = assetIds[index % assetIds.length];
		const doc = buildInsight(spec, assetId);
		if (dryRun) {
			console.log(
				`  [dry-run] ${doc._type} ${doc._id} (${spec.category}${spec.featured ? ', featured' : ''}, ${spec.sections.length} sections)`
			);
			continue;
		}
		// Replace the published doc AND drop any draft of it. Opening a document in the Studio
		// creates a draft, and local dev reads the `drafts` perspective — so a leftover draft
		// silently shadows everything a re-seed writes, and the site keeps serving the old copy.
		await client.transaction().createOrReplace(doc).delete(`drafts.${doc._id}`).commit();
		console.log(`  ✓ ${doc._type} ${doc._id}`);
	}

	console.log('\nView (after `pnpm --filter web dev`):');
	for (const spec of ARTICLES) {
		console.log(`  http://localhost:5173/insights/${spec.slug}`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
