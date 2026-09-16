import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { invalidateByTag } from '@vercel/functions';
import { publicClient } from '$lib/sanity/client';
import { cacheTag } from '$lib/cache/tags';
import { ECB_DAILY_URL, parseEcbDaily } from '$lib/currency/ecb';
import { CBR_DAILY_URL, parseCbrDaily } from '$lib/currency/cbr';
import { EXCHANGE_RATES_DOC_ID } from '$lib/currency/rates.server';

/**
 * Daily ECB rate refresh, invoked by the Vercel cron in vercel.json. Vercel Cron Jobs fire a
 * GET request and attach `Authorization: Bearer <CRON_SECRET>`, so this is a GET despite
 * mutating — it is cron-only and token-gated.
 *
 * Pulls two feeds, and if either differs from what's stored, writes the base quotes into the
 * published `exchangeRates` singleton and purges the site so every page re-sorts against the
 * new rates. Per-rate override fields are left untouched (a `patch().set()` of only the base
 * fields), so a manual pin always wins.
 *
 * Two feeds, because no single one carries every currency this site offers:
 * - **ECB** euro reference rates → `gbpPerEur`/`usdPerEur` + `asOf` (AED derives from the USD
 *   peg downstream). Required: a failure here aborts the run.
 * - **CBR** daily fixing → `rubPerEur` + `rubAsOf`. The ECB suspended its rouble quote in
 *   March 2022 and every EU central bank followed, so the issuer's own fixing is the only
 *   authoritative daily source left. Optional: a failure here leaves the stored rouble rate
 *   (or its code snapshot) in place and the ECB half of the run still commits, because one
 *   unreachable feed must not freeze the other three currencies.
 *
 * The two publish on different calendars — different holidays, different cut-offs — so each
 * carries its own `asOf` date rather than sharing one.
 *
 * Safety:
 * - Bearer-token auth against CRON_SECRET, mirroring the cache-purge webhook's fail-loud guard.
 * - An ECB fetch/parse failure returns 502 and writes nothing — never overwrite good rates
 *   with garbage. The same failure on the CBR side is logged and skipped.
 * - Unchanged rates (weekends, holidays, a duplicate run) are a no-op: no write, no purge.
 * - The purge is `nav`, which every page carries via the root layout, so a rate change
 *   invalidates the whole site's cached HTML. Guarded to run only on Vercel.
 */

/** A published-doc write client. Anonymous public client + the write token; CDN off. */
function writeClient() {
	const token = env.SANITY_API_TOKEN?.trim();
	if (!token) return null;
	return publicClient.withConfig({ token, useCdn: false, perspective: 'published' });
}

type StoredRates = {
	gbpPerEur?: number | null;
	usdPerEur?: number | null;
	rubPerEur?: number | null;
	asOf?: string | null;
	rubAsOf?: string | null;
};

export const GET: RequestHandler = async ({ request }) => {
	const secret = env.CRON_SECRET?.trim();
	if (!secret) {
		console.error('rates-refresh: CRON_SECRET is not set; refusing to run.');
		return json({ error: 'Rate refresh is not configured.' }, { status: 503 });
	}
	if (request.headers.get('authorization') !== `Bearer ${secret}`) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	const client = writeClient();
	if (!client) {
		console.error('rates-refresh: SANITY_API_TOKEN is not set; cannot write rates.');
		return json({ error: 'Rate refresh is not configured.' }, { status: 503 });
	}

	// Pull the ECB daily feed. Any failure here leaves the stored rates untouched.
	let parsed;
	try {
		const res = await fetch(ECB_DAILY_URL, { headers: { accept: 'application/xml' } });
		if (!res.ok) throw new Error(`ECB responded ${res.status}`);
		parsed = parseEcbDaily(await res.text());
	} catch (err) {
		console.error('rates-refresh: ECB fetch failed', err);
		return json({ error: 'Could not fetch ECB rates.' }, { status: 502 });
	}
	if (!parsed) {
		console.error('rates-refresh: ECB payload did not parse.');
		return json({ error: 'Could not parse ECB rates.' }, { status: 502 });
	}

	// Pull the rouble from the CBR. Unlike the ECB half this is best-effort: a failure here
	// must not hold back the three currencies the ECB feed did deliver.
	let rouble: { asOf: string; rubPerEur: number } | null = null;
	try {
		const res = await fetch(CBR_DAILY_URL, { headers: { accept: 'application/xml' } });
		if (!res.ok) throw new Error(`CBR responded ${res.status}`);
		rouble = parseCbrDaily(await res.text());
		if (!rouble) console.error('rates-refresh: CBR payload did not parse; keeping stored RUB.');
	} catch (err) {
		console.error('rates-refresh: CBR fetch failed; keeping stored RUB.', err);
	}

	// Compare against the fresh stored doc (write client, CDN off) to skip no-op days.
	const existing = await client.getDocument<StoredRates>(EXCHANGE_RATES_DOC_ID);
	const ecbUnchanged =
		existing?.asOf === parsed.asOf &&
		existing?.gbpPerEur === parsed.gbpPerEur &&
		existing?.usdPerEur === parsed.usdPerEur;
	// A rouble we could not fetch is "unchanged" — there is nothing new to write.
	const rubUnchanged =
		rouble === null ||
		(existing?.rubAsOf === rouble.asOf && existing?.rubPerEur === rouble.rubPerEur);

	if (ecbUnchanged && rubUnchanged) {
		return json({ changed: false, asOf: parsed.asOf, rubAsOf: existing?.rubAsOf ?? null });
	}

	// Write only the base fields, preserving any manual override fields on the document.
	await client.createIfNotExists({ _id: EXCHANGE_RATES_DOC_ID, _type: 'exchangeRates' });
	await client
		.patch(EXCHANGE_RATES_DOC_ID)
		.set({
			gbpPerEur: parsed.gbpPerEur,
			usdPerEur: parsed.usdPerEur,
			asOf: parsed.asOf,
			...(rouble ? { rubPerEur: rouble.rubPerEur, rubAsOf: rouble.asOf } : {}),
			updatedByCron: new Date().toISOString()
		})
		.commit();

	// Rates changed → every listing surface must re-sort. `nav` is on every page.
	if (env.VERCEL_ENV) {
		try {
			await invalidateByTag([cacheTag.nav]);
		} catch (err) {
			// The write succeeded; a purge failure just means pages refresh on their own TTL.
			console.error('rates-refresh: invalidateByTag failed', err);
		}
	}

	return json({
		changed: true,
		asOf: parsed.asOf,
		rubAsOf: rouble?.asOf ?? null,
		rubSkipped: rouble === null
	});
};
