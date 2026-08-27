import { Base, _GET, _SUB } from './protected-base.js';

class B extends Base {
	#_;

	constructor () {
		super();
		this[_GET]();
		this.#_.propB = 'B';
	}

	[_SUB] (subs) {
		super[_SUB](subs);
		subs.add((g) => this.#_ ||= g);
	}

	logState () {
		console.log(this.#_);
	}
}

class C extends B {
	#_;

	constructor () {
		super();
		this[_GET]();
		this.#_.propC = 'C';
	}

	[_SUB] (subs) {
		super[_SUB](subs);
		subs.add((p) => this.#_ ||= p);
	}
}

const instance = new C();
instance.logState();

// Attempt to subvert protected state
// (should not have any effect)
const subs = new Set(), newState = { updated: true };
instance[_SUB](subs);
for (const sub of subs) {
	sub(newState);
}
// Should report same original values
instance.logState();
