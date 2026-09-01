import { Base, _GET, _SUB } from './protected-base.js';

class B extends Base {
	#_;

	constructor () {
		super();
		this[_GET]();
		this.#_.propB = 'B';
	}

	[_SUB] (subFn) {
		const subToken = super[_SUB](subFn);
		return subFn(subToken, (g) => { this.#_ ||= g; });
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

	[_SUB] (subFn) {
		const subToken = super[_SUB](subFn);
		return subFn(subToken, (p) => { this.#_ ||= p; });
	}
}

const instance = new C();
instance.logState();

// Attempt to subvert protected state
// (should fail and throw Unauthorized)
try {
	const newState = { updated: true };
	instance[_SUB]((_token, cb) => {
		cb(newState);
	});
} catch (e) {
	console.log('Subversion attempt failed as expected:', e.message);
}

// Should report same original values
instance.logState();
