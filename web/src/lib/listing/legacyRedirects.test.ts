import { describe, expect, it } from 'vitest';
import { resolveLegacyRedirect } from './legacyRedirects';

describe('resolveLegacyRedirect', () => {
	it('redirects legacy Estepona paths to the live location page', () => {
		expect(resolveLegacyRedirect('/estepona/estepona')).toBe('/spain/estepona');
		expect(resolveLegacyRedirect('/estepona/el-campanario')).toBe('/spain/estepona');
	});

	it('ignores a trailing slash', () => {
		expect(resolveLegacyRedirect('/estepona/estepona/')).toBe('/spain/estepona');
	});

	it('returns null for live and unrelated paths', () => {
		expect(resolveLegacyRedirect('/spain/estepona')).toBeNull();
		expect(resolveLegacyRedirect('/spain/costa-del-sol/marbella')).toBeNull();
		expect(resolveLegacyRedirect('/')).toBeNull();
	});
});
