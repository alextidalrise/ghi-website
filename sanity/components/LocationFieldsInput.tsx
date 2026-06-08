import { useEffect } from 'react';
import { PatchEvent, unset, useClient, type ObjectInputProps } from 'sanity';
import {
	buildParentRefPatches,
	PARENT_CHAIN_QUERY,
	type LocationFieldsValue,
	type ParentChain
} from '../lib/locationFieldsSync';

/**
 * Keeps the derived `location`/`country` references in sync with the selected
 * community. Covers picking, swapping, and clearing the community, plus
 * repair-on-open for documents saved with stale derived refs.
 *
 * Two things make this work where earlier attempts failed (see
 * docs/sanity-location-fields-sync.md):
 *
 * 1. Sync happens here, at the object input, via `props.onChange`. Sanity scopes
 *    `props.onChange` to this object and prefixes patches with the object's own
 *    field name, so `set(ref, ['country'])` lands on `<object>.country`. Earlier
 *    attempts used `useFormCallbacks().onChange` with absolute paths, but that
 *    callback is also member-scoped and re-prefixes, so patches landed on garbage
 *    paths (`location.location`) and were silently dropped.
 *
 * 2. This input is wired on the FIELD (`components.input`) in development.ts /
 *    propertyListing.ts — not only on the `locationFields` type. The field also
 *    sets `components.field` (HideFieldTitle), and a field-level `components`
 *    object shadows the type-level one, so without a field-level `input` Sanity
 *    fell back to the default object input and this component never mounted.
 */
export function LocationFieldsInput(props: ObjectInputProps) {
	const client = useClient({ apiVersion: '2024-01-01' });
	const { onChange } = props;
	const value = (props.value ?? {}) as LocationFieldsValue;
	const communityRef = value.community?._ref;
	const locationRef = value.location?._ref;
	const countryRef = value.country?._ref;

	useEffect(() => {
		// Community cleared → clear the derived refs.
		if (!communityRef) {
			const patches = [];
			if (locationRef) patches.push(unset(['location']));
			if (countryRef) patches.push(unset(['country']));
			if (patches.length > 0) onChange(PatchEvent.from(patches));
			return;
		}

		let cancelled = false;

		void (async () => {
			let chain: ParentChain | null = null;
			try {
				chain = await client.fetch<ParentChain | null>(PARENT_CHAIN_QUERY, { id: communityRef });
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error('[locationFields] failed to resolve community parent chain', err);
				return;
			}
			if (cancelled) return;

			// A present community with no resolvable chain is anomalous (transient
			// read / missing doc) — leave existing derived refs untouched rather
			// than wiping them.
			if (chain == null) return;

			const patches = buildParentRefPatches(
				{
					location: locationRef ? { _type: 'reference', _ref: locationRef } : undefined,
					country: countryRef ? { _type: 'reference', _ref: countryRef } : undefined
				},
				chain
			);
			if (patches.length > 0) onChange(PatchEvent.from(patches));
		})();

		return () => {
			cancelled = true;
		};
	}, [client, onChange, communityRef, locationRef, countryRef]);

	return props.renderDefault(props);
}
