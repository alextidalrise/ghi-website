import type { SchemaTypeDefinition } from 'sanity';

import { author } from './author';
import { development } from './development';
import { golfCourse } from './golfCourse';
import { guide } from './guide';
import { insight } from './insight';
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
	insight,
	author,
	partnerCategory,
	partner
];

export {
	author,
	development,
	golfCourse,
	guide,
	insight,
	locationTaxonomy,
	partner,
	partnerCategory,
	propertyListing,
	siteSettings,
	unit,
	unitType
};
