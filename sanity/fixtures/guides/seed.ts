#!/usr/bin/env node
/**
 * Seed the two live buying guides (UK + International) into Sanity, so the Guides hub,
 * the long-form guide template (sticky contents rail, callouts, key figures), and the
 * within-category cross-linking render against real content.
 *
 * Content is the editorial copy supplied by GHI (the two "How to buy property in Spain"
 * guides). The UK guide carries a hero image (photo hero); the International guide uses
 * the typographic green hero. Re-running upserts both and removes the earlier `sample-…`
 * placeholders. Safe to remove everything with `--delete`.
 *
 * Requires a write token. Defaults to the `development` dataset (what the web dev
 * server reads — PUBLIC_SANITY_DATASET in web/.env.local).
 *
 * Usage:
 *   pnpm --filter sanity guides:seed            # uses the Sanity CLI auth token
 *   SANITY_API_TOKEN=… pnpm --filter sanity guides:seed
 *   pnpm --filter sanity guides:seed:dry-run
 *   pnpm --filter sanity guides:delete
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

const IMAGE_SOURCE = join(
	__dirname,
	'../../../web/static/design-system/assets/andalucia-golf-villa.png'
);

const IDS = {
	uk: 'guide.spain-uk-buyers',
	intl: 'guide.spain-international-buyers',
	ptUk: 'guide.portugal-uk-buyers',
	ptIntl: 'guide.portugal-international-buyers'
};

// Earlier placeholder guides this seed replaces.
const RETIRED_SAMPLE_IDS = ['guide.sample.spain-uk', 'guide.sample.spain-eu'];

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

// ── Portable-text helpers ────────────────────────────────────────────────────
let counter = 0;
const key = (prefix: string) => `${prefix}${(counter += 1)}`;

function span(text: string, marks: string[] = []) {
	return { _type: 'span' as const, _key: key('s'), marks, text };
}

function block(
	style: string,
	children: ReturnType<typeof span>[],
	opts: { listItem?: 'bullet' | 'number'; markDefs?: Array<Record<string, unknown>> } = {}
) {
	return {
		_type: 'block' as const,
		_key: key('b'),
		style,
		markDefs: opts.markDefs ?? [],
		...(opts.listItem ? { listItem: opts.listItem, level: 1 } : {}),
		children
	};
}

const para = (text: string) => block('normal', [span(text)]);
const h3 = (text: string) => block('h3', [span(text)]);
const h4 = (text: string) => block('h4', [span(text)]);
const bullet = (text: string) => block('normal', [span(text)], { listItem: 'bullet' });

/** A bullet whose opening label is emphasised, e.g. "**D7 visa:** for buyers with…". */
const bulletLead = (lead: string, rest: string) =>
	block('normal', [span(lead, ['strong']), span(rest)], { listItem: 'bullet' });

/** A paragraph with a single inline link. */
function paraWithLink(before: string, linkText: string, href: string, after = '.') {
	const mk = key('lnk');
	return block('normal', [span(before), span(linkText, [mk]), span(after)], {
		markDefs: [{ _type: 'link', _key: mk, href }]
	});
}

function callout(tone: 'note' | 'important', title: string, body: string) {
	return { _type: 'guideCallout', _key: key('co'), tone, title, body };
}

function keyFigures(caption: string, rows: Array<{ label: string; value: string; note?: string }>) {
	return {
		_type: 'guideKeyFigures',
		_key: key('kf'),
		caption,
		rows: rows.map((r) => ({ _key: key('kfr'), ...r }))
	};
}

function heroImage(assetId: string, altText: string) {
	return {
		_type: 'mediaAssetMetadata',
		asset: { _type: 'image' as const, asset: { _type: 'reference' as const, _ref: assetId } },
		altText
	};
}

// ── Shared section content (identical wording between the two guides) ─────────
function costsSection(audience: 'uk' | 'intl') {
	return {
		_type: 'guideSection',
		heading: 'Costs of buying in Spain',
		anchor: { _type: 'slug', current: 'costs' },
		body: [
			para(
				audience === 'uk'
					? 'In addition to the purchase price, budget for the following costs. These are payable on or shortly after completion.'
					: 'In addition to the purchase price, budget for the following costs. These apply equally to all international buyers regardless of nationality.'
			),
			keyFigures('What to budget on top of the purchase price', [
				{
					label: 'Transfer Tax (ITP)',
					value: '7%',
					note: 'Resale properties in Andalusia. The main purchase tax and the largest additional cost.'
				},
				{
					label: 'VAT (IVA) + Stamp Duty (AJD)',
					value: '10% + 1.2%',
					note: 'New-build properties, instead of ITP.'
				},
				{
					label: 'Notary fees',
					value: '0.2%–0.5%',
					note: 'Fixed by Spanish law on a sliding scale.'
				},
				{
					label: 'Land registry fee',
					value: '0.1%–0.25%',
					note: 'To register the title deed in your name.'
				},
				{ label: 'Legal fees', value: '~1% + VAT' },
				{
					label: 'Mortgage costs',
					value: '0%–1% + €300–800',
					note: 'Arrangement fee plus valuation, if financing.'
				}
			]),
			callout(
				'note',
				'Total to budget',
				'For a resale property in Andalusia, allow approximately 8.5% to 9.5% of the purchase price in additional costs. For a new-build property, allow approximately 12% to 13%.\n\nExample: on a €600,000 resale villa in Marbella, budget approximately €54,000 to €57,000 in purchase costs on top of the property price.'
			),
			para(
				"One practical point worth knowing: the Spanish tax authority can challenge a declared purchase price if they consider it below the property's official reference value (valor de referencia). If they do, they may issue a supplementary tax demand based on a higher figure. Your lawyer can check the reference value of a property before exchange to avoid any post-completion surprises."
			)
		]
	};
}

