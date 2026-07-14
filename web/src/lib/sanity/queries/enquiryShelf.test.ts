import { describe, expect, it } from 'vitest';
import { resolveEnquiryShelf, toDefaultShelfPartners } from './enquiryShelf';
import { EMPTY_ENQUIRY_SHELF, type EnquiryShelf } from '$lib/listing/enquiryShelf';

const guide = (title: string, slug: string) => ({
	_id: `guide.${slug}`,
	title,
	slug
});

const partner = (name: string, slug: string, categorySlug: string, category: string) => ({
	_id: `partner.${slug}`,
	name,
	slug,
	category,
	categorySlug,
	logo: null
});

const MORTGAGE = partner('Foxes Finance', 'foxes-finance', 'mortgage', 'Mortgage');
const CURRENCY = partner('Fiberpay', 'fiberpay', 'currency-exchange', 'Currency Exchange');
const LEGAL = partner('Franke de la Fuente', 'franke', 'legal-tax', 'Legal & Tax');
const WEALTH = partner('Atlas Bridge', 'atlas-bridge', 'wealth-management', 'Wealth Management');

const defaults: EnquiryShelf = {
	guide: {
		title: 'How to Buy Property in Spain as a UK Buyer',
		href: '/guides/buying-property-in-spain-uk-buyers'
	},
	partners: toDefaultShelfPartners([MORTGAGE, CURRENCY, LEGAL])
};

describe('toDefaultShelfPartners', () => {
	it('orders by discipline, not by the order Sanity returned them', () => {
		// Sanity orders by the partner's own `order` field, which knows nothing about the
		// sequence a buyer needs (mortgage → currency → legal).
		const partners = toDefaultShelfPartners([LEGAL, CURRENCY, MORTGAGE]);

		expect(partners.map((p) => p.slug)).toEqual(['foxes-finance', 'fiberpay', 'franke']);
	});

	it('takes one partner per category, never two from the same one', () => {
		const second = partner('Other Broker', 'other-broker', 'mortgage', 'Mortgage');
		const partners = toDefaultShelfPartners([MORTGAGE, second, CURRENCY, LEGAL]);

		expect(partners.map((p) => p.slug)).toEqual(['foxes-finance', 'fiberpay', 'franke']);
	});

	it('skips a category with no partner rather than leaving a hole', () => {
		const partners = toDefaultShelfPartners([MORTGAGE, LEGAL]);

		expect(partners.map((p) => p.category)).toEqual(['Mortgage', 'Legal & Tax']);
	});

	it('ignores categories that are not shelf disciplines', () => {
		const partners = toDefaultShelfPartners([WEALTH]);

		expect(partners).toEqual([]);
	});

	it('routes every partner through a GHI introduction, never to the partner', () => {
		const [first] = toDefaultShelfPartners([MORTGAGE]);

		expect(first.introHref).toBe('/contact?partner=foxes-finance');
	});

	it('drops a partner with no slug', () => {
		const partners = toDefaultShelfPartners([{ ...MORTGAGE, slug: null }]);

		expect(partners).toEqual([]);
	});
});

describe('resolveEnquiryShelf', () => {
	it('uses the country defaults when the listing overrides nothing', () => {
		expect(resolveEnquiryShelf(defaults, null)).toEqual(defaults);
	});

	it('lets a guide override win while keeping the default specialists', () => {
		const shelf = resolveEnquiryShelf(defaults, {
			railGuide: guide('Buying in the Algarve', 'algarve')
		});

		expect(shelf.guide?.href).toBe('/guides/algarve');
		expect(shelf.partners).toEqual(defaults.partners);
	});

	it('lets a specialists override win while keeping the default guide', () => {
		const shelf = resolveEnquiryShelf(defaults, { railPartners: [WEALTH] });

		expect(shelf.guide).toEqual(defaults.guide);
		expect(shelf.partners.map((p) => p.slug)).toEqual(['atlas-bridge']);
	});

	it('keeps the editor’s order for overridden specialists, not the discipline order', () => {
		const shelf = resolveEnquiryShelf(defaults, { railPartners: [LEGAL, MORTGAGE] });

		expect(shelf.partners.map((p) => p.slug)).toEqual(['franke', 'foxes-finance']);
	});

	it('caps overridden specialists at three', () => {
		const shelf = resolveEnquiryShelf(defaults, {
			railPartners: [LEGAL, MORTGAGE, CURRENCY, WEALTH]
		});

		expect(shelf.partners).toHaveLength(3);
	});

	it('falls back to the defaults when an override dereferences to nothing', () => {
		// A reference to a deleted or unpublished document projects as null; the shelf must
		// not go blank because an editor removed the guide it pointed at.
		const shelf = resolveEnquiryShelf(defaults, { railGuide: null, railPartners: [] });

		expect(shelf).toEqual(defaults);
	});

	it('stays empty when neither defaults nor overrides resolve', () => {
		const shelf = resolveEnquiryShelf(EMPTY_ENQUIRY_SHELF, null);

		expect(shelf.guide).toBeNull();
		expect(shelf.partners).toEqual([]);
	});
});
