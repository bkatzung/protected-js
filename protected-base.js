/*
 * protected.js - A pattern for protected properties and methods in native JavaScript
 * Author: Brian Katzung <briank@kappacs.com>
 * Last modified: 2026-02-12
 *
 * Based on https://www.kappacs.com/implementing-javascript-protected-properties
 */

// NOTE: #_ and #_subs were formerly called #guarded and #guardedSubs

// Can be exported local, global, exported global, etc. according to preference
export const _GET = Symbol.for('jsProtectedGet');
export const _SUB = Symbol.for('jsProtectedSub');

export class Base {
	#_; // Base's private access to shared protected properties
	#_subs = new Set(); // Protected-property subscriptions (setter functions)

	static __protected = { // Base-class prototype for protected shared-state object
		logState () {
			const [thys, _thys] = [this.__this, this];

			// when called state.logState (or this.#_.logState):
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
		const state = this.#_ = Object.assign(Object.create(this.constructor.__protected), {
			__this: this, // Original this enables unbound, prototyped, protected methods
			base: true,
		});

		this[_SUB](this.#_subs); // Invite subscribers
		// Public props: this.prop
		// Protected props: this.#_.prop
		// Private props: this.#prop
	}

	callProtectedLogger () {
		this.#_.logState();
	}

	// Distribute protected property access to ready subscribers
	// (base instance method)
	[_GET] () {
		const state = this.#_, subs = this.#_subs;

		try {
			for (const sub of subs) {
				sub(state); // Attempt state distribution to subscriber
				subs.delete(sub); // Remove successfully-completed subscriptions
			}
		}
		catch (_) {/**/}
	}

	[_SUB] () { } // Base-class subscription stub (required)
}
