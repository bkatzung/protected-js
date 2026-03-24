/**
 * Tests for Sub class protected properties pattern
 */

import { assertEquals, assertExists, assertThrows } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Base } from '../protected-base.js';

// Create a Sub class for testing
class Sub extends Base {
	#_;

	constructor() {
		super();
		this._get_();
	}

	_sub_(subs) {
		super._sub_(subs);
		subs.add((g) => this.#_ ||= g);
	}

	get_() {
		return this.#_;
	}

	setProtectedProp(key, value) {
		this.#_[key] = value;
	}

	getProtectedProp(key) {
		return this.#_[key];
	}

	// Pseudo-protected method
	guardedMethod(guarded) {
		if (guarded !== this.#_) throw new Error('Unauthorized method call');
		return 'authorized';
	}

	// Method to call guardedMethod on self
	callGuardedMethod() {
		return this.guardedMethod(this.#_);
	}

	// Method to call guardedMethod on another instance
	callOtherGuardedMethod(other) {
		return other.guardedMethod(other.#_);
	}
}

Deno.test('Sub class - should create an instance successfully', () => {
	const instance = new Sub();
	assertExists(instance);
	assertEquals(instance instanceof Sub, true);
	assertEquals(instance instanceof Base, true);
});

Deno.test('Sub class - should have access to protected properties', () => {
	const instance = new Sub();
	const _ = instance.get_();
	assertExists(_);
	assertEquals(typeof _, 'object');
});

Deno.test('Sub class - should be able to set and get protected properties', () => {
	const instance = new Sub();
	instance.setProtectedProp('testKey', 'testValue');
	assertEquals(instance.getProtectedProp('testKey'), 'testValue');
});

Deno.test('Sub class - protected properties should persist across method calls', () => {
	const instance = new Sub();
	instance.setProtectedProp('prop1', 'value1');
	instance.setProtectedProp('prop2', 'value2');
	
	assertEquals(instance.getProtectedProp('prop1'), 'value1');
	assertEquals(instance.getProtectedProp('prop2'), 'value2');
});

Deno.test('Sub class - pseudo-protected method should accept valid guarded', () => {
	const instance = new Sub();
	const result = instance.callGuardedMethod();
	assertEquals(result, 'authorized');
});

Deno.test('Sub class - pseudo-protected method should reject invalid guarded', () => {
	const instance = new Sub();
	const fakeGuarded = {};
	
	assertThrows(
		() => instance.guardedMethod(fakeGuarded),
		Error,
		'Unauthorized method call'
	);
});

Deno.test('Sub class - should support cross-instance protected method calls', () => {
	const instance1 = new Sub();
	const instance2 = new Sub();
	
	// instance1 can call guardedMethod on instance2
	const result = instance1.callOtherGuardedMethod(instance2);
	assertEquals(result, 'authorized');
});

Deno.test('Sub class - can cross-call more-derived (SubSub) instance', () => {
	class SubSub extends Sub {
		#_;

		constructor() {
			super();
			this._get_();
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}
	}

	const subInstance = new Sub();
	const subSubInstance = new SubSub();
	
	// Sub instance can call guardedMethod on SubSub instance
	// because SubSub extends Sub, so Sub has access to SubSub's Sub-level #_
	const result = subInstance.callOtherGuardedMethod(subSubInstance);
	assertEquals(result, 'authorized');
});

Deno.test('Sub class - SubSub cannot access less-derived Sub #_', () => {
	class SubSub extends Sub {
		#_;

		constructor() {
			super();
			this._get_();
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		// This method tries to access other.#_ where #_ is SubSub's private field
		tryCallOtherGuardedMethod(other) {
			// This will throw TypeError if other is a Sub (not SubSub)
			// because Sub instances don't have a SubSub-level #_ field
			return other.guardedMethod(other.#_);
		}
	}

	const subInstance = new Sub();
	const subSubInstance = new SubSub();
	
	// SubSub trying to access Sub's #_ should throw TypeError
	// because Sub doesn't have SubSub's #_ private field
	assertThrows(
		() => subSubInstance.tryCallOtherGuardedMethod(subInstance),
		TypeError
	);
});

Deno.test('Sub class - cross-instance access to protected properties', () => {
	class SubWithCompare extends Base {
		#_;

		constructor(value) {
			super();
			this._get_();
			this.#_.value = value;
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		compareWith(otherNode) {
			const _ = this.#_;
			const other_ = otherNode.#_;
			return _.value === other_.value;
		}
	}

	const node1 = new SubWithCompare('same');
	const node2 = new SubWithCompare('same');
	const node3 = new SubWithCompare('different');

	assertEquals(node1.compareWith(node2), true);
	assertEquals(node1.compareWith(node3), false);
});

Deno.test('Sub class - multi-level inheritance', () => {
	class SubSub extends Sub {
		#_;

		constructor() {
			super();
			this._get_();
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		getSubSub_() {
			return this.#_;
		}
	}

	const instance = new SubSub();
	instance.setProtectedProp('deepProp', 'deepValue');
	
	// Both Sub and SubSub should have access to the same protected object
	assertEquals(instance.getProtectedProp('deepProp'), 'deepValue');
	assertEquals(instance.getSubSub_().deepProp, 'deepValue');
});

Deno.test('Sub class - protected properties are shared across hierarchy', () => {
	class Level1 extends Base {
		#_;

		constructor() {
			super();
			this._get_();
			this.#_.level1 = 'L1';
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		get_() {
			return this.#_;
		}
	}

	class Level2 extends Level1 {
		#_;

		constructor() {
			super();
			this._get_();
			this.#_.level2 = 'L2';
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		get_() {
			return this.#_;
		}
	}

	const instance = new Level2();
	const _ = instance.get_();
	
	// Both levels should have added their properties to the same object
	assertEquals(_.level1, 'L1');
	assertEquals(_.level2, 'L2');
});
