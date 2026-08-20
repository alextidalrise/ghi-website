/**
 * Epic 1.8 — pure re-sync reconciliation.
 *
 * Given an existing draft's current state and the feed's current values, decide what a
 * re-sync should do. The importer NEVER overwrites human work: it detects what the FEED
 * changed (by diffing the feed against the snapshot stored last sync), and surfaces every
 * change as a pending change + a blocking review item for HUMAN APPROVAL. Nothing is
 * auto-applied. The field-level "human-touched" test only classifies a change as an
 * `update` (feed changed a field nobody edited) or a `conflict` (feed changed a field a
 * human had edited) — it does not gate a write, because everything waits for approval.
 *
 * Pure: no client, no clock (caller passes `now`). Returns the patch payload + a summary;
 * the orchestrator (import.ts) commits it.
 */

import { buildSnapshot, snapshotFingerprint, type FeedSnapshot } from './build-draft';
import type { KyeroProperty } from './types';

export type ChangeType = 'update' | 'conflict' | 'removed';

interface ReviewItem {
	_type: 'reviewItem';
	_key: string;
	label: string;
	detail?: string;
	blocksPublish: boolean;
	category: string;
}
interface PendingChange {
	_type: 'feedPendingChange';
	_key: string;
	field: string;
	changeType: ChangeType;
	oldValue: string;
	newValue: string;
	detectedAt: string;
}

/** The live doc values the feed is authoritative for, projected with snapshot-matching keys. */
export interface ExistingDraft {
	_id: string;
	snapshotJson?: string | null;
	pendingChanges?: PendingChange[] | null;
	reviewItems?: ReviewItem[] | null;
	current: Partial<Record<ScalarField, unknown>>;
}

type ScalarField = Exclude<keyof FeedSnapshot, 'imageUrls'>;

const s = (v: unknown): string => (v == null || v === '' ? '—' : String(v));
const n = (v: unknown): string => (v == null ? '—' : String(v));
const money = (v: unknown): string => (v == null ? '—' : `€${Number(v).toLocaleString('en-GB')}`);
const copy = (v: unknown): string =>
	v == null || v === '' ? '—' : `"${String(v).slice(0, 60)}${String(v).length > 60 ? '…' : ''}"`;

/** Display label + review category + formatter for each tracked scalar field. */
const FIELD_META: Record<ScalarField, { label: string; category: string; fmt: (v: unknown) => string }> = {
	price: { label: 'price', category: 'price', fmt: money },
	transactionType: { label: 'transaction', category: 'facts', fmt: s },
	propertyType: { label: 'property type', category: 'facts', fmt: s },
	buildStatus: { label: 'build status', category: 'facts', fmt: s },
	bedrooms: { label: 'bedrooms', category: 'facts', fmt: n },
	bathrooms: { label: 'bathrooms', category: 'facts', fmt: n },
	builtArea: { label: 'built area', category: 'facts', fmt: n },
	plotSize: { label: 'plot size', category: 'facts', fmt: n },
	pool: { label: 'pool', category: 'facts', fmt: s },
	videoUrl: { label: 'video URL', category: 'media', fmt: s },
	shortDescription: { label: 'description', category: 'copy', fmt: copy }
};
const SCALAR_FIELDS = Object.keys(FIELD_META) as ScalarField[];

/** Empty-safe, number-aware equality (treats null/undefined/'' alike). */
function eq(a: unknown, b: unknown): boolean {
	const na = a == null || a === '' ? null : a;
	const nb = b == null || b === '' ? null : b;
	if (na === null || nb === null) return na === nb;
	if (typeof na === 'number' || typeof nb === 'number') return Number(na) === Number(nb);
	return na === nb;
}

function parseSnapshot(json?: string | null): FeedSnapshot | null {
	if (!json) return null;
	try {
		return JSON.parse(json) as FeedSnapshot;
	} catch {
		return null;
	}
}

/** Replace entries sharing a `_key` with the incoming ones; keep the rest untouched. */
function upsertByKey<T extends { _key: string }>(existing: T[], incoming: T[]): T[] {
	const keys = new Set(incoming.map((i) => i._key));
	return [...existing.filter((e) => !keys.has(e._key)), ...incoming];
}

export interface Reconciliation {
	action: 'baseline' | 'unchanged' | 'changed';
	/** Field patches to `set` (dot-paths). Empty for `unchanged`. */
	set: Record<string, unknown>;
	/** Human-readable one-liners for the run report. */
	notes: string[];
	updates: number;
	conflicts: number;
	imageFlag: boolean;
}

/**
 * Reconcile one existing draft against the feed. Never mutates the input.
 */
