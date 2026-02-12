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

Deno.test('Base class - should have _getGuarded method', () => {
	const instance = new Base();
	assertEquals(typeof instance._getGuarded, 'function');
});

Deno.test('Base class - should have _subGuarded method', () => {
	const instance = new Base();
	assertEquals(typeof instance._subGuarded, 'function');
});

Deno.test('Base class - should not expose #guarded directly', () => {
	const instance = new Base();
	assertEquals(instance.guarded, undefined);
	assertEquals(instance['#guarded'], undefined);
});

Deno.test('Base class - should distribute guarded properties to subscribers', () => {
	class TestSub extends Base {
		#guarded;
		receivedGuarded = null;

		constructor() {
			super();
			this._getGuarded();
			this.receivedGuarded = this.#guarded;
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}
	}

	const sub = new TestSub();
	assertExists(sub.receivedGuarded);
	assertEquals(typeof sub.receivedGuarded, 'object');
});

Deno.test('Base class - should only set guarded once with ||= operator', () => {
	class TestSub extends Base {
		#guarded;

		constructor() {
			super();
			this._getGuarded();
			this.#guarded.original = true;
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}

		getGuarded() {
			return this.#guarded;
		}
	}

	const sub = new TestSub();
	assertEquals(sub.getGuarded(), { original: true });
	
	// Try to alter guarded after it's set
	const newSubs = new Set();
	const altered = { altered: true };
	sub._subGuarded(newSubs);
	for (const newSub of newSubs) {
		newSub(altered);
	}
	// Should still have original value
	assertEquals(sub.getGuarded(), { original: true });
});
