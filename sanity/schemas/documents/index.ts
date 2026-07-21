import type { SchemaTypeDefinition } from 'sanity';

import { aboutPage } from './aboutPage';
import { author } from './author';
import { contactPage } from './contactPage';
import { development } from './development';
import { golfCourse } from './golfCourse';
import { guide } from './guide';
import { guidesHubPage } from './guidesHubPage';
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
	guidesHubPage,
	aboutPage,
	contactPage,
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
	aboutPage,
	author,
	contactPage,
	development,
	golfCourse,
	guide,
	guidesHubPage,
	insight,
	locationTaxonomy,
	partner,
	partnerCategory,
	propertyListing,
	siteSettings,
	unit,
	unitType
};