export function reconcileExisting(existing: ExistingDraft, p: KyeroProperty, now: string): Reconciliation {
	const newSnap = buildSnapshot(p);
	const oldSnap = parseSnapshot(existing.snapshotJson);

	// A doc imported before snapshots existed: adopt the current feed as the baseline, no flags.
	if (!oldSnap) {
		return {
			action: 'baseline',
			set: { 'internal.feedImport.snapshotJson': JSON.stringify(newSnap), 'internal.feedImport.lastSeenAt': now },
			notes: [],
			updates: 0,
			conflicts: 0,
			imageFlag: false
		};
	}

	if (snapshotFingerprint(oldSnap) === snapshotFingerprint(newSnap)) {
		return { action: 'unchanged', set: {}, notes: [], updates: 0, conflicts: 0, imageFlag: false };
	}

	const pending: PendingChange[] = [];
	const review: ReviewItem[] = [];
	const notes: string[] = [];
	let updates = 0;
	let conflicts = 0;

	for (const f of SCALAR_FIELDS) {
		if (eq(oldSnap[f], newSnap[f])) continue;
		const meta = FIELD_META[f];
		const docValue = existing.current[f];
		const touched = !eq(docValue, oldSnap[f]);
		const changeType: ChangeType = touched ? 'conflict' : 'update';
		touched ? conflicts++ : updates++;

		const from = meta.fmt(docValue);
		const to = meta.fmt(newSnap[f]);
		pending.push({
			_type: 'feedPendingChange',
			_key: `pc-${f}`,
			field: f,
			changeType,
			oldValue: from,
			newValue: to,
			detectedAt: now
		});
		review.push({
			_type: 'reviewItem',
			_key: `ri-fc-${f}`,
			label: `Feed ${meta.label} changed: ${from} → ${to}${touched ? ' (conflicts with your edit)' : ''}`,
			detail:
				'The feed changed this field. Review and, if you accept it, apply the new value to the real field, then delete this item.',
			blocksPublish: true,
			category: meta.category
		});
		notes.push(`${meta.label}: ${from} → ${to}${touched ? ' [conflict]' : ''}`);
	}

	// Images: additions and removals are flagged, never auto-applied (gallery order is curation).
	const oldImgs = new Set(oldSnap.imageUrls ?? []);
	const newImgs = new Set(newSnap.imageUrls ?? []);
	const added = [...newImgs].filter((u) => !oldImgs.has(u));
	const removed = [...oldImgs].filter((u) => !newImgs.has(u));
	const imageFlag = added.length > 0 || removed.length > 0;
	if (imageFlag) {
		const summary = `${added.length} added · ${removed.length} removed`;
		pending.push({
			_type: 'feedPendingChange',
			_key: 'pc-images',
			field: 'images',
			changeType: 'update',
			oldValue: `${oldImgs.size} in feed at last sync`,
			newValue: `${newImgs.size} in feed now (${summary})`,
			detectedAt: now
		});
		review.push({
			_type: 'reviewItem',
			_key: 'ri-fc-images',
			label: `Feed images changed: ${summary}`,
			detail:
				'The feed’s image set changed. New images are not auto-added and removed ones are not auto-deleted (gallery curation is yours). Run kyero:ingest-media to pull additions, and prune removed images if you wish.',
			blocksPublish: true,
			category: 'media'
		});
		notes.push(`images: ${summary}`);
	}

	return {
		action: 'changed',
		set: {
			'internal.feedImport.snapshotJson': JSON.stringify(newSnap),
			'internal.feedImport.lastSeenAt': now,
			'internal.feedImport.pendingChanges': upsertByKey(existing.pendingChanges ?? [], pending),
			reviewItems: upsertByKey(existing.reviewItems ?? [], review)
		},
		notes,
		updates,
		conflicts,
		imageFlag
	};
}

/**
 * Flag a listing that has vanished from the feed. Never deletes — records a pending change
 * and a blocking review item so a human decides whether to unpublish/archive.
 */
export function reconcileRemoval(existing: ExistingDraft, now: string): Record<string, unknown> {
	const pending: PendingChange = {
		_type: 'feedPendingChange',
		_key: 'pc-removed',
		field: '_listing',
		changeType: 'removed',
		oldValue: 'present in feed',
		newValue: 'absent from feed',
		detectedAt: now
	};
	const review: ReviewItem = {
		_type: 'reviewItem',
		_key: 'ri-fc-removed',
		label: 'Listing no longer in feed',
		detail:
			'This listing was not present in the latest feed. It is not auto-deleted — decide whether to unpublish or archive it, then delete this item.',
		blocksPublish: true,
		category: 'internal'
	};
	return {
		'internal.feedImport.pendingChanges': upsertByKey(existing.pendingChanges ?? [], [pending]),
		reviewItems: upsertByKey(existing.reviewItems ?? [], [review])
	};
}
