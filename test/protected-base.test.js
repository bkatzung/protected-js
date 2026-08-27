/**
 * Tests for Base class protected properties pattern
 */

import { assertEquals, assertExists, assertStrictEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Base, _GET, _SUB } from '../protected-base.js';

Deno.test('Base class - should create an instance successfully', () => {
	const instance = new Base();
	assertExists(instance);
	assertEquals(instance instanceof Base, true);
});

Deno.test('Base class - should have _GET method', () => {
	const instance = new Base();
	assertEquals(typeof instance[_GET], 'function');
});

Deno.test('Base class - should have _SUB method', () => {
	const instance = new Base();
	assertEquals(typeof instance[_SUB], 'function');
});

Deno.test('Base class - should not expose #_ directly', () => {
	const instance = new Base();
	assertEquals(instance._, undefined);
	assertEquals(instance['#_'], undefined);
});

Deno.test('Base class - should distribute protected properties to subscribers', () => {
	class TestSub extends Base {
		#_;
		received_ = null;

		constructor() {
			super();
			this[_GET]();
			this.received_ = this.#_;
		}

		[_SUB](subs) {
			super[_SUB](subs);
			subs.add((g) => this.#_ ||= g);
		}
	}

	const sub = new TestSub();
	assertExists(sub.received_);
	assertEquals(typeof sub.received_, 'object');
});

Deno.test('Base class - should only set protected once with ||= operator', () => {
	class TestSub extends Base {
		#_;

		constructor() {
			super();
			this[_GET]();
			this.#_.original = true;
		}

		[_SUB](subs) {
			super[_SUB](subs);
			subs.add((g) => this.#_ ||= g);
		}

		get_() {
			return this.#_;
		}
	}

	const sub = new TestSub();
	assertEquals(sub.get_().original, true);
	
	// Try to alter protected after it's set
	const newSubs = new Set();
	const altered = { altered: true };
	sub[_SUB](newSubs);
	for (const newSub of newSubs) {
		newSub(altered);
	}
	// Should still have original value
	assertEquals(sub.get_().original, true);
	assertEquals(sub.get_().altered, undefined);
});
