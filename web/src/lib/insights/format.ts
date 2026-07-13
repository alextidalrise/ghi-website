import type { InsightCard } from './types';

const WORDS_PER_MINUTE = 200;
/** English average including the trailing space; turns a char count into a word count. */
const CHARS_PER_WORD = 5.5;

type ReadingInput = Pick<InsightCard, 'bodyChars' | 'readingTimeOverride'>;

/** Reading time in whole minutes: the editor override, else derived from body length. */
export function readingMinutes(card: ReadingInput): number {
	if (card.readingTimeOverride && card.readingTimeOverride > 0) {
		return Math.round(card.readingTimeOverride);
	}
	const words = (card.bodyChars ?? 0) / CHARS_PER_WORD;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function readingLabel(card: ReadingInput): string {
	return `${readingMinutes(card)} min read`;
}

const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});
const SHORT_DATE = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric'
});

/** Human date, e.g. "12 June 2026" (long) or "12 Jun 2026" (short). Null if unparseable. */
export function formatInsightDate(
	iso: string | null | undefined,
	variant: 'long' | 'short' = 'long'
): string | null {
	if (!iso) return null;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return null;
	return (variant === 'short' ? SHORT_DATE : LONG_DATE).format(date);
}

/** Machine date (YYYY-MM-DD) for the <time datetime> attribute. Null if unparseable. */
export function insightDateISO(iso: string | null | undefined): string | null {
	if (!iso) return null;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return null;
	return date.toISOString().slice(0, 10);
}

/** One run of the headline. `emphasis` runs are set in the Playfair italic. */
export type TitleSegment = { text: string; emphasis: boolean };

/**
 * Split a headline around its italic phrase, so the hero can render
 * "The Quiet Luxury of <em>Golf Course Living</em>" while `title` stays a plain string
 * everywhere else (cards, SEO, structured data). The editor names the phrase rather than
 * writing markup, which keeps one source of truth for the headline.
 *
 * The first occurrence is emphasised, once. A phrase that doesn't appear in the title
 * (an edited headline, a stale field) degrades to the plain headline rather than
 * throwing — Studio validation is what tells the editor about the mismatch.
 */
export function splitTitleEmphasis(
	title: string | null | undefined,
	emphasis: string | null | undefined
): TitleSegment[] {
	const full = title ?? '';
	if (!full) return [];

	const phrase = emphasis?.trim() ?? '';
	const at = phrase ? full.indexOf(phrase) : -1;
	if (at === -1) return [{ text: full, emphasis: false }];

	return [
		{ text: full.slice(0, at), emphasis: false },
		{ text: phrase, emphasis: true },
		{ text: full.slice(at + phrase.length), emphasis: false }
	].filter((segment) => segment.text.length > 0);
}

/** Up to two initials for an avatar fallback, e.g. "Golf Homes International" → "GH". */
export function authorInitials(name: string | null | undefined): string {
	const parts = (name ?? '')
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (parts.length === 0) return '·';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
