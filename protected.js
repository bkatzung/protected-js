/*
 * protected.js - A pattern for protected properties and methods in native JavaScript
 * Author: Brian Katzung <briank@kappacs.com>
 * Last modified: 2026-02-08
 *
 * Based on https://www.kappacs.com/implementing-javascript-protected-properties
 */

// ** File 1 **

export class A { // Base class
	#guarded; // Class A private access to shared protected properties
	#guardedSubs = new Set(); // Protected-property subscriptions (setter functions)

	constructor () {
		const guarded = this.#guarded = { /* protected properties */ };
		this._subGuarded(this.#guardedSubs); // Invite subscribers
		// Public props: this.prop
		// Protected props: this.#guarded.prop (or guarded.prop)
		// Private props: this.#prop
	}

	// Distribute protected property access to ready subscribers
	// (base instance method)
	_getGuarded () {
		const guarded = this.#guarded, subs = this.#guardedSubs;
		try {
			for (const sub of subs) {
				sub(guarded); // Attempt guarded distribution to subscriber
				subs.delete(sub); // Remove successfully-completed subscriptions
			}
		}
		catch (_) {}
	}

	// Optional base-class stub for sub-class interface consistency
	_subGuarded () { }

	method () { // Example consumer
		const guarded = this.#guarded;
		// Public props: this.prop
		// Protected props: this.#guarded.prop (or guarded.prop)
		// Private props: this.#prop
	}

	// A pseudo-protected (publicly visible, but access-controlled) method
	// Callers must supply their private #guarded to authenticate
	guardedMethod (guarded) {
		if (guarded !== this.#guarded) throw new Error('Unauthorized method call');
		// Caller is now confirmed to be in the class hierarchy for this instance
	}
}

// ** File 2 **

// import { A } from '...';

class B extends A {
	#guarded; // Class B private access to same shared protected properties

	constructor () {
		super();
		super._getGuarded(); // Obtain protected property access
		// this.#guarded is now populated and available for use here
		const guarded = this.#guarded;
	}

	_subGuarded (subs) { // Subscribe to protected properties
		if (this.#guarded) return; // Only allow subscription once
		super._subGuarded(subs); // Optional if super-class is the base
		subs.add((g) => this.#guarded = g);
	}

	callGuardedMethod () {
		const guarded = this.#guarded;
		this.guardedMethod(guarded);
	}
}
