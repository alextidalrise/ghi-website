import { CheckmarkIcon, ChevronDownIcon, ChevronRightIcon } from '@sanity/icons';
import { Badge, Box, Button, Card, Flex, Stack, Text } from '@sanity/ui';
import { useCallback, useMemo, useState } from 'react';
import { PatchEvent, set, type ArrayOfObjectsInputProps } from 'sanity';

type ReviewItemValue = {
	_key: string;
	_type: 'reviewItem';
	label?: string;
	detail?: string;
	blocksPublish?: boolean;
	category?: string;
};

function categoryLabel(category: string | undefined): string {
	if (!category) return '';
	return category.replace(/_/g, ' ');
}

function ReviewItemRow({
	item,
	onResolve
}: {
	item: ReviewItemValue;
	onResolve: (key: string) => void;
}) {
	const tone = item.blocksPublish ? 'caution' : 'transparent';
	return (
		<Card padding={3} radius={2} border tone={tone}>
			<Flex align="flex-start" gap={3}>
				<Box flex={1}>
					<Flex align="center" gap={2} wrap="wrap">
						<Text weight="semibold" size={2}>
							{item.label || 'Untitled review item'}
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
						) : (
							<Badge mode="outline" fontSize={0}>
								Note
							</Badge>
						)}
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

export function ReviewItemsInput(props: ArrayOfObjectsInputProps) {
	const [editorExpanded, setEditorExpanded] = useState(false);

	const items = useMemo(
		() => (props.value ?? []) as ReviewItemValue[],
		[props.value]
	);

	const blockerCount = useMemo(
		() => items.filter((item) => item.blocksPublish).length,
		[items]
	);

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
							Review items
						</Text>
						<Text size={1} muted>
							{items.length === 0
								? 'No items'
								: `${items.length} item(s) · ${blockerCount} blocking publish`}
						</Text>
					</Flex>

					{items.length === 0 ? (
						<Text size={1} muted>
							No review items. Expand the editor below to add one.
						</Text>
					) : (
						<Stack space={2}>
							{items.map((item) => (
								<ReviewItemRow key={item._key} item={item} onResolve={handleResolve} />
							))}
						</Stack>
					)}
				</Stack>
			</Card>

			<Card padding={3} radius={2} tone="transparent" border>
				<Button
					mode="bleed"
					onClick={() => setEditorExpanded((prev) => !prev)}
					icon={editorExpanded ? ChevronDownIcon : ChevronRightIcon}
					text={editorExpanded ? 'Hide full editor' : 'Edit / add review items'}
				/>
				{editorExpanded ? <Box marginTop={3}>{props.renderDefault(props)}</Box> : null}
			</Card>
		</Stack>
	);
}
