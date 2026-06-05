import { useEffect, useRef } from 'react';
import { PatchEvent, set, unset, useClient, type ObjectInputProps } from 'sanity';

type LocationFieldsValue = {
	country?: { _type: 'reference'; _ref: string };
	location?: { _type: 'reference'; _ref: string };
	community?: { _type: 'reference'; _ref: string };
};

type ParentChain = {
	locationRef?: string;
	countryRef?: string;
};

const PARENT_CHAIN_QUERY = `*[_id == $id][0]{
  "locationRef": parent._ref,
  "countryRef": parent->parent._ref
}`;

export function LocationFieldsInput(props: ObjectInputProps) {
	const client = useClient({ apiVersion: '2024-01-01' });
	const { onChange, renderDefault, value: rawValue } = props;
	const value = (rawValue ?? {}) as LocationFieldsValue;
	const syncingRef = useRef(false);

	useEffect(() => {
		const communityRef = value.community?._ref;

		if (!communityRef) {
			if (value.location || value.country) {
				onChange(
					PatchEvent.from([
						...(value.location ? [unset(['location'])] : []),
						...(value.country ? [unset(['country'])] : [])
					])
				);
			}
			return;
		}

		let cancelled = false;

		async function syncParentRefs() {
			const chain = await client.fetch<ParentChain>(PARENT_CHAIN_QUERY, { id: communityRef });
			if (cancelled || syncingRef.current) return;

			const patches = [];
			const nextLocationRef = chain?.locationRef;
			const nextCountryRef = chain?.countryRef;

			if (!nextLocationRef && value.location) {
				patches.push(unset(['location']));
			} else if (nextLocationRef && value.location?._ref !== nextLocationRef) {
				patches.push(set({ _type: 'reference', _ref: nextLocationRef }, ['location']));
			}

			if (!nextCountryRef && value.country) {
				patches.push(unset(['country']));
			} else if (nextCountryRef && value.country?._ref !== nextCountryRef) {
				patches.push(set({ _type: 'reference', _ref: nextCountryRef }, ['country']));
			}

			if (patches.length > 0) {
				syncingRef.current = true;
				onChange(PatchEvent.from(patches));
				syncingRef.current = false;
			}
		}

		void syncParentRefs();

		return () => {
			cancelled = true;
		};
	}, [
		client,
		onChange,
		value.community?._ref,
		value.country,
		value.country?._ref,
		value.location,
		value.location?._ref
	]);

	return renderDefault(props);
}
