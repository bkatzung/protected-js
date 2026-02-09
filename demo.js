import { A } from './protected.js';

class B extends A {
	#guarded;

	constructor () {
		super();
		this._getGuarded();
		this.#guarded.propB = 'B';
	}

	_subGuarded (subs) {
		super._subGuarded(subs);
		subs.add((g) => this.#guarded ||= g);
	}

	logGuarded () {
		console.log(this.#guarded);
	}
}

class C extends B {
	#guarded;

	constructor () {
		super();
		this._getGuarded();
		this.#guarded.propC = 'C';
	}

	_subGuarded (subs) {
		super._subGuarded(subs);
		subs.add((g) => this.#guarded ||= g);
	}
}

const instance = new C();
instance.logGuarded();

const subs = new Set(), newGuarded = { updated: true };
instance._subGuarded(subs);
for (const sub of subs) {
	sub(newGuarded);
}
instance.logGuarded();
