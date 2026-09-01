import { Base, _GET, _SUB } from './protected-base.js';

let savedSubFn, savedSubToken;

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
		// Stash subFn and subToken to attempt post-construction subscription
		savedSubFn = subFn;
		savedSubToken = subToken;
		return subFn(subToken, (p) => { this.#_ ||= p; });
	}
}

const instance = new C();
instance.logState();

// Attempt to subvert protected state via direct [_SUB] call
// (should fail and throw Unauthorized)
try {
	const newState = { updated: true };
	instance[_SUB]((_token, cb) => {
		cb(newState);
	});
} catch (e) {
	console.log('Direct subversion attempt failed as expected:', e.message);
}

// Attempt to register a new subscription using subFn + subToken saved during construction
// (should fail and throw Unauthorized because #_subToken is cleared after construction)
try {
	savedSubFn(savedSubToken, (state) => {
		state.leaked = true;
	});
} catch (e) {
	console.log('Saved subFn+subToken subscription attempt failed as expected:', e.message);
}

// Should report same original values
instance.logState();
