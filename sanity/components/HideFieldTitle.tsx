import type { FieldProps } from 'sanity';

/** Renders only the field input — no title legend or section divider (the tab already labels the group). */
export function HideFieldTitle(props: FieldProps) {
	return props.children;
}
