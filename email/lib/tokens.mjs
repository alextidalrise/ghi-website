/**
 * Golf Homes International — email design tokens.
 *
 * The single source of truth for the email system. `config.js` (which exposes
 * them to every component as `page.*`), the validator, the plain-text generator
 * and the QA harness all read from here, so a colour or size exists in exactly
 * one place.
 *
 * These are deliberately NOT a direct import of `web/src/lib/styles/tokens.css`.
 * The web tokens use `clamp()`, `oklch()` and `color-mix()`, none of which are
 * safe in email. Where a value diverges from the site, the reason is noted.
 * See docs/02-brand-rules.md for the full translation table.
 */

/* -------------------------------------------------------------------------- */
/* Colour                                                                      */
/* -------------------------------------------------------------------------- */

export const color = {
	/* Light mode — identical to the site. */
	green: '#1f3d34',
	gold: '#d6c3a3',
	white: '#ffffff',
	onGreen: '#f5f1e8',
	charcoal: '#2b2b2b',
	border: '#e2ded5',
	muted: '#6b6b6b',

	/*
	 * Dark mode — from the DESIGN.md inversion table. Applied through the
	 * `dm-*` classes in the embedded style block, never inlined.
	 *
	 * `--green` does NOT invert to #C5D6C0 for *surfaces*. On the site that
	 * value is green-as-ink on a dark ground. The masthead and footer keep the
	 * real green ground in dark mode, which is the entire point of the bookend
	 * strategy: a dark ground is what inverting clients leave alone.
	 */
	darkPage: '#0e1410', // outer canvas, from --hero-dark
	darkBody: '#1c231e', // the white body surface, inverted
	darkInk: '#e8e5df', // --charcoal inverted
	darkMuted: '#8a8a8a', // 4.6:1 on darkBody
	darkBorder: '#2a332c',
	darkGreenInk: '#c5d6c0' // green-as-ink; also the CTA edge on dark
};

/*
 * Foreground/background pairs the validator checks. Every text colour used in
 * the system must appear here against every ground it can land on, so a new
 * combination cannot ship without a measured ratio.
 *
 * `min` is the WCAG 2.2 AA floor for that pair's role:
 *   4.5 normal text, 3.0 large text (>=18.66px, or >=14px bold) and non-text
 *   UI boundaries.
 */
export const contrastPairs = [
	{ name: 'body on white', fg: color.charcoal, bg: color.white, min: 4.5 },
	{ name: 'muted on white', fg: color.muted, bg: color.white, min: 4.5 },
	{ name: 'heading on white', fg: color.green, bg: color.white, min: 4.5 },
	{ name: 'link on white', fg: color.green, bg: color.white, min: 4.5 },
	{ name: 'ivory on green', fg: color.onGreen, bg: color.green, min: 4.5 },
	{ name: 'gold on green', fg: color.gold, bg: color.green, min: 4.5 },
	{ name: 'CTA label on green fill', fg: color.onGreen, bg: color.green, min: 4.5 },
	{ name: 'dark: ink on body', fg: color.darkInk, bg: color.darkBody, min: 4.5 },
	{ name: 'dark: muted on body', fg: color.darkMuted, bg: color.darkBody, min: 4.5 },
	{ name: 'dark: ivory on green', fg: color.onGreen, bg: color.green, min: 4.5 },
	{ name: 'dark: CTA edge on body', fg: color.darkGreenInk, bg: color.darkBody, min: 3 },
	{ name: 'dark: gold on green', fg: color.gold, bg: color.green, min: 4.5 }
];

/*
 * Colours banned as a text colour on a light ground. Gold measures ~1.7:1 on
 * white; it is an accent and a fill, never body or link ink on a pale surface.
 */
export const bannedTextOnLight = [color.gold, color.onGreen, color.border, color.white];

/* -------------------------------------------------------------------------- */
/* Typography                                                                  */
/* -------------------------------------------------------------------------- */

/*
 * Fallback-first. Georgia and Arial ARE the design baseline: Gmail (all
 * platforms) and both Outlooks for Windows ignore web fonts entirely, so the
 * majority of opens never see Playfair or Libre Franklin. Every size below was
 * chosen against the fallback metrics, not the web font.
 *
 * Georgia runs wide and has a large x-height relative to Playfair, so the
 * display sizes sit lower than the site's equivalent steps.
 */
