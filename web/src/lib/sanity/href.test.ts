import { describe, expect, it } from 'vitest';
import { isInternalHref, withoutCampaignParams } from './href';

describe('isInternalHref', () => {
	it('treats site-relative paths as internal', () => {
		expect(isInternalHref('/contact')).toBe(true);
		expect(isInternalHref('/spain/marbella?community=nueva-andalucia')).toBe(true);
		expect(isInternalHref('#enquiry')).toBe(true);
	});

	it('treats our own absolute URLs as internal, on either host', () => {
		expect(isInternalHref('https://golfhomesinternational.com/contact')).toBe(true);
		expect(isInternalHref('https://www.golfhomesinternational.com/contact')).toBe(true);
		expect(isInternalHref('http://WWW.GolfHomesInternational.com/contact')).toBe(true);
	});

	it('treats other origins as external', () => {
		expect(isInternalHref('https://laquintaresort.com/golf')).toBe(false);
		expect(isInternalHref('//example.com/x')).toBe(false);
	});

	it('is not fooled by our domain appearing in userinfo or a subdomain suffix', () => {
		expect(isInternalHref('https://golfhomesinternational.com@evil.example/x')).toBe(false);
		expect(isInternalHref('https://golfhomesinternational.com.evil.example/x')).toBe(false);
	});

	it('leaves non-http schemes out of scope', () => {
		expect(isInternalHref('mailto:hello@golfhomesinternational.com')).toBe(false);
		expect(isInternalHref('tel:+441234567890')).toBe(false);
	});
});

describe('withoutCampaignParams', () => {
	it('strips utm parameters from an internal link', () => {
		expect(
			withoutCampaignParams('/contact?utm_source=ghi-journal&utm_medium=insight&utm_campaign=nobu')
		).toBe('/contact');
	});

	it('strips them from an absolute internal URL too', () => {
		expect(withoutCampaignParams('https://www.golfhomesinternational.com/contact?utm_source=x')).toBe(
			'https://www.golfhomesinternational.com/contact'
		);
	});

	it('keeps parameters that do real work', () => {
		expect(withoutCampaignParams('/contact?enquiry=selling&utm_source=x')).toBe(
			'/contact?enquiry=selling'
		);
		expect(withoutCampaignParams('/spain?community=nueva-andalucia&gclid=abc')).toBe(
			'/spain?community=nueva-andalucia'
		);
	});

	it('leaves a community nav href exactly as NAV_HREF built it', () => {
		// The header/footer resolve a community reference to this shape in GROQ, and every
		// authored href then passes through here. It must survive untouched — the filter UI,
		// the active-nav check and `safePageLocation`'s allowlist all key off `community`.
		const href = '/spain/marbella?community=nueva-andalucia';
		expect(withoutCampaignParams(href)).toBe(href);
	});

	it('strips ad click identifiers, which are acquisition signals too', () => {
		expect(withoutCampaignParams('/contact?gclid=abc&fbclid=def&gbraid=ghi&_gl=1*x')).toBe(
			'/contact'
		);
	});

	it('preserves the fragment, and ignores a ? that lives inside one', () => {
		expect(withoutCampaignParams('/contact?utm_source=x#enquiry')).toBe('/contact#enquiry');
		expect(withoutCampaignParams('/guides#faq?utm_source=x')).toBe('/guides#faq?utm_source=x');
	});

	it('leaves external links exactly as authored — their tagging is not ours to edit', () => {
		const partner = 'https://fiberpay.com/?utm_source=Nueva+Vida&utm_medium=Referral';
		expect(withoutCampaignParams(partner)).toBe(partner);

		const course = 'https://losnaranjos.com/en/?_gl=1*jlx3jt*_up*MQ..';
		expect(withoutCampaignParams(course)).toBe(course);
	});

	it('returns an already-clean href unchanged, without re-encoding it', () => {
		// URLSearchParams would rewrite the space as '+' and drop the empty value's '=';
		// an untouched href must survive byte-identical.
		const href = '/spain?q=nueva%20andalucia&flag=';
		expect(withoutCampaignParams(href)).toBe(href);
		expect(withoutCampaignParams('/contact')).toBe('/contact');
		expect(withoutCampaignParams('')).toBe('');
	});
});
