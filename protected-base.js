/*
 * protected.js - A pattern for protected properties and methods in native JavaScript
 * Author: Brian Katzung <briank@kappacs.com>
 * Last modified: 2026-02-12
 *
 * Based on https://www.kappacs.com/implementing-javascript-protected-properties
 *
 * NOTE - Depends on environmental integrity for security, e.g.:
 *  - Object, Object.prototype, Object.prototype.{assign,create,freeze}
 *  - Set, Set.prototype, Set.prototype.{add,delete}
 *  - Set.prototype[Symbol.iterator]
 *  - Symbol, Symbol.iterator
 *  - Anyplace else you decide to pass protected state
 * Integrity management is difficult even under the best of circumstances,
 * and impossible to guarantee in uncontrolled environments (e.g. browsers).
 */

// NOTE: #_ and #_subs were formerly called #guarded and #guardedSubs

// Can be exported local, global, exported global, etc. according to preference
// (These are for collision avoidance, not any part of security)
export const _GET = Symbol.for('jsProtectedGet');
export const _SUB = Symbol.for('jsProtectedSub');

export class Base {
	#_; // Base's private access to shared protected properties
	#_subs = new Set(); // Protected-property subscriptions (setter functions)
	#_subFn;
	#_subToken = Symbol();

	static __protected = Object.freeze({ // Base-class prototype for protected shared-state object
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
	});

	constructor () {
		const state = this.#_ = Object.assign(Object.create(this.constructor.__protected), {
			base: true,
		});
		// Original this enables unbound, prototyped, protected methods
		Object.defineProperty(state, '__this', { value: this });

		this.#_subFn = (token, callback) => {
			if (token !== this.#_subToken) throw new Error('Unauthorized');
			this.#_subs.add(callback);
			return token;
		};
		this[_SUB](this.#_subFn); // Invite subscribers
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

	[_SUB] (subFn) {
		// Return the verification token if the subscriber function matches
		if (subFn !== this.#_subFn) throw new Error('Unauthorized');
		return this.#_subToken;
	}
}

Object.freeze(Base.prototype);
Object.freeze(Base);