/*
 * Unquoted on purpose. CSS accepts a font family as a sequence of identifiers,
 * so `Playfair Display` is valid without quotes. Quoting it means the build
 * emits `&#039;` inside every style attribute: six bytes instead of one, on
 * every text element, and a dependency on the client's HTML parser decoding
 * entities before its CSS parser sees the value. Word's engine is not reliable
 * about that ordering.
 */
export const fontFamily = {
	serif: 'Playfair Display, Georgia, Times New Roman, Times, serif',
	sans: 'Libre Franklin, Arial, Helvetica Neue, Helvetica, sans-serif'
};

/*
 * Weight note: the site's body weight is Libre Franklin Light 300. Arial has no
 * light weight, so ~85% of recipients would see Regular regardless. The email
 * system standardises on 400 for body and 600 for display, and the site's
 * light-on-dark compensation (weight 350) does not translate.
 */
export const fontWeight = {
	body: '400',
	medium: '500',
	display: '600'
};

/* size / line-height pairs, in px. Ratio between heading steps >= 1.26. */
export const fontSize = {
	display: { size: 34, leading: 39 }, // 1.15
	h2: { size: 24, leading: 29 }, // 1.2
	h3: { size: 19, leading: 25 }, // 1.3
	lead: { size: 18, leading: 29 }, // 1.6
	body: { size: 16, leading: 26 }, // 1.625
	ui: { size: 14, leading: 21 },
	legal: { size: 13, leading: 21 }, // floor for legal/footer copy
	overline: { size: 11, leading: 11 }
};

/* Mobile overrides, applied via the single max-600px media query. */
export const fontSizeMobile = {
	display: { size: 28, leading: 33 },
	h2: { size: 22, leading: 27 },
	lead: { size: 17, leading: 27 }
};

export const tracking = {
	display: '-0.01em', // Georgia needs far less negative tracking than Playfair
	normal: '0',
	wide: '0.04em',
	overline: '0.12em'
};

/* -------------------------------------------------------------------------- */
/* Spacing and layout                                                          */
/* -------------------------------------------------------------------------- */

/*
 * 8px base, same as the site. The site's --section-gap (up to 112px) does not
 * translate: at 600px wide it reads as an accidentally blank screen. Email
 * section rhythm tops out at 56px.
 */
export const spacing = [0, 1, 2, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64];

export const layout = {
	contentWidth: 600,
	gutter: 32, // desktop side padding inside the 600px column
	gutterMobile: 24,
	sectionGap: 56,
	blockGap: 40,
	elementGap: 24
};

/* -------------------------------------------------------------------------- */
/* Budgets                                                                     */
/* -------------------------------------------------------------------------- */

export const budget = {
	/*
	 * Gmail clips at ~102KB of delivered HTML. Mailchimp rewrites every href
	 * into a tracking URL (~150 bytes each) and injects footer markup after we
	 * hand the file over, so compiled size systematically understates delivered
	 * size. 60KB compiled is the working target; 102KB is the hard delivered
	 * ceiling. See docs/04-qa-plan.md.
	 */
	compiledWarnBytes: 60 * 1024,
	deliveredErrorBytes: 102 * 1024,

	/* Per-campaign image weight, for acceptable loading on mobile data. */
	imageTotalWarnBytes: 600 * 1024,

	/* Copy ceilings, enforced by the validator so long content is caught at
	 * build time rather than in an inbox. */
	maxPreheaderChars: 140,
	maxSubjectChars: 60,
	maxCtaLabelChars: 28,
	maxDisplayHeadingChars: 90,

	/* Brand rationing, ported from the DESIGN.md Emphasis Ladder. */
	maxOverlinesPerEmail: 1,
	maxGreenBandsPerBody: 1 // masthead and footer are chrome, excluded
};

/* -------------------------------------------------------------------------- */
/* Images                                                                      */
/* -------------------------------------------------------------------------- */

export const image = {
	/*
	 * Serve at 2x the display slot for retina, constrained by CSS to the slot.
	 * `fm` is pinned rather than negotiated: the site's `.auto('format')` sends
	 * AVIF/WebP, and classic Outlook plus several mobile clients render neither.
	 */
	defaultQuality: 78,
	fullWidthSlot: 600,
	fullWidthSource: 1200,
	allowedFormats: ['jpg', 'png', 'gif'],
	photoFormat: 'jpg',
	graphicFormat: 'png'
};
