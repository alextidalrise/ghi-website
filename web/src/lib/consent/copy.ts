/**
 * Copy and category descriptors for the consent UI.
 *
 * Kept apart from the components deliberately: `vite.config.ts` runs vitest in Node with
 * no jsdom, so a component's markup cannot be tested but these can. Anything in the
 * consent UI that is a decision rather than a rendering — which categories exist, which
 * are locked, which sentence a given viewport gets — lives here so it has test coverage.
 *
 * All wording in this file is pending solicitor review (see docs/consent-ui-brief.md).
 */

export type ConsentCategoryId = 'necessary' | 'analytics' | 'marketing';

export type ConsentCategory = {
	id: ConsentCategoryId;
	label: string;
	description: string;
	/** Locked categories render as a static "Always on", never as a switch. */
	locked: boolean;
};

/**
 * The three categories, in the order they appear in the preference panel.
 *
 * Marketing is listed even though no advertising tag exists yet. The category is real —
 * the consent signals for it are already being sent — so hiding it would misrepresent
 * what is being asked. Its description says plainly that nothing is using it, rather
 * than implying advertising is running.
 */
export const CONSENT_CATEGORIES: readonly ConsentCategory[] = [
	{
		id: 'necessary',
		label: 'Necessary',
		description:
			'Keeps the site secure and remembers the choice you make here. These cannot be switched off.',
		locked: true
	},
	{
		id: 'analytics',
		label: 'Analytics',
		description:
			'Google Analytics, so we can see which properties and guides people read, and how they found them.',
		locked: false
	},
	{
		id: 'marketing',
		label: 'Marketing',
		description:
			'Advertising and personalisation. We are not running any advertising at the moment; this setting is here so your choice is already recorded if that changes.',
		locked: false
	}
];

/** The categories the visitor can actually change. */
export function selectableCategories(): ConsentCategory[] {
	return CONSENT_CATEGORIES.filter((category) => !category.locked);
}

export function categoryById(id: ConsentCategoryId): ConsentCategory {
	const found = CONSENT_CATEGORIES.find((category) => category.id === id);
	if (!found) throw new Error(`Unknown consent category: ${id}`);
	return found;
}

/**
 * The banner's explanatory sentence.
 *
 * The narrow variant is not the wide one truncated — it drops the second clause rather
 * than shortening every clause, because on a phone the banner is stacked above the
 * enquiry console and every line it costs is a line of property taken off screen.
 */
export function bannerBody(layout: 'narrow' | 'wide'): string {
	return layout === 'narrow'
		? 'We would like to use analytics cookies to see which pages people read. Nothing is stored until you choose.'
		: 'We would like to use analytics cookies to understand which properties and guides people read. Nothing is stored on your device until you choose.';
}

/**
 * Whether recording `next` over `current` will reload the page.
 *
 * Mirrors the downgrade rule in `ConsentStore.save()`: withdrawing a category that was
 * previously granted forces a reload, because deleting `_ga` does not clear the client id
 * the loaded gtag holds in memory. The UI needs to know this *before* calling save() so it
 * can show a saving state — otherwise the page appears to refresh on its own.
 *
 * A first-time visitor rejecting everything is not a downgrade: nothing was granted, so
 * nothing is being taken away, and there is no reload.
 */
export function willReload(
	current: { analytics: boolean; marketing: boolean },
	next: { analytics: boolean; marketing: boolean }
): boolean {
	return (current.analytics && !next.analytics) || (current.marketing && !next.marketing);
}