// ── UK guide ──────────────────────────────────────────────────────────────────
function buildUkGuide(assetId: string): IdentifiedSanityDocumentStub {
	return {
		_id: IDS.uk,
		_type: 'guide',
		title: 'How to Buy Property in Spain as a UK Buyer',
		slug: { _type: 'slug', current: 'buying-property-in-spain-uk-buyers' },
		guideCategory: 'buying',
		audienceLabel: 'For UK buyers',
		order: 1,
		tagline:
			'A step-by-step guide to buying golf property on the Costa del Sol, from your first search to completion day.',
		intro:
			'Buying property in Spain as a UK buyer is a straightforward process when you have the right guidance and the right team around you. Spain has well-established legal frameworks for overseas buyers, and thousands of UK nationals purchase successfully each year. The key is understanding each stage before you begin, so there are no surprises along the way.\n\nThis guide covers the full process from start to finish: your NIE number, opening a Spanish bank account, the legal steps, costs to budget for, mortgage options and your ongoing tax obligations as a non-resident property owner in Spain.',
		lastReviewed: '2026-06-01',
		heroImage: heroImage(assetId, 'A golf villa above the fairway on the Costa del Sol at dusk'),
		sections: [
			{
				_type: 'guideSection',
				heading: 'The buying process, step by step',
				anchor: { _type: 'slug', current: 'buying-process' },
				body: [
					h3('Step 1: Research and choose your location'),
					para(
						"The Costa del Sol is home to some of Europe's finest golf destinations, and each one offers a distinct lifestyle and price point. Marbella and the Golf Valley of Nueva Andalucia sit at the premium end, with world-class courses, cosmopolitan dining and some of the most sought-after addresses in Spain. Estepona, on the New Golden Mile, offers excellent value and a growing selection of new-build golf apartments. Sotogrande, near Gibraltar, attracts ultra-premium buyers seeking exclusivity, polo and the world-famous Valderrama course."
					),
					para(
						'Take your time with this stage. Visit the areas, walk the golf courses and understand the communities before committing. The right location depends on your priorities, whether that is rental income, personal use, capital growth or lifestyle.'
					),
					callout(
						'note',
						'Our advice',
						'Spend time on the ground in each area before deciding. Most buyers who rush this stage end up wishing they had looked more broadly. We can arrange introductory visits and guided tours of key communities.'
					),
					h3('Step 2: Get your NIE number'),
					para(
						'The NIE (Numero de Identificacion de Extranjero) is your Spanish tax identification number. It is a legal requirement for any property purchase in Spain; you cannot proceed without one. Your NIE number will appear on every legal and financial document throughout the transaction and your ongoing ownership.'
					),
					para(
						'You can apply at a Spanish Consulate in the UK before you travel, or at a National Police station in Spain in person. Many buyers appoint their Spanish lawyer to obtain the NIE on their behalf via a Power of Attorney, which means you do not need to be physically present in Spain at this stage at all.'
					),
					callout(
						'note',
						'What you need',
						'A completed NIE application form (EX-15), your valid passport and a photocopy, and documentation confirming the reason for the application, such as a property purchase contract or reservation agreement.'
					),
					h3('Step 3: Open a Spanish bank account'),
					para(
						'You will need a Spanish bank account before completion. This is not optional: the final payment at the Notary is typically made by bank draft issued by a Spanish financial institution, not by international wire transfer. Setting up the account in advance ensures this is ready when you need it and avoids any delays at completion.'
					),
					para(
						'Banks typically require a valid passport, proof of address, your NIE number and documentation confirming the purpose of the account. Be prepared to demonstrate the source of your funds, as Spanish banks are required to comply with anti-money laundering regulations, and large property purchase funds will need to be evidenced. Your lawyer can assist with this process and can also open the account on your behalf via Power of Attorney if you are not able to travel to Spain.'
					),
					h3('Step 4: Appoint an independent lawyer'),
					para(
						'Engaging an independent Spanish lawyer is one of the most important steps in the entire process. Your lawyer should be entirely independent from the seller, the developer and the agent. Their role is to protect your interests, and yours alone.'
					),
					para(
						'A good Spanish property lawyer will carry out full due diligence on the property, checking title deeds, planning permissions, building licences, any outstanding debts or charges attached to the property, community fees and land registry status. They will review and negotiate the purchase contracts, guide you through each legal stage and handle completion formalities at the Notary. Legal fees are typically 1% of the purchase price plus VAT, subject to a minimum.'
					),
					para(
						'One important practical point: by appointing your lawyer under a Power of Attorney, they can handle every stage of the transaction on your behalf, including signing contracts and completing at the Notary, without you needing to be physically present in Spain. Many international buyers use this route and it is entirely standard practice.'
					),
					callout(
						'important',
						'Important',
						'Do not use a lawyer recommended or provided by the seller or developer. Their interests may not be aligned with yours. We work with a network of fully independent, English-speaking Spanish property lawyers; see our Partners page for details.'
					),
					h3('Step 5: Make an offer and sign the reservation agreement'),
					para(
						'When you have found a property you wish to purchase, you will make a formal offer through the agent. Once an offer is accepted, a Reservation Agreement (Contrato de Reserva) is signed and a reservation deposit is paid. For golf properties in the mid to upper price range, this is typically between €10,000 and €50,000, or around 1% of the purchase price. This takes the property off the market and gives your lawyer time to carry out due diligence.'
					),
					para(
						'The reservation deposit is deducted from the final purchase price if you proceed to exchange. A well-drafted reservation agreement should include a clause making the deposit refundable if your lawyer discovers a fundamental, unresolvable legal issue with the property during due diligence; your lawyer will advise on the specific terms.'
					),
					callout(
						'note',
						'Timing',
						'Your lawyer should begin due diligence immediately after the reservation is signed. Agree a clear timeline for the next stage, typically 4 to 6 weeks.'
					),
					h3('Step 6: Consider an independent survey'),
					para(
						'Before committing to the full purchase contract, it is worth instructing an independent architect or building surveyor to inspect the property, particularly for resale villas and properties with pools, terracing, or complex landscaping. Unlike the UK, a structural survey is not standard practice in Spain, but it is strongly advisable. A surveyor will assess structural integrity, moisture, roofing, electrical and plumbing systems and the condition of any additional features.'
					),
					para(
						'This step is optional but can identify issues that give you grounds to renegotiate the price or request remediation before exchange. The cost is modest relative to the protection it provides.'
					),
					h3('Step 7: Sign the purchase contract (Contrato de Arras)'),
					para(
						'The Contrato de Arras is the main private purchase contract between buyer and seller. It confirms the agreed price, the payment terms and the completion date. When you sign this contract, you pay a further deposit, typically 10% of the total purchase price, less any reservation deposit already paid.'
					),
					para(
						'This deposit is protected under Spanish law in both directions. If the seller withdraws after signing, they must return double the deposit to the buyer. If the buyer withdraws without legal justification, the deposit is forfeit. This provides strong legal protection for both parties and is a well-established part of the Spanish buying process.'
					),
					callout(
						'important',
						'New builds',
						'For new-build purchases, your lawyer should ensure that all deposit funds are protected by a bank guarantee. This is a legal requirement under Spanish law for off-plan developments. Do not pay deposit money to a developer without this guarantee in place.'
					),
					h3('Step 8: Complete at the Notary'),
					para(
						'Completion takes place at the office of a Spanish Notary (Notaria). This is a formal legal process where the property title is officially transferred from seller to buyer. Both parties must be present in person, or represented by a lawyer holding Power of Attorney. The Notary reads the title deed (Escritura Publica) in full, both parties sign, and the balance of the purchase price is paid by bank draft from your Spanish account.'
					),
					para(
						'Once signed, the Notary issues a copy of the deed and the property is registered in your name at the Land Registry. Your lawyer manages this registration on your behalf. From reservation to completion typically takes 4 to 8 weeks for cash buyers and 8 to 12 weeks if a Spanish mortgage is involved, as lenders require time for valuation and credit assessment.'
					),
					callout(
						'note',
						'On the day',
						'Ensure all funds are in your Spanish account well in advance. Currency exchange rates can have a significant impact on the final cost; we recommend using a specialist currency exchange provider rather than a high-street bank. See our Partners page for recommended providers.'
					)
				]
			},
			costsSection('uk'),
			{
				_type: 'guideSection',
				heading: 'Mortgage options for UK buyers',
				anchor: { _type: 'slug', current: 'mortgages' },
				body: [
					para(
						"UK buyers can access Spanish mortgages from Spanish banks, and in some cases from international lenders who specialise in overseas property. Spanish banks typically offer mortgages to non-residents up to 70% of the property's valuation, meaning you will need at least a 30% deposit plus your buying costs."
					),
					para(
						'Interest rates and terms vary between lenders. Fixed-rate mortgages offer certainty over repayments; variable-rate products are linked to the Euribor rate. A specialist overseas mortgage broker can access multiple lenders and find the most competitive terms for your circumstances.'
					),
					bullet(
						'Mortgage terms are typically available up to 30 years, subject to your age at the end of the term (most lenders cap at age 75).'
					),
					bullet(
						'Spanish mortgages are denominated in euros, so if your income is in sterling, consider the exchange rate risk on monthly repayments.'
					),
					bullet(
						'A mortgage pre-approval in principle, before you begin viewing seriously, gives you confidence on budget and makes your offer more credible to sellers.'
					),
					bullet(
						'Income documentation typically required includes two years of tax returns, three months of payslips and recent bank statements.'
					),
					paraWithLink(
						'We work with specialist overseas mortgage brokers who understand the Spanish market. See our ',
						'Partners page',
						'/partners',
						' for recommended specialists.'
					)
				]
			},
			{
				_type: 'guideSection',
				heading: 'Tax obligations as a property owner',
				anchor: { _type: 'slug', current: 'tax-obligations' },
				body: [
					para(
						'Owning property in Spain as a UK non-resident brings ongoing tax obligations. These are straightforward to manage with the right adviser, but important to understand before you buy.'
					),
					h4('IBI (Spanish council tax)'),
					para(
						"Charged annually by the local municipality. Typically €500 to €3,000 or more per year for golf properties on the Costa del Sol, depending on the property's catastral value. A small annual rubbish collection charge (Basura) is also levied by most municipalities."
					),
					h4('Non-resident income tax (IRNR)'),
					para(
						'Even if you do not rent your property, Spain charges an imputed income tax on non-residents, calculated at 1.1% to 2% of the catastral value annually. If you do rent the property, rental income is taxed at 24% for UK buyers. Following Brexit, UK nationals are classified as non-EU residents and pay the 24% rate, not the 19% rate that applies to EU and EEA residents.'
					),
					h4('Wealth tax (Impuesto de Patrimonio)'),
					para(
						"Wealth tax technically applies in Spain above a threshold of €700,000 per person. However, Andalusia currently applies 100% relief on regional wealth tax, meaning buyers purchasing in Marbella, Estepona or Sotogrande effectively pay nothing under this tax. This reflects Andalusia's policy of attracting international buyers, though it is subject to change and should be confirmed with your tax adviser."
					),
					h4('Capital gains tax on sale'),
					para(
						'When you sell, CGT is charged on any gain at 19% for UK residents. The seller must also pay Plusvalia, a local municipal tax on the increase in land value since the last sale. A 3% retention is withheld from the sale proceeds at completion and paid to the tax authority as an advance against your CGT liability.'
					),
					paraWithLink(
						'Tax law in Spain changes periodically. We strongly recommend engaging a Spanish tax adviser before buying, to understand your full obligations from day one. Our ',
						'Partners page',
						'/partners',
						' lists recommended advisers with experience working with UK buyers.'
					)
				]
			}
		],
		advisorHeading: 'Ready to start your search?',
		advisorBody:
			'Speak to us about buying golf property in Spain. No pressure, no obligation, just straightforward guidance from people who know the market.',
		seo: {
			_type: 'seoFields',
			seoTitle: 'How to Buy Property in Spain as a UK Buyer',
			metaDescription:
				'A step-by-step guide for UK buyers: your NIE, the legal process, costs, Spanish mortgages and tax when buying golf property on the Costa del Sol.',
			noindex: false
		}
	};
}

