import { createRequestHandler, setServerClient } from '@sanity/svelte-loader';
import { sequence } from '@sveltejs/kit/hooks';
import { analyticsHandle } from '$lib/analytics/server';
import { cacheHandle } from '$lib/cache/server';
import { serverClient } from '$lib/sanity/serverClient';

setServerClient(serverClient);

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
export const handle = sequence(cacheHandle, createRequestHandler(), analyticsHandle);
