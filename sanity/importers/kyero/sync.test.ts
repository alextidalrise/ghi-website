import { describe, expect, it } from 'vitest';
import { reconcileExisting, reconcileRemoval, type ExistingDraft } from './sync';
import { buildSnapshot, snapshotFingerprint } from './build-draft';
import type { KyeroProperty } from './types';

const NOW = '2026-08-16T00:00:00.000Z';

function feed(overrides: Partial<KyeroProperty> = {}): KyeroProperty {
	return {
		id: '1',
		ref: 'MS-1',
		date: '',
		notes: '',
		price: '250000',
		currency: 'EUR',
		priceFreq: 'sale',
		newBuild: '0',
		type: 'villa',
		town: 'Benijofar',
		province: 'Alicante',
		country: 'Spain',
		latitude: '',
		longitude: '',
		beds: '3',
		baths: '2',
		pool: '1',
		built: '',
		plot: '',
		videoUrl: '',
		descEn: 'A lovely villa near the golf course.',
		descPl: '',
		urlEn: '',
		features: [],
		imageUrls: ['https://cdn/a.jpg', 'https://cdn/b.jpg'],
		...overrides
	};
}

/** An existing draft whose stored snapshot + live values match the given feed record. */
function draftFrom(p: KyeroProperty, extra: Partial<ExistingDraft> = {}): ExistingDraft {
	const snap = buildSnapshot(p);
	return {
		_id: 'kyero-import-ms-1',
		snapshotJson: JSON.stringify(snap),
		pendingChanges: [],
		reviewItems: [],
		current: {
			price: snap.price,
			transactionType: snap.transactionType,
			propertyType: snap.propertyType,
			buildStatus: snap.buildStatus,
			bedrooms: snap.bedrooms,
			bathrooms: snap.bathrooms,
			builtArea: snap.builtArea,
			plotSize: snap.plotSize,
			pool: snap.pool,
			videoUrl: snap.videoUrl,
			shortDescription: snap.shortDescription
		},
		...extra
	};
}

describe('buildSnapshot / fingerprint', () => {
	it('is stable regardless of image order', () => {
		const a = buildSnapshot(feed({ imageUrls: ['https://cdn/b.jpg', 'https://cdn/a.jpg'] }));
		const b = buildSnapshot(feed({ imageUrls: ['https://cdn/a.jpg', 'https://cdn/b.jpg'] }));
		expect(snapshotFingerprint(a)).toBe(snapshotFingerprint(b));
	});
});

describe('reconcileExisting', () => {
	it('baselines a doc that has no stored snapshot yet (no flags)', () => {
		const p = feed();
		const existing = draftFrom(p, { snapshotJson: null });
		const r = reconcileExisting(existing, p, NOW);
		expect(r.action).toBe('baseline');
		expect(r.set['internal.feedImport.snapshotJson']).toBe(JSON.stringify(buildSnapshot(p)));
		expect(r.set.reviewItems).toBeUndefined();
	});

	it('skips (unchanged) when the feed matches the stored snapshot', () => {
		const p = feed();
		const r = reconcileExisting(draftFrom(p), p, NOW);
		expect(r.action).toBe('unchanged');
		expect(r.set).toEqual({});
	});

	it('classifies a feed change to an untouched field as an "update"', () => {
		const previous = feed({ price: '250000' });
		const existing = draftFrom(previous); // doc + snapshot both at 250000
		const nowFeed = feed({ price: '239000' }); // feed moved; doc untouched
		const r = reconcileExisting(existing, nowFeed, NOW);
		expect(r.action).toBe('changed');
		expect(r.updates).toBe(1);
		expect(r.conflicts).toBe(0);
		const pending = r.set['internal.feedImport.pendingChanges'] as Array<Record<string, unknown>>;
		expect(pending).toHaveLength(1);
		expect(pending[0]).toMatchObject({ field: 'price', changeType: 'update' });
		const review = r.set.reviewItems as Array<Record<string, unknown>>;
		expect(review[0]).toMatchObject({ _key: 'ri-fc-price', blocksPublish: true, category: 'price' });
	});

	it('classifies a feed change to a human-edited field as a "conflict"', () => {
		const previous = feed({ price: '250000' });
		const existing = draftFrom(previous);
		existing.current.price = 245000; // human edited the doc away from the snapshot
		const nowFeed = feed({ price: '239000' }); // feed also moved
		const r = reconcileExisting(existing, nowFeed, NOW);
		expect(r.action).toBe('changed');
		expect(r.conflicts).toBe(1);
		const review = r.set.reviewItems as Array<Record<string, unknown>>;
		expect(String(review[0].label)).toContain('conflicts with your edit');
	});

	it('flags image add/remove without auto-applying', () => {
		const previous = feed({ imageUrls: ['https://cdn/a.jpg', 'https://cdn/b.jpg'] });
		const existing = draftFrom(previous);
		const nowFeed = feed({ imageUrls: ['https://cdn/a.jpg', 'https://cdn/c.jpg'] }); // b removed, c added
		const r = reconcileExisting(existing, nowFeed, NOW);
		expect(r.action).toBe('changed');
		expect(r.imageFlag).toBe(true);
		const review = r.set.reviewItems as Array<Record<string, unknown>>;
		expect(review.some((it) => it._key === 'ri-fc-images')).toBe(true);
	});

	it('upserts flags on re-detection instead of duplicating', () => {
		const previous = feed({ price: '250000' });
		const stale = { _type: 'reviewItem', _key: 'ri-fc-price', label: 'old', blocksPublish: true, category: 'price' };
		const existing = draftFrom(previous, { reviewItems: [stale as never] });
		const nowFeed = feed({ price: '239000' });
		const r = reconcileExisting(existing, nowFeed, NOW);
		const review = r.set.reviewItems as Array<Record<string, unknown>>;
		expect(review.filter((it) => it._key === 'ri-fc-price')).toHaveLength(1);
		expect(review[review.length - 1].label).not.toBe('old');
	});
});

describe('reconcileRemoval', () => {
	it('flags a vanished listing without deleting it', () => {
		const set = reconcileRemoval(draftFrom(feed()), NOW);
		const review = set.reviewItems as Array<Record<string, unknown>>;
		expect(review[0]).toMatchObject({ _key: 'ri-fc-removed', blocksPublish: true, category: 'internal' });
		const pending = set['internal.feedImport.pendingChanges'] as Array<Record<string, unknown>>;
		expect(pending[0]).toMatchObject({ field: '_listing', changeType: 'removed' });
	});
});
