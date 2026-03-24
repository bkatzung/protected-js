/*
 * Example sub-class with protected-level shared properties
 * Author: Brian Katzung <briank@kappacs.com>
 */

import { Base } from './protected-base.js';

export class Sub extends Base {
	#_; // Sub's private access to shared protected properties

	// Sub-class prototype for protected shared-state object
	static __protected = Object.setPrototypeOf({
		logGuarded () {
			const [thys, _thys] = [this.__this, this];
			if (_thys !== thys.#_) throw new Error('Unauthorized');
			console.log('Sub #_', this);
			super.logGuarded();
		},
		get protoSub () { return true; }
	}, super.__protected);

	constructor () {
		super();
		// <-- Sub's this.#_ no longer throws
		this._get_(); // Obtain protected property access
		// <-- Sub's this.#_ is now populated and available for use
		const guarded = this.#_;
		guarded.sub = true;
	}

	// Subscribe to #_ in every sub-class needing access
	// protected properties
	_sub_ (subs) {
		super._sub_(subs); // Must be first
		subs.add((p) => this.#_ ||= p); // Set this.#_ once
	}

	method () { // Example consumer
		const guarded = this.#_;
		// Public props: this.prop
		// Protected props: this.#_.prop (or guarded.prop)
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
	guardedMethod (guarded) {
		if (guarded !== this.#_) throw new Error('Unauthorized method call');
		// Caller is now confirmed to be in the class hierarchy for this instance
	}

	// Example of calling a pseudo-protected method on the same instance
	callGuardedMethod () {
		const guarded = this.#_;
		this.guardedMethod(guarded);
	}

	// Example of calling a pseudo-protected method across instances
	callOtherGuardedMethod (other) {
		const otherGuarded = other.#_; // Throws if other is incompatible
		other.guardedMethod(otherGuarded);
	}
}
