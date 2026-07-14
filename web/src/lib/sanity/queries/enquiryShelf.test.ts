import { describe, expect, it } from 'vitest';
import { attachEnquiryShelf, resolveEnquiryShelf, toDefaultShelfPartners } from './enquiryShelf';
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
	categorySlug
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

		expect(partners.map((p) => p.discipline)).toEqual(['Mortgage', 'Legal & Tax']);
	});

	it('ignores categories that are not shelf disciplines', () => {
		const partners = toDefaultShelfPartners([WEALTH]);

		expect(partners).toEqual([]);
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

describe('attachEnquiryShelf', () => {
	const overriddenListing = () => ({
		pageType: 'property' as const,
		property: {
			title: 'La Casa Blanca',
			ctas: {
				primaryCtaLabel: 'Send enquiry',
				railGuide: guide('Buying in the Algarve', 'algarve'),
				railPartners: [WEALTH]
			}
		}
	});

	it('resolves the shelf onto the page data', () => {
		const data = attachEnquiryShelf(overriddenListing(), defaults);

		expect(data.shelf.guide?.href).toBe('/guides/algarve');
		expect(data.shelf.partners.map((p) => p.slug)).toEqual(['atlas-bridge']);
	});

	// The overrides are a server-side input to the resolution above. Once it has run, the
	// browser needs the resolved shelf and nothing else — leaving the dereferenced guide and
	// partner documents on `ctas` ships the same picks twice, in the shape nothing renders.
	it('scrubs the raw overrides off the listing it hands back', () => {
		const data = attachEnquiryShelf(overriddenListing(), defaults);

		expect(data.property.ctas).not.toHaveProperty('railGuide');
		expect(data.property.ctas).not.toHaveProperty('railPartners');
	});

	it('leaves the rest of the CTA fields alone', () => {
		const data = attachEnquiryShelf(overriddenListing(), defaults);

		expect(data.property.ctas.primaryCtaLabel).toBe('Send enquiry');
		expect(data.property.title).toBe('La Casa Blanca');
	});

	it('falls back to the country defaults for a listing that overrides nothing', () => {
		const data = attachEnquiryShelf({ property: { ctas: null } }, defaults);

		expect(data.shelf).toEqual(defaults);
	});

	it('reads a unit page through the development context it inherits its CTAs from', () => {
		const data = attachEnquiryShelf(
			{ development: { ctas: { railPartners: [WEALTH] } } },
			defaults
		);

		expect(data.shelf.partners.map((p) => p.slug)).toEqual(['atlas-bridge']);
		expect(data.development.ctas).not.toHaveProperty('railPartners');
	});
});