// ── International guide ─────────────────────────────────────────────────────────
function buildIntlGuide(): IdentifiedSanityDocumentStub {
	return {
		_id: IDS.intl,
		_type: 'guide',
		title: 'How to Buy Property in Spain as an International Buyer',
		slug: { _type: 'slug', current: 'buying-property-in-spain-international-buyers' },
		guideCategory: 'buying',
		audienceLabel: 'For international buyers',
		order: 2,
		tagline:
			'A step-by-step guide to buying golf property on the Costa del Sol, wherever in the world you are based.',
		intro:
			'Spain welcomes buyers from across the world, and the legal framework for overseas property purchases is well-established, transparent and widely used. Buyers from Europe, the Americas, the Middle East and beyond purchase property in Spain successfully every year. The process is the same regardless of nationality, though your tax obligations and residency options will vary depending on where you are based.\n\nThis guide covers the full buying process from start to finish: your NIE number, opening a Spanish bank account, the legal steps, costs to budget for, mortgage options and your ongoing tax obligations as a non-resident property owner in Spain. Where tax treatment differs between EU and non-EU buyers, this is noted clearly.',
		lastReviewed: '2026-06-01',
		sections: [
			{
				_type: 'guideSection',
				heading: 'The buying process, step by step',
				anchor: { _type: 'slug', current: 'buying-process' },
				body: [
					h3('Step 1: Research and choose your location'),
					para(
						"The Costa del Sol is home to some of Europe's finest golf destinations, and each one offers a distinct lifestyle and price point. Marbella and the Golf Valley of Nueva Andalucia sit at the premium end, with world-class courses, cosmopolitan dining and some of the most sought-after addresses in Spain. Estepona, on the New Golden Mile, offers excellent value and a growing selection of new-build golf apartments. Sotogrande, near Gibraltar, attracts ultra-premium buyers seeking exclusivity, polo and the world-famous Valderrama course."
					),
					para(
						'Take your time with this stage. Visit the areas, walk the golf courses and understand the communities before committing. The right location depends on your priorities, whether that is rental income, personal use, capital growth or lifestyle.'
					),
					callout(
						'note',
						'Our advice',
						'Spend time on the ground in each area before deciding. Most buyers who rush this stage end up wishing they had looked more broadly. We can arrange introductory visits and guided tours of key communities.'
					),
					h3('Step 2: Get your NIE number'),
					para(
						'The NIE (Numero de Identificacion de Extranjero) is your Spanish tax identification number. It is a legal requirement for any property purchase in Spain; you cannot proceed without one. Your NIE number will appear on every legal and financial document throughout the transaction and your ongoing ownership.'
					),
					para(
						'You can apply at a Spanish Consulate in your home country, or at a National Police station in Spain in person. Many buyers appoint their Spanish lawyer to obtain the NIE on their behalf via a Power of Attorney, which means you do not need to be physically present in Spain at this stage at all.'
					),
					callout(
						'note',
						'What you need',
						'A completed NIE application form (EX-15), your valid passport and a photocopy, and documentation confirming the reason for the application, such as a property purchase contract or reservation agreement.'
					),
					h3('Step 3: Open a Spanish bank account'),
					para(
						'You will need a Spanish bank account before completion. This is not optional: the final payment at the Notary is typically made by bank draft issued by a Spanish financial institution, not by international wire transfer. Setting up the account in advance ensures this is ready when you need it and avoids any delays at completion.'
					),
					para(
						'Banks typically require a valid passport, proof of address, your NIE number and documentation confirming the purpose of the account. Be prepared to demonstrate the source of your funds, as Spanish banks are required to comply with anti-money laundering regulations, and large property purchase funds will need to be evidenced. Your lawyer can assist with this process and can also open the account on your behalf via Power of Attorney if you are not able to travel to Spain.'
					),
					h3('Step 4: Appoint an independent lawyer'),
					para(
						'Engaging an independent Spanish lawyer is one of the most important steps in the entire process. Your lawyer should be entirely independent from the seller, the developer and the agent. Their role is to protect your interests, and yours alone.'
					),
					para(
						'A good Spanish property lawyer will carry out full due diligence on the property, checking title deeds, planning permissions, building licences, any outstanding debts or charges attached to the property, community fees and land registry status. They will review and negotiate the purchase contracts, guide you through each legal stage and handle completion formalities at the Notary. Legal fees are typically 1% of the purchase price plus VAT, subject to a minimum.'
					),
					para(
						'One important practical point: by appointing your lawyer under a Power of Attorney, they can handle every stage of the transaction on your behalf, including signing contracts and completing at the Notary, without you needing to be physically present in Spain. Many international buyers use this route and it is entirely standard practice.'
					),
					callout(
						'important',
						'Important',
						'Do not use a lawyer recommended or provided by the seller or developer. Their interests may not be aligned with yours. We work with a network of fully independent, multilingual Spanish property lawyers; see our Partners page for details.'
					),
					h3('Step 5: Make an offer and sign the reservation agreement'),
					para(
						'When you have found a property you wish to purchase, you will make a formal offer through the agent. Once an offer is accepted, a Reservation Agreement (Contrato de Reserva) is signed and a reservation deposit is paid. For golf properties in the mid to upper price range, this is typically between €10,000 and €50,000, or around 1% of the purchase price. This takes the property off the market and gives your lawyer time to carry out due diligence.'
					),
					para(
						'The reservation deposit is deducted from the final purchase price if you proceed to exchange. A well-drafted reservation agreement should include a clause making the deposit refundable if your lawyer discovers a fundamental, unresolvable legal issue with the property during due diligence; your lawyer will advise on the specific terms.'
					),
					callout(
						'note',
						'Timing',
						'Your lawyer should begin due diligence immediately after the reservation is signed. Agree a clear timeline for the next stage, typically 4 to 6 weeks.'
					),
					h3('Step 6: Consider an independent survey'),
					para(
						'Before committing to the full purchase contract, it is worth instructing an independent architect or building surveyor to inspect the property, particularly for resale villas and properties with pools, terracing, or complex landscaping. Unlike many countries, a structural survey is not standard practice in Spain, but it is strongly advisable. A surveyor will assess structural integrity, moisture, roofing, electrical and plumbing systems and the condition of any additional features.'
					),
					para(
						'This step is optional but can identify issues that give you grounds to renegotiate the price or request remediation before exchange. The cost is modest relative to the protection it provides.'
					),
					h3('Step 7: Sign the purchase contract (Contrato de Arras)'),
					para(
						'The Contrato de Arras is the main private purchase contract between buyer and seller. It confirms the agreed price, the payment terms and the completion date. When you sign this contract, you pay a further deposit, typically 10% of the total purchase price, less any reservation deposit already paid.'
					),
					para(
						'This deposit is protected under Spanish law in both directions. If the seller withdraws after signing, they must return double the deposit to the buyer. If the buyer withdraws without legal justification, the deposit is forfeit. This provides strong legal protection for both parties and is a well-established part of the Spanish buying process.'
					),
					callout(
						'important',
						'New builds',
						'For new-build purchases, your lawyer should ensure that all deposit funds are protected by a bank guarantee. This is a legal requirement under Spanish law for off-plan developments. Do not pay deposit money to a developer without this guarantee in place.'
					),
					h3('Step 8: Complete at the Notary'),
					para(
						'Completion takes place at the office of a Spanish Notary (Notaria). This is a formal legal process where the property title is officially transferred from seller to buyer. Both parties must be present in person, or represented by a lawyer holding Power of Attorney. The Notary reads the title deed (Escritura Publica) in full, both parties sign, and the balance of the purchase price is paid by bank draft from your Spanish account.'
					),
					para(
						'Once signed, the Notary issues a copy of the deed and the property is registered in your name at the Land Registry. Your lawyer manages this registration on your behalf. From reservation to completion typically takes 4 to 8 weeks for cash buyers and 8 to 12 weeks if a Spanish mortgage is involved, as lenders require time for valuation and credit assessment.'
					),
					callout(
						'note',
						'On the day',
						'Ensure all funds are in your Spanish account well in advance. Currency exchange rates can have a significant impact on the final cost; we recommend using a specialist currency exchange provider rather than a high-street bank. See our Partners page for recommended providers.'
					)
				]
			},
			costsSection('intl'),
			{
				_type: 'guideSection',
				heading: 'Mortgage options for international buyers',
				anchor: { _type: 'slug', current: 'mortgages' },
				body: [
					para(
						"International buyers can access Spanish mortgages from Spanish banks, and in some cases from international lenders who specialise in overseas property. Spanish banks typically offer mortgages to non-residents up to 70% of the property's valuation, meaning you will need at least a 30% deposit plus your buying costs."
					),
					para(
						'Interest rates and terms vary between lenders. Fixed-rate mortgages offer certainty over repayments; variable-rate products are linked to the Euribor rate. A specialist overseas mortgage broker can access multiple lenders and find the most competitive terms for your circumstances.'
					),
					bullet(
						'Mortgage terms are typically available up to 30 years, subject to your age at the end of the term (most lenders cap at age 75).'
					),
					bullet(
						'Spanish mortgages are denominated in euros. If your income is in a different currency, consider the exchange rate risk on monthly repayments.'
					),
					bullet(
						'A mortgage pre-approval in principle, before you begin viewing seriously, gives you confidence on budget and makes your offer more credible to sellers.'
					),
					bullet(
						'Income documentation typically required includes two years of tax returns, three months of payslips and recent bank statements. Non-EU buyers may be asked for additional documentation.'
					),
					paraWithLink(
						'We work with specialist overseas mortgage brokers who understand the Spanish market and have experience working with buyers from a wide range of countries. See our ',
						'Partners page',
						'/partners',
						' for recommended specialists.'
					)
				]
			},
			{
				_type: 'guideSection',
				heading: 'Tax obligations as a property owner',
				anchor: { _type: 'slug', current: 'tax-obligations' },
				body: [
					para(
						'Owning property in Spain as a non-resident brings ongoing tax obligations. Your exact position will depend on your country of residence, so it is important to take advice from a Spanish tax specialist before you buy. The following is a general overview.'
					),
					h4('IBI (Spanish council tax)'),
					para(
						"Charged annually by the local municipality. Typically €500 to €3,000 or more per year for golf properties on the Costa del Sol, depending on the property's catastral value. A small annual rubbish collection charge (Basura) is also levied by most municipalities. This applies equally to all property owners regardless of nationality."
					),
					h4('Non-resident income tax (IRNR)'),
					para(
						'Even if you do not rent your property, Spain charges an imputed income tax on non-residents, calculated at 1.1% to 2% of the catastral value annually. If you do rent the property, rental income is subject to tax in Spain, and the rate depends on your residency status.'
					),
					bullet('EU and EEA residents: 19% on rental income, with the ability to deduct eligible expenses.'),
					bullet(
						"Non-EU residents (including buyers from the Americas, Middle East, Asia and other regions): 24% on rental income. Deductibility of expenses may be more limited depending on your country's tax treaty with Spain."
					),
					para(
						'Spain has double taxation treaties with many countries, which may reduce or eliminate the risk of being taxed twice on the same income. Your tax adviser can confirm the position for your specific country of residence.'
					),
					h4('Wealth tax (Impuesto de Patrimonio)'),
					para(
						"Wealth tax technically applies in Spain above a threshold of €700,000 per person on Spanish assets. However, Andalusia currently applies 100% relief on regional wealth tax, meaning buyers purchasing in Marbella, Estepona or Sotogrande effectively pay nothing under this tax. This reflects Andalusia's deliberate policy of attracting international investment, though it is subject to change and should be confirmed with your tax adviser."
					),
					h4('Capital gains tax on sale'),
					para(
						'When you sell, capital gains tax is charged on any profit at 19% for both EU and non-EU residents. The seller must also pay Plusvalia, a local municipal tax on the increase in land value since the last sale. A 3% retention is withheld from the sale proceeds at completion and paid to the tax authority as an advance against your liability.'
					),
					paraWithLink(
						'Tax law in Spain changes periodically, and the rules for non-residents are subject to EU regulatory oversight as well as bilateral tax treaties. We strongly recommend engaging a Spanish tax adviser before buying, one with experience working with buyers from your country of residence. Our ',
						'Partners page',
						'/partners',
						' lists recommended advisers.'
					)
				]
			},
			{
				_type: 'guideSection',
				heading: 'A note on residency',
				anchor: { _type: 'slug', current: 'residency' },
				body: [
					para(
						'Purchasing property in Spain does not automatically grant you the right to live there. EU citizens can reside in Spain freely under freedom of movement. Buyers from outside the EU will need to apply for an appropriate visa or permit if they intend to spend significant time in the country.'
					),
					para(
						'The Spanish Golden Visa programme, which previously granted residency in exchange for a property investment of €500,000 or more, was abolished in 2025. Non-EU buyers wishing to establish residency in Spain should speak to a specialist immigration lawyer about the options currently available, which include the Non-Lucrative Visa for those with sufficient passive income, the Digital Nomad Visa for remote workers, and business or entrepreneur routes for those investing in the Spanish economy.'
					),
					para(
						'Our legal partners can advise on residency options as part of the broader purchase and relocation process.'
					)
				]
			}
		],
		advisorHeading: 'Ready to start your search?',
		advisorBody:
			'Speak to us about buying golf property in Spain. No pressure, no obligation, just straightforward guidance from people who know the market.',
		seo: {
			_type: 'seoFields',
			seoTitle: 'How to Buy Property in Spain as an International Buyer',
			metaDescription:
				'A step-by-step guide for international buyers: the NIE, legal process, costs, mortgages, tax (EU vs non-EU) and residency when buying golf property in Spain.',
			noindex: false
		}
	};
}

