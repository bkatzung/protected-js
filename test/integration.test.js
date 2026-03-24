/**
 * Integration tests for the protected properties pattern
 * Tests the complete pattern as demonstrated in demo.js
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Base } from '../protected-base.js';

Deno.test('Integration - multi-level inheritance with protected properties', () => {
	class B extends Base {
		#_;

		constructor() {
			super();
			this._get_();
			this.#_.propB = 'B';
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		get_() {
			return this.#_;
		}
	}

	class C extends B {
		#_;

		constructor() {
			super();
			this._get_();
			this.#_.propC = 'C';
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		get_() {
			return this.#_;
		}
	}

	const instance = new C();
	const _ = instance.get_();

	// Both B and C should have added their properties
	assertEquals(_.propB, 'B');
	assertEquals(_.propC, 'C');
});

Deno.test('Integration - protected state cannot be subverted after construction', () => {
	class B extends Base {
		#_;

		constructor() {
			super();
			this._get_();
			this.#_.propB = 'B';
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		get_() {
			return this.#_;
		}
	}

	class C extends B {
		#_;

		constructor() {
			super();
			this._get_();
			this.#_.propC = 'C';
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		get_() {
			return this.#_;
		}
	}

	const instance = new C();
	const original_ = instance.get_();

	// Attempt to subvert protected state (as in demo.js)
	const subs = new Set();
	const new_ = { updated: true };
	instance._sub_(subs);
	for (const sub of subs) {
		sub(new_);
	}

	// Should still have original values due to ||= operator
	const current_ = instance.get_();
	assertEquals(current_.propB, 'B');
	assertEquals(current_.propC, 'C');
	assertEquals(current_.updated, undefined);
});

Deno.test('Integration - complex hierarchy with multiple branches', () => {
	class A extends Base {
		#_;

		constructor() {
			super();
			this._get_();
			this.#_.levelA = 'A';
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		get_() {
			return this.#_;
		}
	}

	class B1 extends A {
		#_;

		constructor() {
			super();
			this._get_();
			this.#_.levelB1 = 'B1';
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		get_() {
			return this.#_;
		}
	}

	class B2 extends A {
		#_;

		constructor() {
			super();
			this._get_();
			this.#_.levelB2 = 'B2';
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		get_() {
			return this.#_;
		}
	}

	const b1Instance = new B1();
	const b2Instance = new B2();

	const b1_ = b1Instance.get_();
	const b2_ = b2Instance.get_();

	// B1 should have A and B1 properties
	assertEquals(b1_.levelA, 'A');
	assertEquals(b1_.levelB1, 'B1');
	assertEquals(b1_.levelB2, undefined);

	// B2 should have A and B2 properties
	assertEquals(b2_.levelA, 'A');
	assertEquals(b2_.levelB2, 'B2');
	assertEquals(b2_.levelB1, undefined);
});

Deno.test('Integration - protected properties with public and private properties', () => {
	class Example extends Base {
		#_;
		#privateField;
		publicField;

		constructor() {
			super();
			this._get_();
			
			this.publicField = 'public';
			this.#_.protectedField = 'protected';
			this.#privateField = 'private';
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		getProtectedField() {
			return this.#_.protectedField;
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
		#_;

		constructor(id) {
			super();
			this._get_();
			this.#_.id = id;
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		// Pseudo-protected method
		connect(_, otherNode) {
			if (_ !== this.#_) throw new Error('Unauthorized');
			return `Connected ${this.#_.id} to ${otherNode.#_.id}`;
		}

		// Public method that calls protected method
		connectTo(otherNode) {
			return this.connect(this.#_, otherNode);
		}
	}

	const node1 = new Node('Node1');
	const node2 = new Node('Node2');

	const result = node1.connectTo(node2);
	assertEquals(result, 'Connected Node1 to Node2');
});

Deno.test('Integration - protected properties are truly shared across hierarchy', () => {
	class Level1 extends Base {
		#_;

		constructor() {
			super();
			this._get_();
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		setFromLevel1(key, value) {
			this.#_[key] = value;
		}

		getFromLevel1(key) {
			return this.#_[key];
		}
	}

	class Level2 extends Level1 {
		#_;

		constructor() {
			super();
			this._get_();
		}

		_sub_(subs) {
			super._sub_(subs);
			subs.add((g) => this.#_ ||= g);
		}

		setFromLevel2(key, value) {
			this.#_[key] = value;
		}

		getFromLevel2(key) {
			return this.#_[key];
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
