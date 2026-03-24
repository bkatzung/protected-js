/**
 * Tests for Base class protected properties pattern
 */

import { assertEquals, assertExists, assertStrictEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Base } from '../protected-base.js';

Deno.test('Base class - should create an instance successfully', () => {
	const instance = new Base();
	assertExists(instance);
	assertEquals(instance instanceof Base, true);
});

Deno.test('Base class - should have _get_ method', () => {
	const instance = new Base();
	assertEquals(typeof instance._get_, 'function');
});

Deno.test('Base class - should have _sub_ method', () => {
	const instance = new Base();
	assertEquals(typeof instance._sub_, 'function');
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
			this._get_();
			this.received_ = this.#_;
		}

		_sub_(subs) {
			super._sub_(subs);
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
			this._get_();
			this.#_.original = true;
		}

		_sub_(subs) {
			super._sub_(subs);
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
	sub._sub_(newSubs);
	for (const newSub of newSubs) {
		newSub(altered);
	}
	// Should still have original value
	assertEquals(sub.get_().original, true);
	assertEquals(sub.get_().altered, undefined);
});
