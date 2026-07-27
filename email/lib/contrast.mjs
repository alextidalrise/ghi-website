/**
 * WCAG 2.2 contrast maths.
 *
 * Email has no automated accessibility tooling worth the name: axe and Lighthouse
 * assume a browser document, and neither runs against the delivered source after
 * Mailchimp has rewritten it. So the ratios are computed here, from the inline
 * styles actually present in the built file.
 */

/**
 * Parse a CSS colour into 8-bit RGB. Handles the forms this system can emit:
 * #rgb, #rrggbb, rgb()/rgba(). Returns null for anything else (gradients,
 * `transparent`, `inherit`, named colours), which the caller treats as
 * "unknown, skip" rather than "fails".
 *
 * @param {string} input
 * @returns {{r:number,g:number,b:number,a:number}|null}
 */
export function parseColor(input) {
	if (typeof input !== 'string') return null;

	const value = input.trim().toLowerCase();

	const hex = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value);
	if (hex) {
		let digits = hex[1];

		if (digits.length <= 4) {
			digits = digits
				.split('')
				.map((d) => d + d)
				.join('');
		}

		return {
			r: parseInt(digits.slice(0, 2), 16),
			g: parseInt(digits.slice(2, 4), 16),
			b: parseInt(digits.slice(4, 6), 16),
			a: digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1
		};
	}

	const rgb = /^rgba?\(\s*([^)]+)\)$/.exec(value);
	if (rgb) {
		const parts = rgb[1].split(/[,/\s]+/).filter(Boolean);
		if (parts.length < 3) return null;

		const channel = (raw) => {
			const n = raw.endsWith('%') ? (parseFloat(raw) / 100) * 255 : parseFloat(raw);
			return Number.isFinite(n) ? Math.min(255, Math.max(0, n)) : null;
		};

		const r = channel(parts[0]);
		const g = channel(parts[1]);
		const b = channel(parts[2]);
		if (r === null || g === null || b === null) return null;

		const a = parts[3] === undefined ? 1 : parseFloat(parts[3]);
		return { r, g, b, a: Number.isFinite(a) ? a : 1 };
	}

	return null;
}

/** WCAG relative luminance. */
export function relativeLuminance({ r, g, b }) {
	const channel = (value) => {
		const c = value / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};

	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Composite a possibly-translucent foreground over an opaque background, so a
 * ratio for `rgba(...)` ink is measured against what the eye actually sees.
 */
function flatten(fg, bg) {
	if (fg.a >= 1) return fg;

	return {
		r: fg.r * fg.a + bg.r * (1 - fg.a),
		g: fg.g * fg.a + bg.g * (1 - fg.a),
		b: fg.b * fg.a + bg.b * (1 - fg.a),
		a: 1
	};
}

/**
 * Contrast ratio between two colours, 1 to 21.
 * @param {string|object} foreground
 * @param {string|object} background
 * @returns {number|null} null when either colour could not be parsed
 */
export function contrastRatio(foreground, background) {
	const bg = typeof background === 'string' ? parseColor(background) : background;
	const rawFg = typeof foreground === 'string' ? parseColor(foreground) : foreground;

	if (!bg || !rawFg) return null;

	const fg = flatten(rawFg, bg);

	const l1 = relativeLuminance(fg);
	const l2 = relativeLuminance(bg);

	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);

	return (lighter + 0.05) / (darker + 0.05);
}

/** Round the way contrast reporting conventionally does: down, to 2dp. */
export function formatRatio(ratio) {
	if (ratio === null) return 'unknown';
	return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
}

/**
 * The AA threshold for a given text size.
 *
 * WCAG "large text" is >= 18.66px bold or >= 24px regular. Note that this is
 * NOT the same as the commonly-quoted 18px; using 18px here would wave through
 * text that genuinely fails.
 *
 * @param {number} fontSizePx
 * @param {boolean} bold
 */
export function requiredRatio(fontSizePx, bold = false) {
	const isLarge = bold ? fontSizePx >= 18.66 : fontSizePx >= 24;
	return isLarge ? 3 : 4.5;
}

/**
 * @param {string} fg
 * @param {string} bg
 * @param {number} min
 */
export function passes(fg, bg, min = 4.5) {
	const ratio = contrastRatio(fg, bg);
	return ratio !== null && ratio >= min;
}
