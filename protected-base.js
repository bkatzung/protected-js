/*
 * protected.js - A pattern for protected properties and methods in native JavaScript
 * Author: Brian Katzung <briank@kappacs.com>
 * Last modified: 2026-02-12
 *
 * Based on https://www.kappacs.com/implementing-javascript-protected-properties
 */

// NOTE: #_ and #_subs were formerly called #guarded and #guardedSubs

export class Base {
	#_; // Base's private access to shared protected properties
	#_subs = new Set(); // Protected-property subscriptions (setter functions)

	static __protected = { // Base-class prototype for protected shared-state object
		logGuarded () {
			const [thys, _thys] = [this.__this, this];
			// when called guarded.logGuarded (or this.#_.logGuarded):
			// `thys` will be the original object `this`
			// `_thys` will be the protected shared-state object
			// Optional: verify main-object/protected-state-object association
			if (_thys !== thys.#_) throw new Error('Unauthorized');
			console.log('Proto Base?', _thys.protoBase, 'Proto Sub?', _thys.protoSub);
			console.log('Base #_:', _thys);
		},
		get protoBase () { return true; }
	};

	constructor () {
		const guarded = this.#_ = Object.assign(Object.create(this.constructor.__protected), {
			__this: this, // Original this enables unbound, prototyped, protected methods
			base: true,
		});
		this._sub_(this.#_subs); // Invite subscribers
		// Public props: this.prop
		// Protected props: this.#_.prop
		// Private props: this.#prop
	}

	callProtectedLogger () {
		this.#_.logGuarded();
	}

	// Distribute protected property access to ready subscribers
	// (base instance method)
	_get_ () {
		const guarded = this.#_, subs = this.#_subs;
		try {
			for (const sub of subs) {
				sub(guarded); // Attempt guarded distribution to subscriber
				subs.delete(sub); // Remove successfully-completed subscriptions
			}
		}
		catch (_) {/**/}
	}

	_sub_ () { } // Base-class stub (required)
}
