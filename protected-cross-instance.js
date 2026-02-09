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
		catch (_) {}
	}

	// Pseudo-protected base-class method for cross-instance protected-property access
	// ** ADDED **
	_getGuardedFor (auth, otherInstance) {
		if (auth !== this.#guarded) throw new Error('Unauthorized method call');
		// The following check might or might not be appropriate for your use case
		// Note: Prototypes are usually mutable, so the following check isn't secure
		if (Object.getPrototypeOf(this) !== Object.getPrototypeOf(otherInstance)) throw new TypeError('Will not get protected properties across different types');
		// Caller has been confirmed to be in the class hierarchy and
		// it's "safe" to share another instance's protected properties
		return guardedMap.get(otherInstance);
	}

	// Optional base-class stub for sub-class interface consistency
	_subGuarded () { }
}
