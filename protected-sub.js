/*
 * Example sub-class with protected-level shared properties
 * Author: Brian Katzung <briank@kappacs.com>
 */

import { Base } from './protected-base.js';

class Sub extends Base {
	#guarded; // Sub's private access to shared protected properties

	constructor () {
		super();
		// <-- Sub's this.#guarded no longer throws
		this._getGuarded(); // Obtain protected property access
		// <-- Sub's this.#guarded is now populated and available for use
		const guarded = this.#guarded;
	}

	// Subscribe to #guarded in every sub-class needing access
	// protected properties
	_subGuarded (subs) {
		super._subGuarded(subs); // Must be first
		subs.add((g) => this.#guarded ||= g); // Set this.#guarded once
	}

	method () { // Example consumer
		const guarded = this.#guarded;
		// Public props: this.prop
		// Protected props: this.#guarded.prop (or guarded.prop)
		// Private props: this.#prop
	}

	/*
	 * A pseudo-protected (publicly visible, but access-controlled) method.
	 * Callers must supply the callee's private #guarded to authenticate.
	 * This can be called from any class within the same instance (#guarded
	 * is shared across all classes), or across instances when the callee is
	 * instanceof the caller's method class (in which case the caller has
	 * access to the callee's #guarded and can therefore pass it).
	 */
	guardedMethod (guarded) {
		if (guarded !== this.#guarded) throw new Error('Unauthorized method call');
		// Caller is now confirmed to be in the class hierarchy for this instance
	}

	// Example of calling a pseudo-protected method on the same instance
	callGuardedMethod () {
		const guarded = this.#guarded;
		this.guardedMethod(guarded);
	}

	// Example of calling a pseudo-protected method across instances
	callOtherGuardedMethod (other) {
		const otherGuarded = other.#guarded; // Throws if other is incompatible
		other.guardedMethod(otherGuarded);
	}
}