// ── Portugal shared costs section ───────────────────────────────────────────────
function ptCostsSection(audience: 'uk' | 'intl') {
	return {
		_type: 'guideSection',
		heading: 'Costs of buying in Portugal',
		anchor: { _type: 'slug', current: 'costs' },
		body: [
			para(
				audience === 'uk'
					? "In addition to the purchase price, budget for the following costs. Portugal's purchase tax structure differs from Spain's: the main transfer tax (IMT) uses a progressive scale rather than a flat rate."
					: 'In addition to the purchase price, budget for the following costs. These apply equally to all international buyers regardless of nationality.'
			),
			keyFigures('What to budget on top of the purchase price', [
				{
					label: 'IMT (property transfer tax)',
					value: '1%–7.5%',
					note: 'Progressive, on resale at holiday-home rates. A flat 6% for values €661,000–€1,150,000, and 7.5% above.'
				},
				{
					label: 'Stamp duty (Imposto de Selo)',
					value: '0.8%',
					note: 'Flat, on all property transactions.'
				},
				{
					label: 'VAT (IVA) on new builds',
					value: 'In lieu of IMT',
					note: "New builds from a developer, usually within the quoted price."
				},
				{ label: 'Notary & land registry', value: '~1%' },
				{ label: 'Legal fees', value: '0.5%–1% + VAT' },
				{
					label: 'Mortgage stamp duty',
					value: '0.6%',
					note: 'On the loan, if financing (0.5% for loans under 5 years).'
				}
			]),
			callout(
				'note',
				'Total to budget',
				'For most resale transactions in Portugal, allow 7% to 9% of the purchase price in additional costs. For premium Algarve properties above €1,000,000, the IMT rate increases and total costs can reach 9% to 10%.\n\nExample: on a €900,000 villa in Quinta do Lago, budget approximately €65,000 to €80,000 in purchase costs on top of the property price.'
			),
			para(
				audience === 'uk'
					? "IMT is calculated on whichever is higher: the declared purchase price or the property's official fiscal value (VPT). Where market values significantly exceed fiscal values, as is common in the Golden Triangle, the declared price typically governs. Your lawyer can confirm the position on any specific property."
					: "IMT is calculated on whichever is higher: the declared purchase price or the property's official fiscal value (VPT). Your lawyer can confirm the position on any specific property before exchange."
			)
		]
	};
}

