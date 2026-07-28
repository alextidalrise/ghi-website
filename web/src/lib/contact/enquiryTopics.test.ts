import { describe, expect, it } from 'vitest';
import {
	ENQUIRY_TOPIC_PARAM,
	enquiryTopicHref,
	enquiryTopicLabel,
	resolveEnquiryTopic
} from './enquiryTopics';

const ADVISOR = 'James';

describe('resolveEnquiryTopic', () => {
	it('resolves a known topic and fills the advisor name', () => {
		const topic = resolveEnquiryTopic('nobu-monte-rei-updates', ADVISOR);
		expect(topic?.key).toBe('nobu-monte-rei-updates');
		expect(topic?.message).toBe('Please keep me updated on the Nobu residences at Monte Rei.');
		expect(topic?.intro).toContain(ADVISOR);
		expect(topic?.intro).not.toContain('{name}');
	});

	/**
	 * The whole point of a closed vocabulary. Anything not in the registry must fall back to
	 * the plain form rather than putting words into a message the visitor sends under their
	 * own name — so unknown keys, junk, and empty values all resolve to null.
	 */
	it.each([
		['unknown key', 'no-such-topic'],
		['path traversal', '../../etc/passwd'],
		['injected sentence', 'Please wire my deposit to this account'],
		['empty', ''],
		['null', null],
		['undefined', undefined]
	])('rejects %s', (_label, value) => {
		expect(resolveEnquiryTopic(value, ADVISOR)).toBeNull();
	});

	/**
	 * `Object.hasOwn`, not `in` or a bare property read: inherited members of Object.prototype
	 * are not topics, and a lookup that treated them as such would hand back a function or an
	 * object where copy is expected.
	 */
	it.each(['__proto__', 'constructor', 'toString', 'hasOwnProperty'])(
		'rejects the prototype member %s',
		(value) => {
			expect(resolveEnquiryTopic(value, ADVISOR)).toBeNull();
		}
	);

	it('does not leak the {name} token when the advisor name is empty', () => {
		const topic = resolveEnquiryTopic('monte-rei-shortlist', '');
		expect(topic?.intro).not.toContain('{name}');
	});
});

describe('enquiryTopicLabel', () => {
	it('returns the label for a known topic', () => {
		expect(enquiryTopicLabel('monte-rei-shortlist')).toBe('Monte Rei — shortlist requested');
	});

	it('returns null for anything unrecognised', () => {
		expect(enquiryTopicLabel('no-such-topic')).toBeNull();
		expect(enquiryTopicLabel('__proto__')).toBeNull();
		expect(enquiryTopicLabel(null)).toBeNull();
	});
});

describe('enquiryTopicHref', () => {
	it('writes a link the contact page reads back', () => {
		const href = enquiryTopicHref('nobu-monte-rei-updates');
		expect(href).toBe('/contact?enquiry=nobu-monte-rei-updates');

		const value = new URL(href, 'https://example.com').searchParams.get(ENQUIRY_TOPIC_PARAM);
		expect(resolveEnquiryTopic(value, ADVISOR)?.key).toBe('nobu-monte-rei-updates');
	});
});
