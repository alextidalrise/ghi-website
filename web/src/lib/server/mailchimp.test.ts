import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { privateEnv } = vi.hoisted(() => ({
	privateEnv: {} as Record<string, string | undefined>
}));

vi.mock('$env/dynamic/private', () => ({ env: privateEnv }));

import {
	addMarketTags,
	consentFields,
	memberHash,
	preferencesToken,
	signupTags,
	subscribeToNewsletter,
	verifyPreferencesToken
} from './mailchimp';

const MEMBERS = 'https://us21.api.mailchimp.com/3.0/lists/aud123/members';

function reply(status: number, body: unknown = {}) {
	return new Response(status === 204 ? null : JSON.stringify(body), { status });
}

describe('subscribeToNewsletter', () => {
	const fetchMock = vi.fn();

	beforeEach(() => {
		privateEnv.MAILCHIMP_API_KEY = 'key-us21';
		privateEnv.MAILCHIMP_AUDIENCE_ID = 'aud123';
		fetchMock.mockReset();
		vi.stubGlobal('fetch', fetchMock);
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		for (const key of Object.keys(privateEnv)) delete privateEnv[key];
	});

	it('adds a new address as subscribed, with consent evidence and tags', async () => {
		fetchMock.mockResolvedValueOnce(reply(200));

		const result = await subscribeToNewsletter({
			email: 'a@example.com',
			source: 'newsletter-page',
			ip: '203.0.113.9',
			markets: ['spain', 'uae'],
			campaign: 'autumn'
		});

		expect(result).toEqual({ ok: true });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe(MEMBERS);
		const body = JSON.parse(init.body);
		expect(body).toMatchObject({
			email_address: 'a@example.com',
			status: 'subscribed',
			ip_signup: '203.0.113.9',
			tags: ['Source: Newsletter page', 'Market: spain', 'Market: uae', 'Campaign: autumn']
		});
		expect(Date.parse(body.timestamp_signup)).not.toBeNaN();
	});

	it('reports 503 and never calls Mailchimp when unconfigured', async () => {
		delete privateEnv.MAILCHIMP_API_KEY;
		const result = await subscribeToNewsletter({ email: 'a@example.com', source: 'footer' });
		expect(result).toMatchObject({ ok: false, status: 503 });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('treats an existing member as success, tags them, and promotes a pending one', async () => {
		fetchMock
			.mockResolvedValueOnce(reply(400, { title: 'Member Exists' }))
			.mockResolvedValueOnce(reply(204))
			.mockResolvedValueOnce(reply(200, { status: 'pending' }))
			.mockResolvedValueOnce(reply(200));

		const result = await subscribeToNewsletter({
			email: 'A@Example.com',
			source: 'footer',
			markets: ['portugal']
		});

		expect(result).toEqual({ ok: true });
		const memberUrl = `${MEMBERS}/${memberHash('a@example.com')}`;
		expect(fetchMock.mock.calls[1][0]).toBe(`${memberUrl}/tags`);
		expect(JSON.parse(fetchMock.mock.calls[1][1].body).tags).toEqual([
			{ name: 'Source: Footer', status: 'active' },
			{ name: 'Market: portugal', status: 'active' }
		]);
		expect(fetchMock.mock.calls[3][0]).toBe(memberUrl);
		expect(fetchMock.mock.calls[3][1].method).toBe('PATCH');
		expect(JSON.parse(fetchMock.mock.calls[3][1].body).status).toBe('subscribed');
	});

	it('never resubscribes someone who unsubscribed', async () => {
		fetchMock
			.mockResolvedValueOnce(reply(400, { title: 'Member Exists' }))
			.mockResolvedValueOnce(reply(204))
			.mockResolvedValueOnce(reply(200, { status: 'unsubscribed' }));

		const result = await subscribeToNewsletter({ email: 'a@example.com', source: 'footer' });

		expect(result).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false);
	});

	it("asks the visitor to check an address Mailchimp says is fake", async () => {
		fetchMock.mockResolvedValueOnce(
			reply(400, { title: 'Invalid Resource', detail: 'test@test.com looks fake or invalid, please enter a real email address.' })
		);
		const result = await subscribeToNewsletter({ email: 'test@test.com', source: 'footer' });
		expect(result).toMatchObject({ ok: false, status: 422 });
	});

	it('asks the visitor to check their address when Mailchimp names the email field', async () => {
		fetchMock.mockResolvedValueOnce(
			reply(400, { title: 'Invalid Resource', errors: [{ field: 'email_address', message: 'bad' }] })
		);
		const result = await subscribeToNewsletter({ email: 'a@example.com', source: 'footer' });
		expect(result).toMatchObject({ ok: false, status: 422 });
	});

	it('never blames the address for a field the visitor did not type', async () => {
		fetchMock.mockResolvedValueOnce(
			reply(400, { title: 'Invalid Resource', errors: [{ field: 'tags', message: 'bad' }] })
		);
		const result = await subscribeToNewsletter({ email: 'a@example.com', source: 'footer' });
		expect(result).toMatchObject({ ok: false, status: 502 });
	});

	it('retries without a consent field Mailchimp refuses, and signs the visitor up', async () => {
		fetchMock
			.mockResolvedValueOnce(
				reply(400, {
					title: 'Invalid Resource',
					errors: [{ field: 'ip_signup', message: 'Please enter a valid IP address' }]
				})
			)
			.mockResolvedValueOnce(reply(200));

		const result = await subscribeToNewsletter({
			email: 'a@example.com',
			source: 'newsletter-page',
			ip: '2a02:c7c:1234::1'
		});

		expect(result).toEqual({ ok: true });
		const first = JSON.parse(fetchMock.mock.calls[0][1].body);
		const second = JSON.parse(fetchMock.mock.calls[1][1].body);
		expect(first.ip_signup).toBe('2a02:c7c:1234::1');
		expect(second).not.toHaveProperty('ip_signup');
		expect(second).toHaveProperty('timestamp_signup');
	});

	it('maps other failures to a 502', async () => {
		fetchMock.mockResolvedValueOnce(reply(500, { title: 'Internal' }));
		const result = await subscribeToNewsletter({ email: 'a@example.com', source: 'footer' });
		expect(result).toMatchObject({ ok: false, status: 502 });
	});
});

describe('signupTags', () => {
	it('always carries the source, and only the extras it was given', () => {
		expect(signupTags({ email: 'a@example.com', source: 'footer' })).toEqual(['Source: Footer']);
	});
});

describe('preferences token', () => {
	beforeEach(() => {
		privateEnv.MAILCHIMP_API_KEY = 'key-us21';
	});
	afterEach(() => {
		for (const key of Object.keys(privateEnv)) delete privateEnv[key];
	});

	it('verifies for the address it was issued to, case-insensitively', () => {
		const token = preferencesToken('A@Example.com', 1_000)!;
		expect(verifyPreferencesToken('a@example.com', token, 2_000)).toBe(true);
	});

	it('rejects another address, a forged signature, and an expired or future token', () => {
		const token = preferencesToken('a@example.com', 1_000)!;
		expect(verifyPreferencesToken('b@example.com', token, 2_000)).toBe(false);
		expect(verifyPreferencesToken('a@example.com', `1000.${'x'.repeat(43)}`, 2_000)).toBe(false);
		expect(verifyPreferencesToken('a@example.com', token, 1_000 + 60 * 60 * 1000 + 1)).toBe(false);
		expect(verifyPreferencesToken('a@example.com', token, 500)).toBe(false);
		expect(verifyPreferencesToken('a@example.com', 'garbage', 2_000)).toBe(false);
	});

	it('issues nothing, and verifies nothing, without a key', () => {
		const token = preferencesToken('a@example.com', 1_000)!;
		delete privateEnv.MAILCHIMP_API_KEY;
		expect(preferencesToken('a@example.com')).toBeNull();
		expect(verifyPreferencesToken('a@example.com', token, 2_000)).toBe(false);
	});
});

describe('addMarketTags', () => {
	const fetchMock = vi.fn();

	beforeEach(() => {
		privateEnv.MAILCHIMP_API_KEY = 'key-us21';
		privateEnv.MAILCHIMP_AUDIENCE_ID = 'aud123';
		fetchMock.mockReset();
		vi.stubGlobal('fetch', fetchMock);
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		for (const key of Object.keys(privateEnv)) delete privateEnv[key];
	});

	it('tags the member with each market', async () => {
		fetchMock.mockResolvedValueOnce(reply(204));
		expect(await addMarketTags('a@example.com', ['spain', 'uae'])).toEqual({ ok: true });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe(`${MEMBERS}/${memberHash('a@example.com')}/tags`);
		expect(JSON.parse(init.body).tags).toEqual([
			{ name: 'Market: spain', status: 'active' },
			{ name: 'Market: uae', status: 'active' }
		]);
	});

	it('skips the call when nothing was chosen', async () => {
		expect(await addMarketTags('a@example.com', [])).toEqual({ ok: true });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('treats an unknown member as success, and other failures as a 502', async () => {
		fetchMock.mockResolvedValueOnce(reply(404, {}));
		expect(await addMarketTags('a@example.com', ['spain'])).toEqual({ ok: true });
		fetchMock.mockResolvedValueOnce(reply(500, {}));
		expect(await addMarketTags('a@example.com', ['spain'])).toMatchObject({ ok: false, status: 502 });
	});
});

describe('consentFields', () => {
	it("uses Mailchimp's own timestamp shape and unwraps IPv4-mapped addresses", () => {
		const now = new Date('2026-09-23T09:14:02.345Z');
		expect(consentFields('::ffff:203.0.113.9', now)).toEqual({
			ip_signup: '203.0.113.9',
			timestamp_signup: '2026-09-23T09:14:02+00:00'
		});
		expect(consentFields(null, now)).toEqual({ timestamp_signup: '2026-09-23T09:14:02+00:00' });
	});
});
