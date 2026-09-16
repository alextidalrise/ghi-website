import { describe, expect, it } from 'vitest';
import { attachEnquiryShelf, resolveEnquiryShelf, toDefaultShelfPartners } from './enquiryShelf';
import { EMPTY_ENQUIRY_SHELF, type EnquiryShelf } from '$lib/listing/enquiryShelf';

const guide = (title: string, slug: string) => ({
	_id: `guide.${slug}`,
	title,
	slug
});

const partner = (
	name: string,
	slug: string,
	categories: Array<[slug: string, name: string, priority?: number]>
) => ({
	_id: `partner.${slug}`,
	name,
	slug,
	categories: categories.map(([, categoryName]) => categoryName),
	categorySlugs: categories.map(([categorySlug]) => categorySlug),
	// Null is the common case in the data: most categories rely on the code floor
	// (DEFAULT_SHELF_PRIORITY) rather than an authored shelfPriority.
	categoryPriorities: categories.map(([, , priority]) => priority ?? null)
});

const MORTGAGE = partner('Foxes Finance', 'foxes-finance', [['mortgage', 'Mortgage']]);
const CURRENCY = partner('Fiberpay', 'fiberpay', [['currency-exchange', 'Currency Exchange']]);
const LEGAL = partner('Franke de la Fuente', 'franke', [['legal-tax', 'Legal & Tax']]);
const WEALTH = partner('Atlas Bridge', 'atlas-bridge', [['wealth-management', 'Wealth Management']]);
// One firm that covers two shelf disciplines at once.
const MORTGAGE_AND_LEGAL = partner('Dual Advisors', 'dual-advisors', [
	['mortgage', 'Mortgage'],
	['legal-tax', 'Legal & Tax']
]);

const SPAIN = { slug: 'spain', name: 'Spain' };

const defaults: EnquiryShelf = {
	market: SPAIN,
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

		expect(partners.map((p) => p.slug)).toEqual(['foxes-finance', 'franke', 'fiberpay']);
	});

	it('takes one partner per category, never two from the same one', () => {
		const second = partner('Other Broker', 'other-broker', [['mortgage', 'Mortgage']]);
		const partners = toDefaultShelfPartners([MORTGAGE, second, CURRENCY, LEGAL]);

		expect(partners.map((p) => p.slug)).toEqual(['foxes-finance', 'franke', 'fiberpay']);
	});

	it('skips a category with no partner rather than leaving a hole', () => {
		const partners = toDefaultShelfPartners([MORTGAGE, LEGAL]);

		expect(partners.map((p) => p.discipline)).toEqual(['Mortgage', 'Legal & Tax']);
	});

	it('fills a slot from whatever discipline the market actually has', () => {
		// The regression this replaces: the shelf used to accept only mortgage, currency and
		// legal, so a market whose only partner was a wealth manager showed an empty shelf.
		// That is what put every UAE and Montenegro listing on a single row.
		const partners = toDefaultShelfPartners([WEALTH]);

		expect(partners.map((p) => p.slug)).toEqual(['atlas-bridge']);
		expect(partners.map((p) => p.discipline)).toEqual(['Wealth Management']);
	});

	it('ranks a thin market by need, not alphabetically', () => {
		// The live UAE set: a currency/insurance firm and a relocation specialist, neither of
		// which is a mortgage broker or a lawyer. Currency outranks relocation on the code
		// floor; sorted by slug it would have been the other way round.
		const willu = partner('WillU Group', 'willu', [
			['currency-exchange', 'Currency Exchange'],
			['insurance', 'Insurance']
		]);
		const equity = partner('Equity', 'equity', [['relocation-partner', 'Relocation Partner']]);

		const partners = toDefaultShelfPartners([willu, equity]);

		expect(partners.map((p) => p.slug)).toEqual(['willu', 'equity']);
		expect(partners.map((p) => p.discipline)).toEqual(['Currency', 'Relocation Partner']);
	});

	it('lets an authored shelfPriority beat the code floor', () => {
		// Sanity is the control surface: an editor who puts legal ahead of mortgage gets that,
		// without a deploy.
		const legalFirst = partner('Franke de la Fuente', 'franke', [['legal-tax', 'Legal & Tax', 0]]);
		const mortgageSecond = partner('Foxes Finance', 'foxes-finance', [
			['mortgage', 'Mortgage', 1]
		]);

		const partners = toDefaultShelfPartners([mortgageSecond, legalFirst]);

		expect(partners.map((p) => p.slug)).toEqual(['franke', 'foxes-finance']);
	});

	it('never shows more than three disciplines', () => {
		const partners = toDefaultShelfPartners([MORTGAGE, LEGAL, CURRENCY, WEALTH]);

		expect(partners).toHaveLength(3);
		expect(partners.map((p) => p.slug)).toEqual(['foxes-finance', 'franke', 'fiberpay']);
	});

	it('drops a partner with no slug', () => {
		const partners = toDefaultShelfPartners([{ ...MORTGAGE, slug: null }]);

		expect(partners).toEqual([]);
	});

	it('lets a multi-discipline partner fill a slot, labelled by that slot', () => {
		// Only firm available: it covers mortgage and legal, and has no currency partner beside
		// it. It fills the mortgage slot (the earlier discipline) and the label is the slot's,
		// not its whole list — the legal slot then has no other partner and is skipped.
		const partners = toDefaultShelfPartners([MORTGAGE_AND_LEGAL]);

		expect(partners.map((p) => p.slug)).toEqual(['dual-advisors']);
		expect(partners.map((p) => p.discipline)).toEqual(['Mortgage']);
	});

	it('never places the same firm twice — the next-best partner fills the later slot', () => {
		// Dual Advisors would match both mortgage and legal; it takes mortgage (the earlier one)
		// and Franke, the dedicated legal firm, fills the legal slot rather than a blank row.
		const partners = toDefaultShelfPartners([MORTGAGE_AND_LEGAL, LEGAL]);

		expect(partners.map((p) => p.slug)).toEqual(['dual-advisors', 'franke']);
		expect(partners.map((p) => p.discipline)).toEqual(['Mortgage', 'Legal & Tax']);
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
		expect(shelf.market).toBeNull();
	});

	it('keeps the market through an override — it is the listing’s own country', () => {
		// The market is what the fallback rows name ("a specialist in Montenegro"), so an
		// editor overriding the guide must not cost the shelf its ability to say where it is.
		const shelf = resolveEnquiryShelf(defaults, { railPartners: [WEALTH] });

		expect(shelf.market).toEqual(SPAIN);
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
