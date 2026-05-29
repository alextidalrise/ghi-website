import { createRequestHandler, setServerClient } from '@sanity/svelte-loader';
import { serverClient } from '$lib/sanity/serverClient';

setServerClient(serverClient);

export const handle = createRequestHandler();
