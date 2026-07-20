import { describe, expect, it } from 'vitest';
import { isInternalRoute, resolveAnalyticsConfig, type AnalyticsConfigInput } from './config';

/** A request that would resolve to `live`; each test perturbs one field. */
function liveInput(overrides: Partial<AnalyticsConfigInput> = {}): AnalyticsConfigInput {
	return {
		enabledFlag: 'true',
		gtmId: 'GTM-5KWMLHJP',
		hostname: 'golfhomesinternational.com',
		isDev: false,
		isPreview: false,
		routeId: '/',
		debugGranted: false,
		...overrides
	};
}

describe('resolveAnalyticsConfig', () => {
	it('runs live on the production host with the flag set', () => {
		const config = resolveAnalyticsConfig(liveInput());
		expect(config.mode).toBe('live');
		expect(config.gtmId).toBe('GTM-5KWMLHJP');
	});

	it('runs live on the www variant', () => {
		expect(resolveAnalyticsConfig(liveInput({ hostname: 'www.golfhomesinternational.com' })).mode).toBe(
			'live'
		);
	});

	it('is off without a GTM id, even when everything else is right', () => {
		expect(resolveAnalyticsConfig(liveInput({ gtmId: undefined })).mode).toBe('off');
		expect(resolveAnalyticsConfig(liveInput({ gtmId: '   ' })).reason).toBe('no PUBLIC_GTM_ID');
	});

	it('is off on a Vercel preview host', () => {
		const config = resolveAnalyticsConfig(liveInput({ hostname: 'ghi-website-abc123.vercel.app' }));
		expect(config.mode).toBe('off');
		expect(config.reason).toContain('non-production host');
	});

	it('is off on localhost', () => {
		expect(resolveAnalyticsConfig(liveInput({ hostname: 'localhost' })).mode).toBe('off');
	});

	it('is off on a dev server even on the production host', () => {
		const config = resolveAnalyticsConfig(liveInput({ isDev: true }));
		expect(config.mode).toBe('off');
		expect(config.reason).toBe('dev server');
	});

	it('is off when the enabled flag is anything but the exact string "true"', () => {
		expect(resolveAnalyticsConfig(liveInput({ enabledFlag: undefined })).mode).toBe('off');
		expect(resolveAnalyticsConfig(liveInput({ enabledFlag: 'false' })).mode).toBe('off');
		expect(resolveAnalyticsConfig(liveInput({ enabledFlag: '1' })).mode).toBe('off');
		expect(resolveAnalyticsConfig(liveInput({ enabledFlag: 'TRUE' })).mode).toBe('off');
	});

	it('tolerates whitespace around the flag and the GTM id', () => {
		const config = resolveAnalyticsConfig(
			liveInput({ enabledFlag: ' true\n', gtmId: ' GTM-5KWMLHJP ' })
		);
		expect(config.mode).toBe('live');
		expect(config.gtmId).toBe('GTM-5KWMLHJP');
	});

	describe('debug override', () => {
		it('turns analytics on for a preview host that would otherwise be off', () => {
			const config = resolveAnalyticsConfig(
				liveInput({ hostname: 'ghi-website-abc123.vercel.app', debugGranted: true })
			);
			expect(config.mode).toBe('debug');
		});

		it('works without the enabled flag, so production env vars stay untouched', () => {
			const config = resolveAnalyticsConfig(
				liveInput({ enabledFlag: undefined, hostname: 'localhost', debugGranted: true })
			);
			expect(config.mode).toBe('debug');
		});

		it('cannot switch analytics on inside the design system', () => {
			const config = resolveAnalyticsConfig(
				liveInput({ routeId: '/internal/design-system', debugGranted: true })
			);
			expect(config.mode).toBe('off');
			expect(config.reason).toBe('internal route');
		});

		it('cannot switch analytics on inside a Sanity draft preview', () => {
			const config = resolveAnalyticsConfig(liveInput({ isPreview: true, debugGranted: true }));
			expect(config.mode).toBe('off');
			expect(config.reason).toBe('sanity draft preview');
		});
	});

	describe('precedence', () => {
		it('reports the missing GTM id ahead of every other reason', () => {
			const config = resolveAnalyticsConfig(
				liveInput({ gtmId: '', routeId: '/internal/design-system', isPreview: true })
			);
			expect(config.reason).toBe('no PUBLIC_GTM_ID');
		});

		it('reports the internal route ahead of the preview session', () => {
			const config = resolveAnalyticsConfig(
				liveInput({ routeId: '/internal/design-system', isPreview: true })
			);
			expect(config.reason).toBe('internal route');
		});
	});

	it('is off on an internal route in normal operation', () => {
		expect(resolveAnalyticsConfig(liveInput({ routeId: '/internal/design-system' })).mode).toBe('off');
	});

	it('still resolves for an unmatched route (404)', () => {
		expect(resolveAnalyticsConfig(liveInput({ routeId: null })).mode).toBe('live');
	});
});

describe('isInternalRoute', () => {
	it('matches the internal tree and nothing else', () => {
		expect(isInternalRoute('/internal')).toBe(true);
		expect(isInternalRoute('/internal/design-system')).toBe(true);
		expect(isInternalRoute('/')).toBe(false);
		expect(isInternalRoute('/insights/[slug]')).toBe(false);
		expect(isInternalRoute(null)).toBe(false);
	});
});
