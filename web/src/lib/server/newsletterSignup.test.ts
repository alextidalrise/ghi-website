import { describe, expect, it } from 'vitest';
import { parseNewsletterSignup, sanitizeCampaign, SignupRateLimiter } from './newsletterSignup';

describe('parseNewsletterSignup', () => {
	it('rejects a missing or malformed email', () => {
		expect(parseNewsletterSignup({ email: 'nope' })).toMatchObject({ ok: false });
		expect(parseNewsletterSignup(null)).toMatchObject({ ok: false });
	});

	it('defaults the source to the footer and ignores unknown sources', () => {
		expect(parseNewsletterSignup({ email: 'a@example.com' })).toMatchObject({ source: 'footer' });
		expect(parseNewsletterSignup({ email: 'a@example.com', source: 'admin' })).toMatchObject({
			source: 'footer'
		});
	});

	it('keeps only well-formed, unique market slugs', () => {
		const parsed = parseNewsletterSignup({
			email: 'a@example.com',
			markets: ['spain', 'spain', 'Portugal', 'uae', '<script>', 42, 'costa-del-sol']
		});
		expect(parsed).toMatchObject({ markets: ['spain', 'uae', 'costa-del-sol'] });
	});

	it('flags a filled honeypot as a bot', () => {
		expect(parseNewsletterSignup({ email: 'a@example.com', nl_hp_leave_blank: 'Acme' })).toMatchObject({
			bot: true
		});
		expect(parseNewsletterSignup({ email: 'a@example.com', nl_hp_leave_blank: ' ' })).toMatchObject({
			bot: false
		});
	});
});

describe('sanitizeCampaign', () => {
	it('reduces visitor text to a short slug', () => {
		expect(sanitizeCampaign('Autumn Launch 2026!')).toBe('autumn-launch-2026');
		expect(sanitizeCampaign('x'.repeat(80))).toHaveLength(40);
		expect(sanitizeCampaign('!!!')).toBeNull();
		expect(sanitizeCampaign(undefined)).toBeNull();
	});
});

describe('SignupRateLimiter', () => {
	it('allows a burst up to the limit, then recovers after the window', () => {
		let now = 0;
		const limiter = new SignupRateLimiter(2, 1000, () => now);
		expect(limiter.allow('ip')).toBe(true);
		expect(limiter.allow('ip')).toBe(true);
		expect(limiter.allow('ip')).toBe(false);
		expect(limiter.allow('other')).toBe(true);
		now = 1001;
		expect(limiter.allow('ip')).toBe(true);
	});
});