// ── Portugal buying process (8 steps), shared with audience-specific wording ────
function ptBuyingProcessSection(audience: 'uk' | 'intl') {
	const flights =
		audience === 'uk'
			? 'over 300 days of sunshine per year, direct flights from the UK and a well-established community of international buyers.'
			: 'over 300 days of sunshine per year, excellent international flight connections and a well-established community of international buyers from across Europe, the Americas and beyond.';
	const nifRoute =
		audience === 'uk'
			? 'For UK buyers who are not yet resident in Portugal, the lawyer route is the most practical; they can obtain your NIF while you remain in the UK, saving a trip purely for administrative purposes.'
			: 'For buyers travelling from outside Europe, the lawyer route is the most practical; they can obtain your NIF while you remain in your home country, avoiding a dedicated trip for administrative purposes alone.';
	const lawyerLanguage = audience === 'uk' ? 'English-speaking' : 'multilingual';

	return {
		_type: 'guideSection',
		heading: 'The buying process, step by step',
		anchor: { _type: 'slug', current: 'buying-process' },
		body: [
			h3('Step 1: Research and choose your location'),
			para(
				"Portugal offers a range of exceptional golf destinations, each with its own character and appeal. The Algarve is Europe's premier golf destination, home to the Golden Triangle of Quinta do Lago, Vale do Lobo and Vilamoura, which together represent some of the finest golf resort living in the world. The region benefits from " +
					flights
			),
			para(
				'Comporta, north of the Algarve on the Atlantic coast, is an emerging luxury destination attracting buyers who want unspoilt nature, restricted development and a quieter, more private lifestyle. Cascais, on the Lisbon Riviera, appeals to buyers who want proximity to a major European capital, international schools and year-round urban amenities alongside excellent golf at courses including Oitavos Dunes.'
			),
			para(
				'Take time to visit each area before deciding. The Algarve and Cascais serve different lifestyles, and understanding which suits you is worth the investment of time early in the process.'
			),
			callout(
				'note',
				'Our advice',
				'The Golden Triangle (Quinta do Lago, Vale do Lobo and Vilamoura) is a tightly defined luxury market with limited supply and consistent demand. Properties here rarely need to be marketed hard. Engaging a specialist early gives you access to the best opportunities before they are widely listed.'
			),
			h3('Step 2: Get your NIF number'),
			para(
				audience === 'uk'
					? 'The NIF (Numero de Identificacao Fiscal) is your Portuguese tax identification number, the equivalent of the NIE in Spain. It is required for all financial transactions in Portugal, including purchasing property, opening a bank account, paying taxes and setting up utilities. You cannot proceed with a purchase without one.'
					: 'The NIF (Numero de Identificacao Fiscal) is your Portuguese tax identification number. It is required for all financial transactions in Portugal: purchasing property, opening a bank account, paying taxes and setting up utilities. You cannot proceed with a purchase without one.'
			),
			para(
				'You can obtain your NIF in person at a Portuguese tax office (Financas) with your passport and proof of address, or through a Portuguese lawyer acting on your behalf via Power of Attorney. ' +
					nifRoute
			),
			callout(
				'note',
				'What you need',
				'Valid passport, proof of address from your home country (a recent utility bill or bank statement), and if applying via a lawyer, a Power of Attorney document. Processing is typically straightforward, often completed same day when done in person.'
			),
			h3('Step 3: Open a Portuguese bank account'),
			para(
				'A Portuguese bank account is required before completion. Property taxes, legal fees and the balance of the purchase price must be paid from a Portuguese account, and ongoing costs including IMI (council tax) and utility bills are most reliably managed by direct debit from a local account.'
			),
			para(
				"Most Portuguese banks offer non-resident accounts to international buyers. You will need your NIF number, passport, proof of address and documentation confirming the purpose of the account. Anti-money laundering regulations require you to evidence the source of funds, particularly relevant for purchases in the Algarve's premium golf resorts where transaction values are high. Your lawyer can assist with account opening and can also do so on your behalf via Power of Attorney."
			),
			h3('Step 4: Appoint an independent lawyer'),
			para(
				"Appointing an independent Portuguese property lawyer is essential. In Portugal, the Notary's role at completion is to witness and certify the transaction, not to carry out legal due diligence on your behalf. All due diligence is your lawyer's responsibility, and without it you are exposed."
			),
			para(
				"Your lawyer will check the land registry (Conservatoria do Registo Predial) to confirm clean title and the absence of mortgages, charges or encumbrances. They will verify the property's fiscal record at the tax authority (Financas), check building licences and habitation permits, confirm planning compliance, and ensure community fees and IMI are fully paid up to date. They will review and negotiate all contracts and manage the completion process at the Notary."
			),
			para(
				'By appointing your lawyer under a Power of Attorney, they can manage every stage of the transaction on your behalf, including signing contracts and completing at the Notary, without you needing to be physically present in Portugal at any point. This is entirely standard practice and widely used by international buyers.'
			),
			callout(
				'important',
				'Important',
				`Ensure your lawyer is entirely independent from the seller, developer and agent. In the Golden Triangle in particular, where developer relationships are close-knit, this independence matters. We work with a network of fully independent, ${lawyerLanguage} Portuguese property lawyers; see our Partners page.`
			),
			h3('Step 5: Make an offer and sign the reservation agreement'),
			para(
				"Once you have identified a property, you will make a formal offer through the agent. When accepted, a Reservation Agreement is signed and a reservation deposit paid, typically around €5,000 to €10,000 for standard properties and higher for premium Algarve properties. This reserves the property and triggers your lawyer's due diligence."
			),
			para(
				'The reservation deposit is refundable if your lawyer identifies a fundamental legal issue with the property during due diligence. Ensure this protection is explicitly stated in the reservation agreement.'
			),
			callout(
				'note',
				'Timing',
				'Due diligence in Portugal typically takes 3 to 6 weeks. Agree a clear timeline with your lawyer at the outset.'
			),
			h3('Step 6: Consider an independent survey'),
			para(
				'Commissioning an independent structural survey is not standard practice in Portugal, but it is strongly advisable, particularly for older properties, resale villas and new builds nearing completion. An architect or building surveyor will assess structural integrity, damp, roofing, electrical and plumbing systems and any snagging issues.'
			),
			para(
				"For new-build properties in the Algarve's golf resorts, a snagging inspection before you accept the keys is especially recommended. Identifying and resolving defects before completion is significantly easier than after."
			),
			h3('Step 7: Sign the promissory contract (CPCV)'),
			para(
				'The CPCV (Contrato-Promessa de Compra e Venda) is the main binding purchase contract in Portugal. It sets out the agreed price, payment terms, completion date and all key conditions of the transaction. On signing, you pay a deposit, typically 10% to 20% of the purchase price, less any reservation deposit already paid.'
			),
			para(
				'The CPCV carries strong legal protection for both parties, the same double-protection structure as the Spanish Contrato de Arras: if the buyer withdraws without legal justification, the deposit is forfeited; if the seller withdraws, they must return double the deposit to the buyer.'
			),
			callout(
				'important',
				'New builds',
				'All stage payments on off-plan purchases must be protected by a bank guarantee or insurance policy provided by the developer. Your lawyer must confirm this is in place before any funds are transferred.'
			),
			h3('Step 8: Complete at the Notary (Escritura)'),
			para(
				'Completion in Portugal takes place at the office of a Notary (Cartorio Notarial). The Notary verifies the identities of all parties, confirms the transaction complies with Portuguese law and witnesses the signing of the final deed (Escritura Publica de Compra e Venda). The balance of the purchase price is paid at this point, along with all applicable taxes and fees.'
			),
			para(
				'Both parties must be present in person or represented by their lawyer via Power of Attorney. Once the deed is signed, ownership transfers immediately. Your lawyer then registers the property in your name at the Land Registry. From reservation to completion typically takes 6 to 10 weeks for cash buyers and 10 to 14 weeks if a Portuguese mortgage is involved.'
			),
			callout(
				'note',
				'On the day',
				'All funds must be in your Portuguese bank account in advance. For large international transfers, use a specialist currency exchange provider rather than a high-street bank; the difference in exchange rates on a six or seven-figure transfer can be material. See our Partners page for recommended providers.'
			)
		]
	};
}

