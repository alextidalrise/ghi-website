import type { InputProps } from 'sanity';

/** Reference picker shown for derived taxonomy fields — visible but not editable. */
export function ReadOnlyReferenceInput(props: InputProps) {
	return props.renderDefault({ ...props, readOnly: true });
}
