/*
 * protected.js - A pattern for protected properties and methods in native JavaScript
 * Author: Brian Katzung <briank@kappacs.com>
 * Last modified: 2026-02-12
 *
 * Based on https://www.kappacs.com/implementing-javascript-protected-properties
 */

export class Base {
	#guarded; // Base's private access to shared protected properties
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
		catch (_) { }
	}

	_subGuarded () { } // Stub for new A() and sub-class consistency
}
