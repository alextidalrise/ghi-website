import { describe, expect, it, vi } from 'vitest';
import type { MediaAssetInput } from './mediaFilter';

vi.mock('../image', () => ({
	getImagePlaceholder: vi.fn(() => null),
	buildPublicImageUrl: vi.fn((asset: MediaAssetInput | null | undefined) =>
		asset ? 'https://cdn.example/course.jpg' : null
	),
	buildImageSrcset: vi.fn(() => 'https://cdn.example/course.jpg 800w')
}));

const { toInsightCourseCard, toInsightCourseCards } = await import('./insightCourseCard');

type ItemRaw = Parameters<typeof toInsightCourseCard>[0];
type CourseRaw = NonNullable<NonNullable<ItemRaw>['golfCourse']>;

const course = (over: Partial<CourseRaw> = {}): CourseRaw => ({
	_id: 'gc-monte-rei',
	name: 'Monte Rei Golf & Country Club',
	slug: 'monte-rei-north',
	tagline: 'A Jack Nicklaus Signature course',
	communityName: 'Monte Rei',
	communitySlug: 'monte-rei',
	locationSlug: 'monte-rei',
	countryName: 'Portugal',
	countrySlug: 'portugal',
	media: { asset: { asset: { _ref: 'm' } }, altText: 'Course fairway' } as unknown as MediaAssetInput,
	...over
});

const item = (over: Partial<NonNullable<ItemRaw>> = {}): ItemRaw => ({
	golfCourse: course(),
	...over
});

describe('toInsightCourseCard', () => {
	it('builds the full canonical golf route including the community segment', () => {
		const card = toInsightCourseCard(item());
		expect(card).not.toBeNull();
		expect(card!.href).toBe('/portugal/monte-rei/monte-rei/golf/monte-rei-north');
	});

	it('builds the place label from community and country', () => {
		expect(toInsightCourseCard(item())!.placeLabel).toBe('Monte Rei, Portugal');
	});

	it('defaults the CTA label to "View course" and honours an override', () => {
		expect(toInsightCourseCard(item())!.actionLabel).toBe('View course');
		expect(toInsightCourseCard(item({ actionLabel: 'Explore the course' }))!.actionLabel).toBe(
			'Explore the course'
		);
	});

	it('prefers an explicit alt override, then the image alt, then the name', () => {
		expect(
			toInsightCourseCard(
				item({
					imageOverride: { asset: { asset: { _ref: 'x' } }, altText: 'Override alt' } as unknown as MediaAssetInput,
					altOverride: 'Signature 18th'
				})
			)!.alt
		).toBe('Signature 18th');
		expect(toInsightCourseCard(item())!.alt).toBe('Course fairway');
		expect(
			toInsightCourseCard(item({ golfCourse: course({ media: { asset: { asset: { _ref: 'm' } } } as unknown as MediaAssetInput }) }))!
				.alt
		).toBe('Monte Rei Golf & Country Club');
	});

	it('fails closed on a null course, a missing name, a missing route segment, or no image', () => {
		expect(toInsightCourseCard({ golfCourse: null })).toBeNull();
		expect(toInsightCourseCard(item({ golfCourse: course({ name: '  ' }) }))).toBeNull();
		// A course whose community lacks a parent chain cannot build a route.
		expect(toInsightCourseCard(item({ golfCourse: course({ locationSlug: null }) }))).toBeNull();
		expect(toInsightCourseCard(item({ golfCourse: course({ media: null }) }))).toBeNull();
	});
});

describe('toInsightCourseCards', () => {
	it('maps items and drops the ones that fail closed, preserving order', () => {
		const cards = toInsightCourseCards([
			item(),
			{ golfCourse: null },
			item({ golfCourse: course({ _id: 'gc-2', name: 'Vilamoura Old Course', slug: 'old-course' }) })
		]);
		expect(cards.map((c) => c._id)).toEqual(['gc-monte-rei', 'gc-2']);
	});
});
