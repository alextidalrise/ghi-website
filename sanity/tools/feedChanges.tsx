import { SyncIcon } from '@sanity/icons';
import { Badge, Box, Button, Card, Container, Flex, Heading, Inline, Spinner, Stack, Text } from '@sanity/ui';
import { useCallback, useEffect, useState } from 'react';
import { useClient, type Tool } from 'sanity';
import { useRouter } from 'sanity/router';

/**
 * Read-only "Feed changes" queue.
 *
 * Lists every propertyListing that carries pending feed changes (written by the re-sync,
 * see importers/kyero/sync.ts) so an editor can see, at a glance, what the feed changed
 * across the dataset and jump to each listing to review it. Deliberately read-only: it
 * surfaces and links, it does NOT accept/apply changes (that automation is unbuilt on
 * purpose — nothing auto-applies; a human handles each on the document itself).
 */

interface PendingChange {
	field?: string;
	changeType?: 'update' | 'conflict' | 'removed' | string;
	oldValue?: string;
	newValue?: string;
	detectedAt?: string;
}
interface ChangedListing {
	_id: string;
	title?: string;
	changes: PendingChange[];
}

const QUERY = `*[
	_type == "propertyListing"
	&& count(internal.feedImport.pendingChanges) > 0
]{
	_id,
	title,
	"changes": internal.feedImport.pendingChanges[]{ field, changeType, oldValue, newValue, detectedAt }
} | order(_id)`;

function toneFor(changeType: string | undefined): 'primary' | 'caution' | 'critical' | 'default' {
	if (changeType === 'conflict') return 'caution';
	if (changeType === 'removed') return 'critical';
	if (changeType === 'update') return 'primary';
	return 'default';
}

function ChangeRow({ change }: { change: PendingChange }) {
	return (
		<Flex align="center" gap={2} wrap="wrap">
			<Badge tone={toneFor(change.changeType)} fontSize={0} mode="outline">
				{change.changeType || 'change'}
			</Badge>
			<Text size={1} weight="semibold">
				{change.field}
			</Text>
			<Text size={1} muted>
				{change.oldValue ?? '—'} → {change.newValue ?? '—'}
			</Text>
		</Flex>
	);
}

function ListingCard({ listing }: { listing: ChangedListing }) {
	const router = useRouter();
	const open = useCallback(
		() => router.navigateIntent('edit', { id: listing._id, type: 'propertyListing' }),
		[router, listing._id]
	);
	return (
		<Card padding={3} radius={2} border>
			<Flex align="flex-start" gap={3}>
				<Box flex={1}>
					<Stack space={3}>
						<Flex align="center" gap={2} wrap="wrap">
							<Text weight="semibold" size={2}>
								{listing.title || listing._id}
							</Text>
							<Badge fontSize={0} tone="default">
								{listing.changes.length} change{listing.changes.length === 1 ? '' : 's'}
							</Badge>
						</Flex>
						<Stack space={2}>
							{listing.changes.map((c, i) => (
								<ChangeRow key={`${c.field}-${i}`} change={c} />
							))}
						</Stack>
						<Text size={0} muted>
							{listing._id}
						</Text>
					</Stack>
				</Box>
				<Button mode="ghost" text="Open" onClick={open} fontSize={1} />
			</Flex>
		</Card>
	);
}

function FeedChangesTool() {
	const client = useClient({ apiVersion: '2025-05-01' });
	const [rows, setRows] = useState<ChangedListing[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(() => {
		setRows(null);
		setError(null);
		client
			.fetch<ChangedListing[]>(QUERY)
			.then(setRows)
			.catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
	}, [client]);

	useEffect(() => load(), [load]);

	const total = rows?.reduce((n, r) => n + r.changes.length, 0) ?? 0;

	return (
		<Container width={2} paddingX={4} paddingY={5}>
			<Stack space={4}>
				<Flex align="center" justify="space-between">
					<Stack space={2}>
						<Heading size={2}>Feed changes</Heading>
						<Text size={1} muted>
							Listings the feed has changed since the last sync, awaiting review. Nothing is
							auto-applied — open a listing to accept or alter each change.
						</Text>
					</Stack>
					<Button mode="ghost" icon={SyncIcon} text="Refresh" onClick={load} />
				</Flex>

				{error ? (
					<Card padding={4} radius={2} tone="critical" border>
						<Text size={1}>Failed to load: {error}</Text>
					</Card>
				) : rows === null ? (
					<Flex align="center" justify="center" padding={5}>
						<Spinner muted />
					</Flex>
				) : rows.length === 0 ? (
					<Card padding={4} radius={2} tone="positive" border>
						<Text size={1}>No pending feed changes. Everything is in sync.</Text>
					</Card>
				) : (
					<Stack space={3}>
						<Inline space={2}>
							<Badge tone="default">{rows.length} listing{rows.length === 1 ? '' : 's'}</Badge>
							<Badge tone="primary">{total} change{total === 1 ? '' : 's'}</Badge>
						</Inline>
						{rows.map((listing) => (
							<ListingCard key={listing._id} listing={listing} />
						))}
					</Stack>
				)}
			</Stack>
		</Container>
	);
}

export const feedChangesTool: Tool = {
	name: 'feed-changes',
	title: 'Feed changes',
	icon: SyncIcon,
	component: FeedChangesTool
};
