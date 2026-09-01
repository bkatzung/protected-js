/**
 * Tests for Base class protected properties pattern
 */

import { assertEquals, assertExists, assertStrictEquals, assertThrows } from 'https://deno.land/std@0.208.0/assert/mod.ts';
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

		[_SUB](subFn) {
			const subToken = super[_SUB](subFn);
			return subFn(subToken, (g) => { this.#_ ||= g; });
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

		[_SUB](subFn) {
			const subToken = super[_SUB](subFn);
			return subFn(subToken, (g) => { this.#_ ||= g; });
		}

		get_() {
			return this.#_;
		}
	}

	const sub = new TestSub();
	assertEquals(sub.get_().original, true);
	
	// Try to alter protected after it's set
	const altered = { altered: true };
	try {
		sub[_SUB]((_token, cb) => {
			cb(altered);
		});
	} catch (_) {/**/}
	// Should still have original value
	assertEquals(sub.get_().original, true);
	assertEquals(sub.get_().altered, undefined);
});

Deno.test('Base class - [_SUB] should throw Unauthorized when called with no subFn', () => {
	const instance = new Base();
	assertThrows(
		() => instance[_SUB](),
		Error,
		'Unauthorized'
	);
	assertThrows(
		() => instance[_SUB](undefined),
		Error,
		'Unauthorized'
	);
});

Deno.test('Base class - [_SUB] should throw Unauthorized when called with non-constructor-supplied subFn', () => {
	const instance = new Base();
	assertThrows(
		() => instance[_SUB](() => {}),
		Error,
		'Unauthorized'
	);
	assertThrows(
		() => instance[_SUB]((_token, _cb) => {}),
		Error,
		'Unauthorized'
	);
	assertThrows(
		() => instance[_SUB](null),
		Error,
		'Unauthorized'
	);
	assertThrows(
		() => instance[_SUB]('notAFunction'),
		Error,
		'Unauthorized'
	);
});

Deno.test('Base class - subscriber function should throw Unauthorized when called with invalid token', () => {
	class BadSub extends Base {
		[_SUB](subFn) {
			const validToken = super[_SUB](subFn);
			// Attempt to call subFn with an unauthorized token
			subFn(Symbol('badToken'), () => {});
			return validToken;
		}
	}

	assertThrows(
		() => new BadSub(),
		Error,
		'Unauthorized'
	);
});

Deno.test('Base class - callProtectedLogger executes logState on protected prototype', () => {
	const instance = new Base();
	// Should execute without error and log state
	instance.callProtectedLogger();
});

Deno.test('Base class - Base.__protected has protoBase getter returning true', () => {
	assertEquals(Base.__protected.protoBase, true);
});

Deno.test('Base class - Base.__protected.logState throws Unauthorized if caller association is invalid', () => {
	const fakeProtectedState = {
		__this: new Base()
	};
	assertThrows(
		() => Base.__protected.logState.call(fakeProtectedState),
		Error,
		'Unauthorized'
	);
});

Deno.test('Base class - [_GET] handles subscriber callback throwing an error gracefully', () => {
	class ThrowingSub extends Base {
		[_SUB](subFn) {
			const subToken = super[_SUB](subFn);
			return subFn(subToken, () => {
				throw new Error('Subscriber error during distribution');
			});
		}
	}

	const instance = new ThrowingSub();
	// [_GET] should catch and swallow subscriber exception in try-catch
	instance[_GET]();
});

Deno.test('Base class - Base, Base.prototype, and Base.__protected are frozen', () => {
	assertEquals(Object.isFrozen(Base), true);
	assertEquals(Object.isFrozen(Base.prototype), true);
	assertEquals(Object.isFrozen(Base.__protected), true);
});