function buildPtUkGuide(): IdentifiedSanityDocumentStub {
	return {
		_id: IDS.ptUk,
		_type: 'guide',
		title: 'How to Buy Property in Portugal as a UK Buyer',
		slug: { _type: 'slug', current: 'buying-property-in-portugal-uk-buyers' },
		guideCategory: 'buying',
		audienceLabel: 'For UK buyers',
		order: 3,
		tagline:
			'A guide to buying golf property in the Algarve, Comporta and Cascais, from your first search to completion day.',
		intro:
			'Portugal is one of the most welcoming countries in Europe for overseas property buyers. There are no restrictions on UK nationals purchasing property, the legal process is clear and well-established, and the country continues to attract significant international investment. Thousands of UK buyers purchase in Portugal successfully every year.\n\nThis guide covers everything you need to know: your NIF number, opening a Portuguese bank account, the legal steps from reservation through to completion, costs to budget for, mortgage options and your ongoing tax obligations as a non-resident property owner. It also addresses one important recent change, the closure of the NHR tax regime, which affects how Portugal is now positioned for UK buyers considering relocation.',
		lastReviewed: '2026-06-01',
		sections: [
			ptBuyingProcessSection('uk'),
			ptCostsSection('uk'),
			{
				_type: 'guideSection',
				heading: 'Mortgage options for UK buyers',
				anchor: { _type: 'slug', current: 'mortgages' },
				body: [
					para(
						"UK buyers can access Portuguese mortgages from Portuguese banks and from specialist international lenders. Portuguese banks typically lend non-residents up to 70% to 80% of the property's valuation, though in practice most non-resident buyers should plan for a 30% deposit plus buying costs."
					),
					para(
						'Interest rates are linked to the Euribor rate for variable products, or fixed for the full term on fixed-rate products. The Portuguese mortgage market stabilised in 2025 following the ECB rate cycle, and fixed rates for non-residents are currently competitive. A specialist overseas mortgage broker can compare lenders and find the best structure for your circumstances.'
					),
					bullet(
						'Mortgage terms are typically available up to 30 years, subject to your age at the end of the term.'
					),
					bullet(
						'Portuguese mortgages are denominated in euros. If your income is in sterling, factor in the exchange rate risk on monthly repayments; this can be hedged using forward contracts through a specialist FX provider.'
					),
					bullet('If using a mortgage, budget for additional mortgage stamp duty of 0.6% on the loan amount.'),
					bullet(
						'Documentation typically required: two years of tax returns, three months of payslips, six to twelve months of bank statements, and confirmation of any existing mortgage or financial commitments.'
					),
					bullet(
						'A mortgage agreement in principle, obtained before you begin viewing seriously, strengthens your position significantly when making an offer.'
					),
					paraWithLink(
						'We work with specialist overseas mortgage brokers with experience in the Portuguese market. See our ',
						'Partners page',
						'/partners',
						' for recommended specialists.'
					)
				]
			},
			{
				_type: 'guideSection',
				heading: 'Tax obligations as a property owner',
				anchor: { _type: 'slug', current: 'tax-obligations' },
				body: [
					para(
						'As a UK non-resident owning property in Portugal, you have a number of ongoing tax obligations. These are manageable with the right adviser but important to understand before you buy.'
					),
					h4('IMI (Portuguese council tax)'),
					para(
						"IMI (Imposto Municipal sobre Imoveis) is Portugal's annual property tax, charged by the local municipality. It is calculated as a percentage of the property's official fiscal value (VPT), not the market value. Rates vary by municipality but typically sit between 0.3% and 0.45% for urban properties. In the Algarve's Golden Triangle, where fiscal values are well below market values, annual IMI bills are often more modest than buyers expect."
					),
					h4('AIMI (additional IMI surcharge)'),
					para(
						'AIMI (Adicional ao IMI) is an additional surcharge that applies to property owners whose Portuguese property holdings exceed €600,000 in total fiscal value. The rate is 1% on the amount above this threshold, or 1.5% above €1,000,000 for individuals. For buyers in Quinta do Lago, Vale do Lobo and comparable premium markets, this surcharge may apply; your tax adviser will calculate your exposure based on the specific fiscal value of the property.'
					),
					h4('Rental income tax'),
					para(
						'If you rent your property, rental income derived in Portugal is subject to Portuguese tax. As a UK non-resident buyer post-Brexit, rental income is taxed at 25%. This applies to gross rental income unless a deduction for expenses is available under the applicable tax treaty between the UK and Portugal. Engaging a Portuguese tax adviser to manage your annual non-resident tax filing is strongly recommended.'
					),
					h4('Capital gains tax on sale'),
					para(
						"When you sell, 50% of any capital gain is subject to Portuguese income tax at the applicable non-resident rate of 28%. The remaining 50% is exempt. This partial exemption makes Portugal's CGT treatment on property relatively favourable by European standards. Reinvestment rules may also apply in certain circumstances; your adviser can confirm."
					),
					paraWithLink(
						'Tax law in Portugal is subject to change. We strongly recommend appointing a ',
						'Portuguese tax adviser',
						'/partners',
						' before completing your purchase, to understand your full obligations and structure your ownership efficiently from day one.'
					)
				]
			},
			{
				_type: 'guideSection',
				heading: 'A note on the NHR tax regime',
				anchor: { _type: 'slug', current: 'nhr' },
				body: [
					para(
						"Portugal's Non-Habitual Resident (NHR) tax regime, long regarded as one of the primary attractions for UK buyers considering relocation, closed to new applicants in 2024 and was fully phased out in March 2025. Many older buying guides and property websites still reference NHR as a current benefit. It is no longer available."
					),
					para(
						'The NHR has been replaced by a new regime called IFICI (also known as NHR 2.0), introduced under the 2025 State Budget. IFICI offers a 20% flat tax rate on eligible Portuguese employment income for up to 10 years, but it is specifically targeted at qualified professionals working in scientific research, technology, innovation and related fields. It is not a general tax incentive for property buyers or retirees, and most UK buyers purchasing a golf property in the Algarve or Cascais will not qualify.'
					),
					para(
						'This is a significant change from the position that attracted many UK buyers to Portugal over the past decade. If favourable tax treatment on relocation was part of your planning, we strongly recommend speaking with a Portuguese tax specialist before proceeding. The landscape has changed materially and the right structure will depend entirely on your individual circumstances.'
					),
					callout(
						'note',
						'If you already hold NHR',
						'If you were already registered as an NHR prior to the closure, your status and benefits remain in place for the remainder of your 10-year period.'
					)
				]
			},
			{
				_type: 'guideSection',
				heading: 'The 90-day rule for UK buyers',
				anchor: { _type: 'slug', current: 'residency' },
				body: [
					para(
						'Buying property in Portugal does not grant you the right to live there. As a UK national post-Brexit, you can spend up to 90 days in Portugal within any 180-day period without a visa. For most holiday-home buyers, this is sufficient.'
					),
					para(
						'If you intend to spend more time in Portugal, whether semi-retiring, relocating or working remotely, you will need to apply for an appropriate visa or residence permit. The most relevant options for UK buyers are:'
					),
					bulletLead(
						'D7 Passive Income Visa',
						': for buyers with sufficient passive income (pensions, dividends, rental income or savings) to support themselves without working in Portugal. The most commonly used route for retirees and those relocating for lifestyle reasons.'
					),
					bulletLead(
						'Digital Nomad Visa',
						': for buyers who work remotely for employers or clients based outside Portugal. Valid for up to 3 years and renewable.'
					),
					bulletLead(
						'D8 Visa (remote work)',
						': a variant of the digital nomad route suited to remote employees of foreign companies.'
					),
					paraWithLink(
						'Residency applications should be handled by a qualified immigration lawyer. Our ',
						'Partners page',
						'/partners',
						' includes recommended specialists who work with UK buyers in Portugal.'
					)
				]
			}
		],
		advisorHeading: 'Ready to start your search?',
		advisorBody:
			'Speak to us about buying golf property in Portugal. No pressure, no obligation, just straightforward guidance from people who know the market.',
		seo: {
			_type: 'seoFields',
			seoTitle: 'How to Buy Property in Portugal as a UK Buyer',
			metaDescription:
				'A step-by-step guide for UK buyers: NIF, the legal process, IMT and costs, mortgages, tax and the 90-day rule when buying golf property in Portugal.',
			noindex: false
		}
	};
}

