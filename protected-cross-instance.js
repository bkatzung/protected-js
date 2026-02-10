/*
 * protected-cross-instance.js - A pattern for protected properties and methods
 * in native JavaScript (base-class variant supporting cross-instance access)
 * (See "** ADDED **" annotations)
 *
 * Author: Brian Katzung <briank@kappacs.com>
 * Last modified: 2026-02-08
 *
 * Based on https://www.kappacs.com/implementing-javascript-protected-properties
 */

// ** File 1 **

const guardedMap = new WeakMap(); // <instance, protectedProperties> ** ADDED **

export class A { // Base class
	#guarded; // Class A private access to shared protected properties
	#guardedSubs = new Set(); // Protected-property subscriptions (setter functions)

	constructor () {
		const guarded = this.#guarded = { /* protected properties */ };
		guardedMap.set(this, guarded); // ** ADDED **
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
		catch (_) { }
	}

	_subGuarded () { } // Stub for new A() and sub-class consistency

	// ** Everything below is ADDED **

	/*
	 * Get **full access** to cross-instance protected properties
	 * Be advised: This allows any sub-class instance to access any other
	 * (same or different) sub-class instance's protected properties!
	 */
	_getGuardedFor (auth, otherInstance) {
		if (auth !== this.#guarded) throw new Error('Unauthorized method call');
		// Caller has been confirmed to be in the class hierarchy and
		// it's "safe" to share another instance's protected properties
		// Possible additional checks (mutable, so not secure):
		// - Compare this and otherInstance constructors
		// - Compare this and otherInstance prototypes
		return guardedMap.get(otherInstance);
	}

	// Pseudo-protected, cross-instance, single-property getter
	// (Reduced exposure, reduced risk)
	_getSomePropFor (auth, otherInstance) {
		if (auth !== this.#guarded) throw new Error('Unauthorized method call');
		return guardedMap.get(otherInstance)?.someProp;
	}
}
