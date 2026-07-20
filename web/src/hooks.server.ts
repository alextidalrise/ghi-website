import { createRequestHandler, setServerClient } from '@sanity/svelte-loader';
import { sequence } from '@sveltejs/kit/hooks';
import { analyticsHandle } from '$lib/analytics/server';
import { serverClient } from '$lib/sanity/serverClient';

setServerClient(serverClient);

// Order matters: the Sanity handler populates `locals.preview`, which the analytics
// gate reads to keep draft-preview sessions out of production reporting.
export const handle = sequence(createRequestHandler(), analyticsHandle);
