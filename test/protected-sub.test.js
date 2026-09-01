/**
 * Tests for Sub class protected properties pattern
 */

import { assertEquals, assertExists, assertThrows } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Base, _GET, _SUB } from '../protected-base.js';
import { Sub as ExportedSub } from '../protected-sub.js';

// Create a Sub class for testing
class Sub extends Base {
	#_;

	constructor() {
		super();
		this[_GET]();
	}

	[_SUB](subFn) {
		const subToken = super[_SUB](subFn);
		return subFn(subToken, (g) => { this.#_ ||= g; });
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
	gatedMethod(state) {
		if (state !== this.#_) throw new Error('Unauthorized method call');
		return 'authorized';
	}

	// Method to call gatedMethod on self
	callGatedMethod() {
		return this.gatedMethod(this.#_);
	}

	// Method to call gatedMethod on another instance
	callOtherGatedMethod(other) {
		if (#_ in other) {
			return other.gatedMethod(other.#_);
		}
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

Deno.test('Sub class - pseudo-protected method should accept valid state', () => {
	const instance = new Sub();
	const result = instance.callGatedMethod();
	assertEquals(result, 'authorized');
});

Deno.test('Sub class - pseudo-protected method should reject invalid state', () => {
	const instance = new Sub();
	const fakeState = {};
	
	assertThrows(
		() => instance.gatedMethod(fakeState),
		Error,
		'Unauthorized method call'
	);
});

Deno.test('Sub class - should support cross-instance protected method calls', () => {
	const instance1 = new Sub();
	const instance2 = new Sub();
	
	// instance1 can call gatedMethod on instance2
	const result = instance1.callOtherGatedMethod(instance2);
	assertEquals(result, 'authorized');
});

Deno.test('Sub class - can cross-call more-derived (SubSub) instance', () => {
	class SubSub extends Sub {
		#_;

		constructor() {
			super();
			this[_GET]();
		}

		[_SUB](subFn) {
			const subToken = super[_SUB](subFn);
			return subFn(subToken, (g) => { this.#_ ||= g; });
		}
	}

	const subInstance = new Sub();
	const subSubInstance = new SubSub();
	
	// Sub instance can call gatedMethod on SubSub instance
	// because SubSub extends Sub, so Sub has access to SubSub's Sub-level #_
	const result = subInstance.callOtherGatedMethod(subSubInstance);
	assertEquals(result, 'authorized');
});

Deno.test('Sub class - SubSub cannot access less-derived Sub #_', () => {
	class SubSub extends Sub {
		#_;

		constructor() {
			super();
			this[_GET]();
		}

		[_SUB](subFn) {
			const subToken = super[_SUB](subFn);
			return subFn(subToken, (g) => { this.#_ ||= g; });
		}

		// This method tries to access other.#_ where #_ is SubSub's private field
		tryCallOtherGatedMethod(other) {
			// This will throw TypeError if other is a Sub (not SubSub)
			// because Sub instances don't have a SubSub-level #_ field
			return other.gatedMethod(other.#_);
		}
	}

	const subInstance = new Sub();
	const subSubInstance = new SubSub();
	
	// SubSub trying to access Sub's #_ should throw TypeError
	// because Sub doesn't have SubSub's #_ private field
	assertThrows(
		() => subSubInstance.tryCallOtherGatedMethod(subInstance),
		TypeError
	);
});

Deno.test('Sub class - cross-instance access to protected properties', () => {
	class SubWithCompare extends Base {
		#_;

		constructor(value) {
			super();
			this[_GET]();
			this.#_.value = value;
		}

		[_SUB](subFn) {
			const subToken = super[_SUB](subFn);
			return subFn(subToken, (g) => { this.#_ ||= g; });
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
			this[_GET]();
		}

		[_SUB](subFn) {
			const subToken = super[_SUB](subFn);
			return subFn(subToken, (g) => { this.#_ ||= g; });
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
			this[_GET]();
			this.#_.level1 = 'L1';
		}

		[_SUB](subFn) {
			const subToken = super[_SUB](subFn);
			return subFn(subToken, (g) => { this.#_ ||= g; });
		}

		get_() {
			return this.#_;
		}
	}

	class Level2 extends Level1 {
		#_;

		constructor() {
			super();
			this[_GET]();
			this.#_.level2 = 'L2';
		}

		[_SUB](subFn) {
			const subToken = super[_SUB](subFn);
			return subFn(subToken, (g) => { this.#_ ||= g; });
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

Deno.test('Exported Sub class - should create an instance and inherit correctly', () => {
	const instance = new ExportedSub();
	assertExists(instance);
	assertEquals(instance instanceof ExportedSub, true);
	assertEquals(instance instanceof Base, true);
});

Deno.test('Exported Sub class - method should execute and access protected state', () => {
	const instance = new ExportedSub();
	instance.method();
});

Deno.test('Exported Sub class - pseudo-protected method calls on self and other instances', () => {
	const instance1 = new ExportedSub();
	const instance2 = new ExportedSub();

	// callGatedMethod on self
	instance1.callGatedMethod();

	// callOtherGatedMethod on compatible instance
	instance1.callOtherGatedMethod(instance2);

	// callOtherGatedMethod on incompatible instance (exercises else branch)
	instance1.callOtherGatedMethod({});
	instance1.callOtherGatedMethod(new Base());

	// gatedMethod with invalid state throws
	assertThrows(
		() => instance1.gatedMethod({}),
		Error,
		'Unauthorized method call'
	);
});

Deno.test('Exported Sub class - static __protected prototype properties and methods', () => {
	assertEquals(ExportedSub.__protected.protoSub, true);
	assertEquals(ExportedSub.__protected.protoBase, true);

	const instance = new ExportedSub();
	// callProtectedLogger triggers Sub's logState, which calls super.logState()
	instance.callProtectedLogger();

	// Sub.__protected.logState throws if caller association is invalid
	assertThrows(
		() => ExportedSub.__protected.logState.call({ __this: new ExportedSub() }),
		Error,
		'Unauthorized'
	);
});

Deno.test('Exported Sub class - Sub, Sub.prototype, and Sub.__protected are frozen', () => {
	assertEquals(Object.isFrozen(ExportedSub), true);
	assertEquals(Object.isFrozen(ExportedSub.prototype), true);
	assertEquals(Object.isFrozen(ExportedSub.__protected), true);
});

Deno.test('Sub class - subFn and subToken saved during construction reject new subscriptions once constructor completes', () => {
	let savedSubFn;
	let savedSubToken;

	class StashingSub extends Sub {
		#_;

		constructor() {
			super();
			this[_GET]();
		}

		[_SUB](subFn) {
			const subToken = super[_SUB](subFn);
			savedSubFn = subFn;
			savedSubToken = subToken;
			return subFn(subToken, (g) => { this.#_ ||= g; });
		}
	}

	const instance = new StashingSub();
	assertExists(savedSubFn);
	assertExists(savedSubToken);

	// Invoking savedSubFn with savedSubToken after constructor has completed must throw Unauthorized
	assertThrows(
		() => savedSubFn(savedSubToken, () => {}),
		Error,
		'Unauthorized'
	);

	// Subsequent _GET call does not leak protected state
	let leaked = false;
	try {
		savedSubFn(savedSubToken, () => { leaked = true; });
	} catch (_) {/**/}
	instance[_GET]();
	assertEquals(leaked, false);
});