function buildPtIntlGuide(): IdentifiedSanityDocumentStub {
	return {
		_id: IDS.ptIntl,
		_type: 'guide',
		title: 'How to Buy Property in Portugal as an International Buyer',
		slug: { _type: 'slug', current: 'buying-property-in-portugal-international-buyers' },
		guideCategory: 'buying',
		audienceLabel: 'For international buyers',
		order: 4,
		tagline:
			'A guide to buying golf property in the Algarve, Comporta and Cascais, wherever in the world you are based.',
		intro:
			'Portugal welcomes buyers from across the world. There are no restrictions on foreign nationals purchasing property regardless of nationality, and the legal process is the same for everyone: clear, well-established and widely used by international buyers from Europe, the Americas, the Middle East and beyond.\n\nThis guide covers the full buying process from start to finish: your NIF number, opening a Portuguese bank account, the legal steps from reservation through to completion, costs to budget for, mortgage options and your ongoing tax obligations as a non-resident property owner. Where tax treatment differs between EU and non-EU buyers, this is noted clearly. It also addresses the closure of the NHR tax regime and what has replaced it, an important change that affects how Portugal is positioned for international buyers considering relocation.',
		lastReviewed: '2026-06-01',
		sections: [
			ptBuyingProcessSection('intl'),
			ptCostsSection('intl'),
			{
				_type: 'guideSection',
				heading: 'Mortgage options for international buyers',
				anchor: { _type: 'slug', current: 'mortgages' },
				body: [
					para(
						"International buyers can access Portuguese mortgages from Portuguese banks and from specialist international lenders. Portuguese banks typically lend non-residents up to 70% to 80% of the property's valuation, though most non-resident buyers should plan for a 30% deposit plus buying costs."
					),
					para(
						'Interest rates are linked to Euribor for variable-rate products, or fixed for the full term on fixed-rate mortgages. The Portuguese mortgage market has stabilised in 2025 following the ECB rate cycle, offering competitive conditions for international buyers. A specialist overseas mortgage broker can compare lenders and find the best structure for your circumstances.'
					),
					bullet(
						'Mortgage terms are typically available up to 30 years, subject to your age at the end of the term.'
					),
					bullet(
						'Portuguese mortgages are denominated in euros. If your income is in another currency, factor in the exchange rate risk on monthly repayments; this can be managed using forward contracts through a specialist FX provider.'
					),
					bullet('If using a mortgage, budget for additional mortgage stamp duty of 0.6% on the loan amount.'),
					bullet(
						'Documentation typically required: two years of tax returns, three months of payslips, six to twelve months of bank statements. Non-EU buyers may be asked for additional documentation depending on the lender.'
					),
					bullet(
						'A mortgage agreement in principle, obtained before you begin viewing seriously, strengthens your negotiating position significantly.'
					),
					paraWithLink(
						'We work with specialist overseas mortgage brokers with experience across the Portuguese market and with buyers from a wide range of countries. See our ',
						'Partners page',
						'/partners',
						' for recommended specialists.'
					)
				]
			},
			{
				_type: 'guideSection',
				heading: 'Tax obligations as a property owner',
				anchor: { _type: 'slug', current: 'tax-obligations' },
				body: [
					para(
						'As a non-resident owning property in Portugal, you have a number of ongoing tax obligations. Your exact position will depend on your country of residence and whether a double taxation treaty exists between your country and Portugal. Taking specialist tax advice before you buy is strongly recommended.'
					),
					h4('IMI (Portuguese council tax)'),
					para(
						"IMI (Imposto Municipal sobre Imoveis) is Portugal's annual property tax, charged by the local municipality. It is calculated as a percentage of the property's official fiscal value (VPT), not the market value. Rates vary by municipality but typically sit between 0.3% and 0.45% for urban properties. In the Algarve's Golden Triangle, where fiscal values are well below market values, annual IMI bills are often more modest than buyers expect."
					),
					h4('AIMI (additional IMI surcharge)'),
					para(
						'AIMI (Adicional ao IMI) is an additional surcharge that applies to property owners whose Portuguese property holdings exceed €600,000 in total fiscal value. The rate is 1% on the amount above this threshold, rising to 1.5% above €1,000,000 for individuals. For buyers in Quinta do Lago, Vale do Lobo and comparable premium markets, this surcharge may apply. Your tax adviser will calculate your exposure based on the specific fiscal value of the property.'
					),
					h4('Rental income tax'),
					para(
						'If you rent your property, rental income derived in Portugal is subject to Portuguese tax regardless of your nationality. The rate and the ability to deduct expenses depend on your residency status.'
					),
					bullet(
						'EU and EEA residents: generally taxed at 28% on rental income, with the ability to deduct eligible expenses against gross income.'
					),
					bullet(
						"Non-EU residents (including buyers from the Americas, Middle East, Asia and other regions): taxed at 25% on gross rental income. The ability to deduct expenses may be more limited depending on your country's tax treaty with Portugal."
					),
					para(
						'Portugal has double taxation treaties with many countries, which may reduce or eliminate the risk of being taxed twice on the same income. Your tax adviser can confirm the position for your specific country of residence.'
					),
					h4('Capital gains tax on sale'),
					para(
						"When you sell, 50% of any capital gain is subject to Portuguese income tax at the applicable non-resident rate of 28%. The remaining 50% is exempt. This partial exemption makes Portugal's CGT treatment on property comparatively favourable. Reinvestment rules may apply in certain circumstances; your adviser can confirm the position."
					),
					paraWithLink(
						'Tax law in Portugal is subject to change, and the rules for non-residents are subject to EU regulatory oversight as well as bilateral tax treaties. We strongly recommend appointing a Portuguese tax adviser before completing your purchase. Our ',
						'Partners page',
						'/partners',
						' lists recommended advisers with experience working with international buyers.'
					)
				]
			},
			{
				_type: 'guideSection',
				heading: 'A note on the NHR tax regime',
				anchor: { _type: 'slug', current: 'nhr' },
				body: [
					para(
						"Portugal's Non-Habitual Resident (NHR) tax regime, which for many years offered significant tax advantages to foreign buyers establishing residency in Portugal, closed to new applicants in 2024 and was fully phased out in March 2025. Many property websites and older buying guides still reference NHR as an active benefit. It is no longer available to new applicants."
					),
					para(
						'The NHR has been replaced by IFICI (also known as NHR 2.0), introduced under the 2025 State Budget. IFICI offers a 20% flat tax rate on eligible Portuguese employment income for up to 10 years, but is specifically targeted at qualified professionals working in scientific research, technology, innovation and related fields. It is not a general tax incentive for property buyers or retirees, and most international buyers purchasing a golf property in Portugal will not qualify.'
					),
					para(
						'If favourable tax treatment on relocation was part of your planning, we strongly recommend speaking with a Portuguese tax specialist before proceeding. The landscape has changed materially and the right structure will depend entirely on your individual circumstances.'
					),
					callout(
						'note',
						'If you already hold NHR',
						'If you were already registered as an NHR prior to the closure, your status and benefits remain in place for the remainder of your 10-year period.'
					)
				]
			},
			{
				_type: 'guideSection',
				heading: 'Residency: what international buyers need to know',
				anchor: { _type: 'slug', current: 'residency' },
				body: [
					para(
						'Purchasing property in Portugal does not automatically grant you the right to live there. Your residency rights depend on your nationality.'
					),
					h4('EU and EEA citizens'),
					para(
						'Citizens of EU and EEA member states can reside in Portugal freely under freedom of movement. There is no minimum stay requirement and no visa needed for any length of stay. EU buyers who choose to become tax residents in Portugal simply need to register with the local authorities.'
					),
					h4('Non-EU buyers'),
					para(
						'Buyers from outside the EU, including those from the Americas, Middle East, Asia, Africa and other regions, will need to apply for an appropriate visa or residence permit if they wish to spend significant time in Portugal. The most relevant options are:'
					),
					bulletLead(
						'D7 Passive Income Visa',
						': for buyers with sufficient passive income (pensions, dividends, rental income or savings) to support themselves without working in Portugal. The most commonly used route for retirees and those relocating for lifestyle reasons.'
					),
					bulletLead(
						'Digital Nomad Visa',
						': for buyers who work remotely for employers or clients based outside Portugal. Valid for up to 3 years and renewable.'
					),
					bulletLead(
						'Investment Fund Route',
						': a qualifying investment of €500,000 or more into an approved Portuguese alternative investment fund can provide a pathway to residency and, after five years, permanent residency and eventual citizenship. This route is currently active but under regulatory review; specialist legal advice is essential before proceeding.'
					),
					paraWithLink(
						'Residency applications should be handled by a qualified Portuguese immigration lawyer. Our ',
						'Partners page',
						'/partners',
						' includes recommended specialists who work with international buyers across a range of nationalities.'
					)
				]
			}
		],
		advisorHeading: 'Ready to start your search?',
		advisorBody:
			'Speak to us about buying golf property in Portugal. No pressure, no obligation, just straightforward guidance from people who know the market.',
		seo: {
			_type: 'seoFields',
			seoTitle: 'How to Buy Property in Portugal as an International Buyer',
			metaDescription:
				'A step-by-step guide for international buyers: NIF, the legal process, IMT and costs, mortgages, tax (EU vs non-EU), the NHR change and residency in Portugal.',
			noindex: false
		}
	};
}

