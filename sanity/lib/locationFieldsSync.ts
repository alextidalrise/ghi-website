import { set, unset } from 'sanity';

type LocationFieldsPatch = ReturnType<typeof set> | ReturnType<typeof unset>;

export const LOCATION_FIELDS_TYPE = 'locationFields' as const;

export type LocationFieldsValue = {
	_type?: typeof LOCATION_FIELDS_TYPE;
	country?: { _type: 'reference'; _ref: string };
	location?: { _type: 'reference'; _ref: string };
	community?: { _type: 'reference'; _ref: string };
	addressDisplay?: string;
};

export type ParentChain = {
	locationRef?: string;
	countryRef?: string;
};

export const PARENT_CHAIN_QUERY = `*[_id == $id][0]{
  "locationRef": parent._ref,
  "countryRef": parent->parent._ref
}`;

function referencePatch(ref: string, path: 'location' | 'country'): LocationFieldsPatch {
	return set({ _type: 'reference', _ref: ref }, [path]);
}

/** Derive location/country reference patches from a community's parent chain. */
export function buildParentRefPatches(
	value: LocationFieldsValue,
	chain: ParentChain | null
): LocationFieldsPatch[] {
	const patches: LocationFieldsPatch[] = [];
	const nextLocationRef = chain?.locationRef;
	const nextCountryRef = chain?.countryRef;

	if (!nextLocationRef && value.location) {
		patches.push(unset(['location']));
	} else if (nextLocationRef && value.location?._ref !== nextLocationRef) {
		patches.push(referencePatch(nextLocationRef, 'location'));
	}

	if (!nextCountryRef && value.country) {
		patches.push(unset(['country']));
	} else if (nextCountryRef && value.country?._ref !== nextCountryRef) {
		patches.push(referencePatch(nextCountryRef, 'country'));
	}

	return patches;
}

export function isParentChainSynced(
	value: LocationFieldsValue,
	chain: ParentChain | null
): boolean {
	return buildParentRefPatches(value, chain).length === 0;
}
