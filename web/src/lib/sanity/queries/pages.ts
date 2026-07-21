import { defineQuery } from 'groq';
import {
	ABOUT_PAGE_PUBLIC,
	CONTACT_PAGE_PUBLIC,
	FRONTLINE_CONTENT_PUBLIC,
	GUIDES_HUB_PUBLIC,
	HOMEPAGE_CONTENT_PUBLIC,
	SEO_PUBLIC
} from '../allowlists';
import { fetchPublic } from './fetch';
import type {
	AboutPageInput,
	ContactPageInput,
	FrontlineContentInput,
	GuidesHubPageInput,
	HomepageContentInput
} from '../transforms/pageContent';

export const homepageContentQuery = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    homepageSeo${SEO_PUBLIC},
    homepageContent${HOMEPAGE_CONTENT_PUBLIC}
  }
`);

export const frontlineContentQuery = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    frontlineSeo${SEO_PUBLIC},
    frontlineContent${FRONTLINE_CONTENT_PUBLIC}
  }
`);

export const guidesHubPageQuery = defineQuery(`
  *[_type == "guidesHubPage"][0]${GUIDES_HUB_PUBLIC}
`);

export const aboutPageQuery = defineQuery(`
  *[_type == "aboutPage"][0]${ABOUT_PAGE_PUBLIC}
`);

export const contactPageQuery = defineQuery(`
  *[_type == "contactPage"][0]${CONTACT_PAGE_PUBLIC}
`);

type HomepageSettingsResult = {
	homepageSeo?: HomepageContentInput['seo'] | null;
	homepageContent?: Omit<HomepageContentInput, 'seo'> | null;
} | null;

export async function fetchHomepageContent(): Promise<HomepageContentInput> {
	const result = await fetchPublic<HomepageSettingsResult>(homepageContentQuery);
	return {
		...result?.homepageContent,
		seo: result?.homepageSeo ?? null
	} as HomepageContentInput;
}

type FrontlineSettingsResult = {
	frontlineSeo?: FrontlineContentInput['seo'] | null;
	frontlineContent?: Omit<FrontlineContentInput, 'seo'> | null;
} | null;

export async function fetchFrontlineContent(): Promise<FrontlineContentInput> {
	const result = await fetchPublic<FrontlineSettingsResult>(frontlineContentQuery);
	return {
		...result?.frontlineContent,
		seo: result?.frontlineSeo ?? null
	} as FrontlineContentInput;
}

export async function fetchGuidesHubPage(): Promise<GuidesHubPageInput> {
	const result = await fetchPublic<GuidesHubPageInput>(guidesHubPageQuery);
	return result ?? ({} as GuidesHubPageInput);
}

export async function fetchAboutPage(): Promise<AboutPageInput> {
	const result = await fetchPublic<AboutPageInput>(aboutPageQuery);
	return result ?? ({} as AboutPageInput);
}

export async function fetchContactPage(): Promise<ContactPageInput> {
	const result = await fetchPublic<ContactPageInput>(contactPageQuery);
	return result ?? ({} as ContactPageInput);
}
