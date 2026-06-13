import type { SchemaTypeDefinition } from 'sanity';

import { development } from './development';
import { golfCourse } from './golfCourse';
import { guide } from './guide';
import { locationTaxonomy } from './locationTaxonomy';
import { propertyListing } from './propertyListing';
import { siteSettings } from './siteSettings';
import { unit } from './unit';
import { unitType } from './unitType';

/** Document schemas for GHI Sanity Studio. */
export const documentTypes: SchemaTypeDefinition[] = [
	siteSettings,
	locationTaxonomy,
	golfCourse,
	development,
	unitType,
	unit,
	propertyListing,
	guide
];

export {
	development,
	golfCourse,
	guide,
	locationTaxonomy,
	propertyListing,
	siteSettings,
	unit,
	unitType
};