async function main() {
	console.log(`Buying guides → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);

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
		const ids = [IDS.uk, IDS.intl, IDS.ptUk, IDS.ptIntl, ...RETIRED_SAMPLE_IDS];
		console.log(`Deleting ${ids.length} guide documents…`);
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

	let assetId = 'image-dry-run';
	if (!dryRun) {
		console.log('Uploading hero image…');
		const asset = await client.assets.upload('image', readFileSync(IMAGE_SOURCE), {
			filename: 'guide-spain-costa-del-sol.png'
		});
		assetId = asset._id;
		console.log(`  uploaded → ${assetId}`);
	}

	const documents: IdentifiedSanityDocumentStub[] = [
		buildUkGuide(assetId),
		buildIntlGuide(),
		buildPtUkGuide(),
		buildPtIntlGuide()
	];

	console.log(`Upserting ${documents.length} guides…`);
	for (const doc of documents) {
		if (dryRun) {
			console.log(`  [dry-run] ${doc._type} ${doc._id} (${(doc as { sections?: unknown[] }).sections?.length ?? 0} sections)`);
			continue;
		}
		await client.createOrReplace(doc);
		console.log(`  ✓ ${doc._type} ${doc._id}`);
	}

	if (!dryRun) {
		console.log('Removing retired sample guides…');
		for (const id of RETIRED_SAMPLE_IDS) {
			await client.delete(id).catch(() => undefined);
			console.log(`  ✓ removed ${id}`);
		}
	}

	console.log('\nView (after `pnpm --filter web dev`):');
	console.log('  Hub:             /guides');
	console.log('  Spain (UK):      /guides/buying-property-in-spain-uk-buyers');
	console.log('  Spain (intl):    /guides/buying-property-in-spain-international-buyers');
	console.log('  Portugal (UK):   /guides/buying-property-in-portugal-uk-buyers');
	console.log('  Portugal (intl): /guides/buying-property-in-portugal-international-buyers');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
