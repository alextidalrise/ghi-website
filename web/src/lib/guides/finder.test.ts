import { describe, expect, it } from 'vitest';
import { finderHref, resolveFinder, reviewedLabel, type FinderGuide } from './finder';

const UK = { slug: 'uk-buyer', name: 'UK buyer' };
const INTL = { slug: 'international-buyer', name: 'International buyer' };
const SPAIN = { slug: 'spain', name: 'Spain', flagUrl: null };
const UAE = { slug: 'uae', name: 'UAE', flagUrl: null };

const guide = (slug: string, audience: string | null, market: string | null): FinderGuide => ({
	slug,
	title: slug,
	tagline: null,
	chapters: [],
	reviewed: null,
	audience,
	market
});

const ES_UK = guide('es-uk', 'uk-buyer', 'spain');
const ES_INTL = guide('es-intl', 'international-buyer', 'spain');

const base = { buyerTypes: [UK, INTL], markets: [SPAIN, UAE] };

describe('resolveFinder', () => {
	it('pre-answers both questions with the first available options', () => {
		const state = resolveFinder({ ...base, guides: [ES_UK, ES_INTL], forSlug: null, inSlug: null });

		expect(state.buyerType).toEqual(UK);
		expect(state.market).toEqual(SPAIN);
		expect(state.answer).toMatchObject({ state: 'found', guide: { slug: 'es-uk' } });
	});

	it('defaults the market to the first one with a guide, not simply the first in order', () => {
		// UAE ordered first but not written yet: the hub should still open on a real guide.
		const state = resolveFinder({
			...base,
			markets: [UAE, SPAIN],
			guides: [ES_UK],
			forSlug: null,
			inSlug: null
		});

		expect(state.market).toEqual(SPAIN);
	});

	it('keeps an explicit answer and defaults only the other question', () => {
		const state = resolveFinder({ ...base, guides: [ES_UK], forSlug: null, inSlug: 'uae' });

		expect(state.buyerType).toEqual(UK);
		expect(state.market).toEqual(UAE);
		expect(state.answer.state).toBe('missing');
	});

	it('is incomplete only when there is nothing to choose from', () => {
		const state = resolveFinder({ buyerTypes: [], markets: [], guides: [], forSlug: null, inSlug: null });

		expect(state.answer.state).toBe('incomplete');
	});

	it('answers with the guide written for that buyer in that market', () => {
		const state = resolveFinder({ ...base, guides: [ES_UK, ES_INTL], forSlug: 'uk-buyer', inSlug: 'spain' });

		expect(state.answer).toMatchObject({ state: 'found', guide: { slug: 'es-uk' } });
	});

	it('offers the other buyer type’s guide for the same market alongside', () => {
		const state = resolveFinder({ ...base, guides: [ES_UK, ES_INTL], forSlug: 'uk-buyer', inSlug: 'spain' });

		expect(state.answer.state === 'found' && state.answer.alternate?.guide.slug).toBe('es-intl');
	});

	it('says a pairing is missing rather than showing the wrong guide', () => {
		const state = resolveFinder({ ...base, guides: [ES_UK], forSlug: 'uk-buyer', inSlug: 'uae' });

		expect(state.answer).toEqual({ state: 'missing', alternate: null });
	});

	it('points a missing pairing at the market’s guide for another buyer type', () => {
		const state = resolveFinder({ ...base, guides: [ES_UK], forSlug: 'international-buyer', inSlug: 'spain' });

		expect(state.answer.state).toBe('missing');
		expect(state.answer.state === 'missing' && state.answer.alternate?.buyerType).toEqual(UK);
	});

	it('lets a guide with no buyer type answer every buyer in its market', () => {
		const everyone = guide('es-all', null, 'spain');
		const state = resolveFinder({ ...base, guides: [everyone], forSlug: 'international-buyer', inSlug: 'spain' });

		expect(state.answer).toMatchObject({ state: 'found', guide: { slug: 'es-all' }, alternate: null });
	});

	it('falls back to a buyer type’s general guide only when the market has none', () => {
		const general = guide('uk-general', 'uk-buyer', null);

		expect(
			resolveFinder({ ...base, guides: [general, ES_UK], forSlug: 'uk-buyer', inSlug: 'spain' }).answer
		).toMatchObject({ guide: { slug: 'es-uk' } });
		expect(
			resolveFinder({ ...base, guides: [general], forSlug: 'uk-buyer', inSlug: 'uae' }).answer
		).toMatchObject({ guide: { slug: 'uk-general' } });
	});

	it('falls back to the default for an unknown slug', () => {
		const state = resolveFinder({ ...base, guides: [ES_UK], forSlug: 'martian', inSlug: 'spain' });

		expect(state.buyerType).toEqual(UK);
		expect(state.market).toEqual(SPAIN);
		expect(state.answer.state).toBe('found');
	});
});

describe('finderHref', () => {
	it('builds a linkable pair of answers', () => {
		expect(finderHref('uk-buyer', 'spain')).toBe('/guides?for=uk-buyer&in=spain');
		expect(finderHref(null, 'spain')).toBe('/guides?in=spain');
		expect(finderHref(null, null)).toBe('/guides');
	});
});

describe('reviewedLabel', () => {
	it('formats without timezone drift', () => {
		expect(reviewedLabel('2026-06-01')).toBe('Reviewed June 2026');
		expect(reviewedLabel(null)).toBeNull();
		expect(reviewedLabel('not a date')).toBeNull();
	});
});
