/*
 * Example sub-class with protected-level shared properties
 * Author: Brian Katzung <briank@kappacs.com>
 */

import { Base, _GET, _SUB } from './protected-base.js';

export class Sub extends Base {
	#_; // Sub's private access to shared protected properties

	// Sub-class prototype for protected shared-state object
	static __protected = Object.setPrototypeOf({
		logState () {
			const [thys, _thys] = [this.__this, this];

			if (_thys !== thys.#_) throw new Error('Unauthorized');
			console.log('Sub #_', this);
			super.logState();
		},
		get protoSub () { return true; }
	}, super.__protected);

	constructor () {
		super();
		// <-- Sub's this.#_ no longer throws
		this[_GET](); // Obtain protected property access
		// <-- Sub's this.#_ is now populated and available for use

		const state = this.#_;

		state.sub = true;
	}

	// Subscribe to #_ in every sub-class needing access
	// protected properties
	[_SUB] (subs) {
		super[_SUB](subs); // Must be first
		subs.add((p) => this.#_ ||= p); // Set this.#_ once
	}

	method () { // Example consumer
		const state = this.#_;

		// Public props: this.prop
		// Protected props: this.#_.prop (or state.prop)
		// Private props: this.#prop
	}

	/*
	 * A pseudo-protected (publicly visible, but access-controlled) method.
	 * Callers must supply the callee's private #_ to authenticate.
	 * This can be called from any class within the same instance (#_
	 * is shared across all classes), or across instances when the callee is
	 * instanceof the caller's method class (in which case the caller has
	 * access to the callee's #_ and can therefore pass it).
	 */
	gatedMethod (state) {
		if (state !== this.#_) throw new Error('Unauthorized method call');
		// Caller is now confirmed to be in the class hierarchy for this instance
	}

	// Example of calling a pseudo-protected method on the same instance
	callGatedMethod () {
		this.gatedMethod(this.#_);
	}

	// Example of calling a pseudo-protected method across instances
	callOtherGatedMethod (other) {
		if (#_ in other) { // brand check
			other.gatedMethod(other.#_);
		} else {
			// Incompatible
		}
	}
}
