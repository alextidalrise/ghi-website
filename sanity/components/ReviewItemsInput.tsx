import { CheckmarkIcon, ChevronDownIcon, ChevronRightIcon } from '@sanity/icons';
import { Badge, Box, Button, Card, Flex, Stack, Text } from '@sanity/ui';
import { useCallback, useMemo, useState } from 'react';
import { PatchEvent, set, type ArrayOfObjectsInputProps } from 'sanity';

type ReviewItemValue = {
	_key: string;
	_type: 'reviewItem';
	label?: string;
	detail?: string;
	severity?: string;
	sourceLevel?: string;
	visibleToReviewer?: boolean;
	blocksPublish?: boolean;
	category?: string;
};

function isReviewerChecklistItem(item: ReviewItemValue): boolean {
	return item.visibleToReviewer === true && item.severity === 'must_check';
}

function isInternalNote(item: ReviewItemValue): boolean {
	return !isReviewerChecklistItem(item);
}

function categoryLabel(category: string | undefined): string {
	if (!category) return '';
	return category.replace(/_/g, ' ');
}

function ChecklistItem({
	item,
	onResolve
}: {
	item: ReviewItemValue;
	onResolve: (key: string) => void;
}) {
	return (
		<Card padding={3} radius={2} border tone="caution">
			<Flex align="flex-start" gap={3}>
				<Box flex={1}>
					<Flex align="center" gap={2} wrap="wrap">
						<Text weight="semibold" size={2}>
							{item.label}
						</Text>
						{item.category ? (
							<Badge mode="outline" fontSize={0}>
								{categoryLabel(item.category)}
							</Badge>
						) : null}
						{item.blocksPublish ? (
							<Badge tone="critical" fontSize={0}>
								Blocks publish
							</Badge>
						) : null}
					</Flex>
					{item.detail ? (
						<Text size={1} muted style={{ marginTop: '0.5rem' }}>
							{item.detail}
						</Text>
					) : null}
				</Box>
				<Button
					icon={CheckmarkIcon}
					mode="ghost"
					tone="positive"
					text="Resolve"
					onClick={() => onResolve(item._key)}
				/>
			</Flex>
		</Card>
	);
}

function InternalNoteItem({ item }: { item: ReviewItemValue }) {
	return (
		<Box paddingY={2} paddingX={1}>
			<Flex align="center" gap={2} wrap="wrap">
				<Text size={1} muted>
					{item.label}
				</Text>
				{item.severity ? (
					<Badge mode="outline" fontSize={0}>
						{item.severity.replace(/_/g, ' ')}
					</Badge>
				) : null}
				{item.category ? (
					<Badge mode="outline" fontSize={0}>
						{categoryLabel(item.category)}
					</Badge>
				) : null}
			</Flex>
			{item.detail ? (
				<Text size={1} muted style={{ marginTop: '0.25rem' }}>
					{item.detail}
				</Text>
			) : null}
		</Box>
	);
}

export function ReviewItemsInput(props: ArrayOfObjectsInputProps) {
	const [internalExpanded, setInternalExpanded] = useState(false);
	const [editorExpanded, setEditorExpanded] = useState(false);

	const items = useMemo(
		() => (props.value ?? []) as ReviewItemValue[],
		[props.value]
	);

	const checklistItems = useMemo(() => items.filter(isReviewerChecklistItem), [items]);
	const internalItems = useMemo(() => items.filter(isInternalNote), [items]);

	const handleResolve = useCallback(
		(key: string) => {
			const next = items.filter((item) => item._key !== key);
			props.onChange(PatchEvent.from(set(next)));
		},
		[items, props]
	);

	return (
		<Stack space={4}>
			<Card padding={4} radius={2} tone="transparent" border>
				<Stack space={3}>
					<Flex align="center" justify="space-between">
						<Text weight="semibold" size={2}>
							Review checklist
						</Text>
						<Text size={1} muted>
							{checklistItems.length} must-check for reviewer
							{internalItems.length > 0 ? ` · ${internalItems.length} internal` : ''}
						</Text>
					</Flex>

					{checklistItems.length === 0 ? (
						<Text size={1} muted>
							No must-check items for the reviewer. Expand the editor below to add items.
						</Text>
					) : (
						<Stack space={2}>
							{checklistItems.map((item) => (
								<ChecklistItem key={item._key} item={item} onResolve={handleResolve} />
							))}
						</Stack>
					)}
				</Stack>
			</Card>

			{internalItems.length > 0 ? (
				<Card padding={3} radius={2} tone="transparent" border>
					<Button
						mode="bleed"
						onClick={() => setInternalExpanded((prev) => !prev)}
						icon={internalExpanded ? ChevronDownIcon : ChevronRightIcon}
						text={`Internal audit notes (${internalItems.length})`}
					/>
					{internalExpanded ? (
						<Stack space={1} marginTop={2}>
							{internalItems.map((item) => (
								<InternalNoteItem key={item._key} item={item} />
							))}
						</Stack>
					) : null}
				</Card>
			) : null}

			<Card padding={3} radius={2} tone="transparent" border>
				<Button
					mode="bleed"
					onClick={() => setEditorExpanded((prev) => !prev)}
					icon={editorExpanded ? ChevronDownIcon : ChevronRightIcon}
					text={editorExpanded ? 'Hide full editor' : 'Edit all review items'}
				/>
				{editorExpanded ? <Box marginTop={3}>{props.renderDefault(props)}</Box> : null}
			</Card>
		</Stack>
	);
}
