/**
 * Maizzle production config.
 *
 * This produces the file that is uploaded to Mailchimp. Its output is committed
 * to `build_production/`, so a pull request shows the exact HTML that will be
 * sent, not just the source that generates it.
 *
 * Critical presentation CSS is already written inline by the components, so
 * `css.inline` stays OFF. Turning it on would drag the client resets and the
 * dark-mode rules out of the <style> block and onto elements, which both bloats
 * the file and defeats the resets (an inlined reset cannot be overridden by the
 * media query that needs to override it).
 */

export default {
	build: {
		content: ['src/templates/**/*.html'],
		output: {
			path: 'build_production',
			from: ['src/templates']
		}
	},

	css: {
		/*
		 * Off by design. See the note above and docs/01-technical-standard.md.
		 * The <style> block is deliberately limited to resets, the single
		 * responsive breakpoint, and dark-mode enhancements.
		 */
		inline: false,

		/*
		 * email-comb removes classes with no matching rule and rules with no
		 * matching class. Worth keeping even with a hand-written stylesheet:
		 * it catches a component that stops using a responsive class without
		 * anyone removing the rule.
		 */
		purge: {
			safelist: [
				/* Client hooks that exist in CSS but never in our markup. */
				'.im',
				'.yshortcuts',
				'#body',
				'#MessageViewBody',
				/* Dark-mode classes, referenced by attribute selectors. */
				'.dm-*',
				'[data-ogsc]*',
				'[data-ogsb]*'
			]
		},

		/* `margin: 0 0 24px 0` becomes `margin: 0 0 24px`. Small, free. */
		shorthand: true,

		/*
		 * #fff becomes #ffffff. Three-digit hex is unreliable in older Outlook
		 * and in some Android clients, which render it as black.
		 */
		sixHex: true
	},

	/*
	 * `mc:edit` is only meaningful when it names a region. A component used
	 * without an `edit` prop would otherwise emit `mc:edit=""`, which Mailchimp
	 * reads as an unnamed editable region and which makes the locked/editable
	 * boundary ambiguous to both a marketer and the API.
	 *
	 * Maizzle always strips empty `style` and `class` on top of this list.
	 * `alt` is deliberately NOT included: `alt=""` is the correct, meaningful
	 * marking for a decorative image and must survive.
	 */
	attributes: {
		remove: [{ name: 'mc:edit', value: '' }]
	},

	/*
	 * Every byte counts against the ~102KB Gmail clipping threshold, and
	 * Mailchimp adds to the file after we hand it over (tracking URLs, footer
	 * markup). `lineLengthLimit` keeps the source diffable in review rather
	 * than collapsing it to a single unreadable line.
	 */
	prettify: false,
	minify: {
		lineLengthLimit: 500,
		removeIndentations: true,
		/*
		 * 1 = strip ordinary HTML comments, KEEP Outlook conditionals.
		 *
		 * The components carry substantial explanatory comments, which is right
		 * for a foundation people have to maintain, but roughly 6KB of them must
		 * not ship: every byte counts against the ~102KB Gmail clipping
		 * threshold, and the comments are for maintainers, not recipients.
		 *
		 * It must not be 2. That would also strip `<!--[if mso]>` blocks, which
		 * would silently remove every Outlook fix in the build.
		 */
		removeHTMLComments: 1,
		breakToTheLeftOf: ['</td', '<html', '<head', '<body', '</body', '</html']
	}

	/*
	 * Deliberately NO `urlParameters`.
	 *
	 * Maizzle can append UTM parameters to every href at build time, but it
	 * would also rewrite `*|UNSUB|*` and `*|ARCHIVE|*`, appending a query string
	 * to a string Mailchimp has not resolved into a URL yet. It would also
	 * double up with Mailchimp's own "add Google Analytics tracking" campaign
	 * option, which appends utm parameters at send time.
	 *
	 * Campaign links carry their own UTMs in the content, where they are visible
	 * and reviewable. `bin/validate.mjs` warns on any campaign link missing
	 * them, and never touches merge-tag hrefs.
	 */
};
