/**
 * Integration tests for the protected properties pattern
 * Tests the complete pattern as demonstrated in demo.js
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Base } from '../protected-base.js';

Deno.test('Integration - multi-level inheritance with protected properties', () => {
	class B extends Base {
		#guarded;

		constructor() {
			super();
			this._getGuarded();
			this.#guarded.propB = 'B';
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}

		getGuarded() {
			return this.#guarded;
		}
	}

	class C extends B {
		#guarded;

		constructor() {
			super();
			this._getGuarded();
			this.#guarded.propC = 'C';
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}

		getGuarded() {
			return this.#guarded;
		}
	}

	const instance = new C();
	const guarded = instance.getGuarded();

	// Both B and C should have added their properties
	assertEquals(guarded.propB, 'B');
	assertEquals(guarded.propC, 'C');
});

Deno.test('Integration - protected state cannot be subverted after construction', () => {
	class B extends Base {
		#guarded;

		constructor() {
			super();
			this._getGuarded();
			this.#guarded.propB = 'B';
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}

		getGuarded() {
			return this.#guarded;
		}
	}

	class C extends B {
		#guarded;

		constructor() {
			super();
			this._getGuarded();
			this.#guarded.propC = 'C';
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}

		getGuarded() {
			return this.#guarded;
		}
	}

	const instance = new C();
	const originalGuarded = instance.getGuarded();

	// Attempt to subvert protected state (as in demo.js)
	const subs = new Set();
	const newGuarded = { updated: true };
	instance._subGuarded(subs);
	for (const sub of subs) {
		sub(newGuarded);
	}

	// Should still have original values due to ||= operator
	const currentGuarded = instance.getGuarded();
	assertEquals(currentGuarded.propB, 'B');
	assertEquals(currentGuarded.propC, 'C');
	assertEquals(currentGuarded.updated, undefined);
});

Deno.test('Integration - complex hierarchy with multiple branches', () => {
	class A extends Base {
		#guarded;

		constructor() {
			super();
			this._getGuarded();
			this.#guarded.levelA = 'A';
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}

		getGuarded() {
			return this.#guarded;
		}
	}

	class B1 extends A {
		#guarded;

		constructor() {
			super();
			this._getGuarded();
			this.#guarded.levelB1 = 'B1';
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}

		getGuarded() {
			return this.#guarded;
		}
	}

	class B2 extends A {
		#guarded;

		constructor() {
			super();
			this._getGuarded();
			this.#guarded.levelB2 = 'B2';
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}

		getGuarded() {
			return this.#guarded;
		}
	}

	const b1Instance = new B1();
	const b2Instance = new B2();

	const b1Guarded = b1Instance.getGuarded();
	const b2Guarded = b2Instance.getGuarded();

	// B1 should have A and B1 properties
	assertEquals(b1Guarded.levelA, 'A');
	assertEquals(b1Guarded.levelB1, 'B1');
	assertEquals(b1Guarded.levelB2, undefined);

	// B2 should have A and B2 properties
	assertEquals(b2Guarded.levelA, 'A');
	assertEquals(b2Guarded.levelB2, 'B2');
	assertEquals(b2Guarded.levelB1, undefined);
});

Deno.test('Integration - protected properties with public and private properties', () => {
	class Example extends Base {
		#guarded;
		#privateField;
		publicField;

		constructor() {
			super();
			this._getGuarded();
			
			this.publicField = 'public';
			this.#guarded.protectedField = 'protected';
			this.#privateField = 'private';
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}

		getProtectedField() {
			return this.#guarded.protectedField;
		}

		getPrivateField() {
			return this.#privateField;
		}
	}

	const instance = new Example();

	// Public field is accessible
	assertEquals(instance.publicField, 'public');

	// Protected field is accessible through method
	assertEquals(instance.getProtectedField(), 'protected');

	// Private field is accessible through method
	assertEquals(instance.getPrivateField(), 'private');

	// Protected field is not directly accessible
	assertEquals(instance.protectedField, undefined);

	// Private field is not directly accessible
	assertEquals(instance.privateField, undefined);
});

Deno.test('Integration - cross-instance method calls with protected authentication', () => {
	class Node extends Base {
		#guarded;

		constructor(id) {
			super();
			this._getGuarded();
			this.#guarded.id = id;
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}

		// Pseudo-protected method
		connect(guarded, otherNode) {
			if (guarded !== this.#guarded) throw new Error('Unauthorized');
			return `Connected ${this.#guarded.id} to ${otherNode.#guarded.id}`;
		}

		// Public method that calls protected method
		connectTo(otherNode) {
			return this.connect(this.#guarded, otherNode);
		}
	}

	const node1 = new Node('Node1');
	const node2 = new Node('Node2');

	const result = node1.connectTo(node2);
	assertEquals(result, 'Connected Node1 to Node2');
});

Deno.test('Integration - protected properties are truly shared across hierarchy', () => {
	class Level1 extends Base {
		#guarded;

		constructor() {
			super();
			this._getGuarded();
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}

		setFromLevel1(key, value) {
			this.#guarded[key] = value;
		}

		getFromLevel1(key) {
			return this.#guarded[key];
		}
	}

	class Level2 extends Level1 {
		#guarded;

		constructor() {
			super();
			this._getGuarded();
		}

		_subGuarded(subs) {
			super._subGuarded(subs);
			subs.add((g) => this.#guarded ||= g);
		}

		setFromLevel2(key, value) {
			this.#guarded[key] = value;
		}

		getFromLevel2(key) {
			return this.#guarded[key];
		}
	}

	const instance = new Level2();

	// Set from Level1 method
	instance.setFromLevel1('key1', 'value1');

	// Set from Level2 method
	instance.setFromLevel2('key2', 'value2');

	// Both levels can access both properties
	assertEquals(instance.getFromLevel1('key1'), 'value1');
	assertEquals(instance.getFromLevel1('key2'), 'value2');
	assertEquals(instance.getFromLevel2('key1'), 'value1');
	assertEquals(instance.getFromLevel2('key2'), 'value2');
});
