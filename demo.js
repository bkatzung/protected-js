import { Base } from './protected-base.js';

class B extends Base {
	#_;

	constructor () {
		super();
		this._get_();
		this.#_.propB = 'B';
	}

	_sub_ (subs) {
		super._sub_(subs);
		subs.add((g) => this.#_ ||= g);
	}

	logGuarded () {
		console.log(this.#_);
	}
}

class C extends B {
	#_;

	constructor () {
		super();
		this._get_();
		this.#_.propC = 'C';
	}

	_sub_ (subs) {
		super._sub_(subs);
		subs.add((p) => this.#_ ||= p);
	}
}

const instance = new C();
instance.logGuarded();

// Attempt to subvert protected state
// (should not have any effect)
const subs = new Set(), newGuarded = { updated: true };
instance._sub_(subs);
for (const sub of subs) {
	sub(newGuarded);
}
// Should report same original values
instance.logGuarded();
