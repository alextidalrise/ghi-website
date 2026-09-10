import { createRequestHandler, setServerClient } from '@sanity/svelte-loader';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { analyticsHandle } from '$lib/analytics/server';
import { cacheHandle } from '$lib/cache/server';
import { fetchExchangeRates } from '$lib/currency/rates.server';
import { serverClient } from '$lib/sanity/serverClient';

setServerClient(serverClient);

/* Kick off the live-rates fetch and stash the promise on locals WITHOUT awaiting, so it
   overlaps every load that later `await`s it (the layout's nav/footer fetch, the listing
   grids). `fetchExchangeRates` never rejects, so the un-awaited promise carries no risk of
   an unhandled rejection. Runs on every server request; on a cache hit the edge serves the
   HTML and no handler runs at all. */
const ratesHandle: Handle = ({ event, resolve }) => {
	event.locals.exchangeRates = fetchExchangeRates();
	return resolve(event);
};

/* Order matters, and `sequence` is the opposite way round from how it reads: handlers
   listed later run *nearer the render*, so their pre-resolve code runs last but their
   post-resolve code runs FIRST. The Sanity handler still has to precede the analytics gate,
   because it populates `locals.preview` before resolving and the gate reads it.

   `cacheHandle` is listed first precisely so its response handling runs last. It decides
   whether to cache by inspecting the finished response's `cache-control`, and
   `analyticsHandle` is what stamps `private, no-store` on debug sessions and Sanity draft
   previews. Listed last instead, `cacheHandle` would resolve innermost and read that header
   before it had been set — which measurably attached edge-cache headers to a debug
   document, i.e. published one visitor's GTM Preview session, or an unpublished draft, into
   a shared cache. Outermost means it sees whatever any handler marked, whoever marked it. */
export const handle = sequence(cacheHandle, createRequestHandler(), ratesHandle, analyticsHandle);
