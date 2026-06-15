import type { SchemaTypeDefinition } from 'sanity';

import { development } from './development';
import { golfCourse } from './golfCourse';
import { guide } from './guide';
import { locationTaxonomy } from './locationTaxonomy';
import { partner } from './partner';
import { partnerCategory } from './partnerCategory';
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
	guide,
	partnerCategory,
	partner
];

export {
	development,
	golfCourse,
	guide,
	locationTaxonomy,
	partner,
	partnerCategory,
	propertyListing,
	siteSettings,
	unit,
	unitType
};
