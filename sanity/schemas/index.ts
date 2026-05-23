import type { SchemaTypeDefinition } from 'sanity';

import { documentTypes } from './documents';
import { objectTypes } from './objects';

/** Document and object schemas for GHI Sanity Studio. */
export const schemaTypes: SchemaTypeDefinition[] = [...objectTypes, ...documentTypes];

export { documentTypes } from './documents';
export { objectTypes } from './objects';
