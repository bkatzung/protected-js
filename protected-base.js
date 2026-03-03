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

	static protoProtected = { // Base-class prototype for protected shared-state object
		logGuarded () {
			// when called guarded.logGuarded (or this.#guarded.logGuarded):
			// `this` will be the protected shared-state object
			// `this.thys` will be the original object `this`
			const guarded = this.thys.#guarded;
			console.log('Proto Base?', guarded.protoBase, 'Proto Sub?', guarded.protoSub);
			console.log('Base #guarded:', guarded);
		},
		get protoBase () { return true; }
	};

	constructor () {
		const guarded = this.#guarded = Object.create(this.constructor.protoProtected);
		guarded.thys = this;
		guarded.base = true;
		this._subGuarded(this.#guardedSubs); // Invite subscribers
		// Public props: this.prop
		// Protected props: this.#guarded.prop (or guarded.prop)
		// Private props: this.#prop
	}

	callProtectedLogger () {
		this.#guarded.logGuarded();
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
