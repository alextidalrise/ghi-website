import type { SchemaTypeDefinition } from 'sanity';

import { development } from './development';
import { golfCourse } from './golfCourse';
import { locationTaxonomy } from './locationTaxonomy';
import { propertyListing } from './propertyListing';
import { unit } from './unit';
import { unitType } from './unitType';

/** Document schemas for GHI Sanity Studio. */
export const documentTypes: SchemaTypeDefinition[] = [
	locationTaxonomy,
	golfCourse,
	development,
	unitType,
	unit,
	propertyListing
];

export { development, golfCourse, locationTaxonomy, propertyListing, unit, unitType };
