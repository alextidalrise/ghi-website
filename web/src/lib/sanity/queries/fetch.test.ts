import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mutable stand-ins for the SvelteKit env virtual modules. fetch.ts reads
// `privateEnv.X` at call time, so mutating this object between tests is enough.
// vi.hoisted so the (hoisted) vi.mock factory below can reference it.
const { privateEnv } = vi.hoisted(() => ({
	privateEnv: {} as Record<string, string | undefined>
}));

vi.mock('$env/dynamic/private', () => ({ env: privateEnv }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));
vi.mock('$app/environment', () => ({ dev: false }));

import { withPublicParams } from './fetch';

describe('previewAllListings production hardening', () => {
	beforeEach(() => {
		for (const key of Object.keys(privateEnv)) delete privateEnv[key];
	});

	it('forces previewAll OFF on a Vercel production deployment, even with the flag on', () => {
		privateEnv.VERCEL_ENV = 'production';
		privateEnv.PREVIEW_ALL_LISTINGS = 'true';
		expect(withPublicParams().previewAll).toBe(false);
	});

	it('honours PREVIEW_ALL_LISTINGS=true when not a production deployment', () => {
		privateEnv.PREVIEW_ALL_LISTINGS = 'true';
		expect(withPublicParams().previewAll).toBe(true);
	});

	it('honours PREVIEW_ALL_LISTINGS=false', () => {
		privateEnv.PREVIEW_ALL_LISTINGS = 'false';
		expect(withPublicParams().previewAll).toBe(false);
	});
});
