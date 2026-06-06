/** Country landing-page hero headline — aligned with keyword map primary titles. */
export function countryHeadline(name: string): string {
	return `Golf property for sale in ${name}`;
}

/** Location hero headline — mirrors `countryHeadline`, aligned with the keyword map. */
export function locationHeadline(name: string): string {
	return `Golf property for sale in ${name}`;
}

/** Default heading for the country overview section, e.g. "The Spanish Golf Property Market". */
export function countryOverviewHeading(name: string): string {
	return `The ${name} Golf Property Market`;
}

/** Default heading for the location overview section, e.g. "About Marbella Golf Property". */
export function locationOverviewHeading(name: string): string {
	return `About ${name} Golf Property`;
}
