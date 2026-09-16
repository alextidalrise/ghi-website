import { describe, expect, it } from 'vitest';
import { marketInProse, marketNames, partnersPath } from './markets';
import { partnerCoverageLabel } from '$lib/partners/partners';

const SPAIN = { slug: 'spain', name: 'Spain', flagUrl: null };
const PORTUGAL = { slug: 'portugal', name: 'Portugal', flagUrl: null };
const UAE = { slug: 'uae', name: 'UAE', flagUrl: null };

describe('marketInProse', () => {
	it('leaves an ordinary country name bare', () => {
		expect(marketInProse('Montenegro')).toBe('Montenegro');
	});

	it('gives initialisms and compound names the article', () => {
		// "3 of 9 disciplines are covered in UAE" is what the first build printed.
		expect(marketInProse('UAE')).toBe('the UAE');
		expect(marketInProse('United Kingdom')).toBe('the United Kingdom');
		expect(marketInProse('Cayman Islands')).toBe('the Cayman Islands');
	});

	it('does not double an article an editor already wrote', () => {
		expect(marketInProse('the Algarve')).toBe('the Algarve');
	});
});

describe('marketNames', () => {
	it('joins with a final "and", in prose form', () => {
		expect(marketNames([SPAIN, PORTUGAL, UAE])).toBe('Spain, Portugal and the UAE');
	});

	it('handles one and none', () => {
		expect(marketNames([SPAIN])).toBe('Spain');
		expect(marketNames([])).toBe('');
	});
});

describe('partnersPath', () => {
	it('deep-links the coverage filter, or the whole directory', () => {
		expect(partnersPath('uae')).toBe('/partners?covering=uae');
		expect(partnersPath()).toBe('/partners');
	});
});

describe('partnerCoverageLabel', () => {
	it('names the markets from the references', () => {
		expect(partnerCoverageLabel({ markets: [SPAIN, PORTUGAL], coverage: '' })).toBe(
			'Spain and Portugal'
		);
	});

	it('keeps real regional detail after the markets', () => {
		expect(partnerCoverageLabel({ markets: [SPAIN], coverage: 'Costa del Sol' })).toBe(
			'Spain — Costa del Sol'
		);
	});

	it('drops a legacy label that only restates the countries', () => {
		// WillU's pre-migration label, which had also drifted out of step with its markets.
		expect(
			partnerCoverageLabel({ markets: [SPAIN, PORTUGAL, UAE], coverage: 'Spain, Portugal & UAE' })
		).toBe('Spain, Portugal and the UAE');
	});

	it('keeps the other markets as "Also …" when the page is filtered to one', () => {
		// On the UAE view WillU must still say it covers Spain and Portugal too.
		expect(
			partnerCoverageLabel({ markets: [SPAIN, PORTUGAL, UAE], coverage: '' }, { activeMarket: 'uae' })
		).toBe('Also Spain and Portugal');
	});

	it('shows only regional detail for a single-market partner on its own filtered view', () => {
		expect(
			partnerCoverageLabel({ markets: [SPAIN], coverage: 'Costa del Sol' }, { activeMarket: 'spain' })
		).toBe('Costa del Sol');
		expect(
			partnerCoverageLabel({ markets: [SPAIN], coverage: 'Spain ' }, { activeMarket: 'spain' })
		).toBe('');
	});
});
