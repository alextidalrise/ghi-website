import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { invalidateByTag } from '@vercel/functions';
import { tagsForDoc, type PurgePayload } from '$lib/cache/purgeTags';

/**
 * Sanity publish → Vercel edge-cache purge.
 *
 * A GROQ-powered Sanity webhook (configured in the Sanity console; see
 * docs/edge-caching-plan.md) POSTs the changed document here on every create/update/delete.
 * We verify its HMAC signature, map the document to the cache tags the affected pages carry
 * (`purgeTags.tagsForDoc`), and invalidate those tags so the pages revalidate on next view —
 * content goes live in seconds, without touching the rest of the site's cache.
 *
 * The pages tag themselves at render time (see lib/cache/tagContext + lib/cache/tags), so
 * this endpoint never needs to know which URLs exist — only the changed doc's tags.
 *
 * Expected JSON body (the webhook projection): `{ _id, _type, ...structural fields }` — the
 * shape of `PurgePayload`. Computing the structural fields in the projection (rather than
 * re-querying here) keeps this pure and makes delete events work, since the deleted document
 * can no longer be fetched back.
 */

// Vercel's bulk invalidate-by-tag call accepts at most 16 tags; batch to stay under it.
const VERCEL_BULK_TAG_LIMIT = 16;

export const POST: RequestHandler = async ({ request }) => {
	const secret = env.SANITY_WEBHOOK_SECRET?.trim();
	if (!secret) {
		// Fail loud rather than silently accepting unauthenticated purges.
		console.error('cache-purge: SANITY_WEBHOOK_SECRET is not set; refusing to purge.');
		return json({ error: 'Cache purge is not configured.' }, { status: 503 });
	}

	const signature = request.headers.get(SIGNATURE_HEADER_NAME);
	// Signature is computed over the raw body, so read it as text before parsing.
	const body = await request.text();

	if (!signature || !(await isValidSignature(body, signature, secret))) {
		return json({ error: 'Invalid signature.' }, { status: 401 });
	}

	let payload: PurgePayload;
	try {
		payload = JSON.parse(body) as PurgePayload;
	} catch {
		return json({ error: 'Could not parse payload.' }, { status: 400 });
	}

	if (typeof payload?._id !== 'string' || typeof payload?._type !== 'string') {
		return json({ error: 'Payload missing _id/_type.' }, { status: 422 });
	}

	const tags = tagsForDoc(payload);

	// Off Vercel (local dev, unit tests) there is no edge cache to purge — the tag mapping
	// is still returned so it can be asserted and inspected.
	if (env.VERCEL_ENV) {
		try {
			for (let i = 0; i < tags.length; i += VERCEL_BULK_TAG_LIMIT) {
				await invalidateByTag(tags.slice(i, i + VERCEL_BULK_TAG_LIMIT));
			}
		} catch (err) {
			console.error('cache-purge: invalidateByTag failed', err);
			return json({ error: 'Purge failed.' }, { status: 502 });
		}
	}

	return json({ ok: true, id: payload._id, type: payload._type, invalidated: tags });
};
