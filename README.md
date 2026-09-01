# protected-js

A pattern for simulating protected properties and methods in native JavaScript using ES2022 private fields and shared-state objects.

## Overview

JavaScript doesn't natively support protected properties (properties accessible within a class hierarchy but not from outside). This library provides a sophisticated pattern to simulate protected properties and methods using JavaScript's private fields (`#`), a subscription-based distribution system, and a shared-state object with prototype inheritance.

## Features

- **True Protected Properties**: Properties accessible within class hierarchies but not from outside
- **Protected Shared-State Object**: A single shared object with prototype chain for protected data and methods
- **Protected Methods on Prototype**: Methods defined on the protected prototype that can access protected state
- **Pseudo-Protected Methods**: Access-controlled methods that verify caller authenticity
- **Cross-Instance Access**: Naturally supports protected property access across instances of the same class
- **Zero Dependencies**: Pure JavaScript implementation
- **Type Safe**: Works seamlessly with TypeScript
- **Lightweight**: Minimal overhead with efficient subscription pattern

## Pattern Selection

If you need inheritance-based access, use the "protected-js" pattern. If you need trust or capability-based access, use the "insider-js" pattern.

| Use Case | Pattern |
|---|---|
| Subclass access | protected-js |
| Classical OOP hierarchy | protected-js |
| Trusted collaboration | insider-js |
| Composition-heavy design | insider-js |

## Naming Conventions

- **`#_`**: Private field for accessing the shared protected-state object (formerly `#guarded`)
- **`#_subs`**: Private field for protected-property subscriptions (Set of callback functions; formerly `#guardedSubs`)
- **`#_subFn`**: Private field holding the subscriber registration callback function
- **`#_subToken`**: Private field holding the subscription verification token `Symbol`
- **`__protected`**: Static property defining the protected prototype (formerly `protoProtected`)
- **`__this`**: Non-enumerable property on the protected-state object referencing the original instance (formerly `thys`)
- **`_thys`**: Local variable name for the protected-state object (when `this` refers to it)
- **`thys`**: Local variable name for the original instance object
- **`[_GET]()`**: Method to distribute protected-property access (formerly `_get_()`, `_getGuarded()`)
- **`[_SUB]()`**: Method to subscribe to protected-property access (formerly `_sub_()`, `_subGuarded()`)

## Protected Pattern Application

### Base-Class Pattern

Incorporate the base-class pattern into your base class. Excerpted from [`protected-base.js`](protected-base.js):

```javascript
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
```

### Sub-Class Pattern

Incorporate the sub-class pattern into your sub-classes. Excerpted from [`protected-sub.js`](protected-sub.js):

```javascript
import { Base, _GET, _SUB } from './protected-base.js';

export class Sub extends Base {
	#_; // Sub's private access to shared protected properties

	// Sub-class prototype for protected shared-state object
	static __protected = Object.freeze(Object.setPrototypeOf({
		logState () {
			const [thys, _thys] = [this.__this, this];

			if (_thys !== thys.#_) throw new Error('Unauthorized');
			console.log('Sub #_', this);
			super.logState();
		},
		get protoSub () { return true; }
	}, super.__protected));

	constructor () {
		super();
		// <-- Sub's this.#_ no longer throws
		this[_GET](); // Obtain protected property access
		// <-- Sub's this.#_ is now populated and available for use

		const state = this.#_;

		state.sub = true;
	}

	// Subscribe to #_ in every sub-class needing access
	// protected properties
	[_SUB] (subFn) {
		const subToken = super[_SUB](subFn); // Must be first

		return subFn(subToken, (p) => { this.#_ ||= p; }); // Set this.#_ once
	}

	method () { // Example consumer
		const state = this.#_;

		// Public props: this.prop
		// Protected props: this.#_.prop (or state.prop)
		// Private props: this.#prop
	}

	/*
	 * A pseudo-protected (publicly visible, but access-controlled) method.
	 * Callers must supply the callee's private #_ to authenticate.
	 * This can be called from any class within the same instance (#_
	 * is shared across all classes), or across instances when the callee is
	 * instanceof the caller's method class (in which case the caller has
	 * access to the callee's #_ and can therefore pass it).
	 */
	gatedMethod (state) {
		if (state !== this.#_) throw new Error('Unauthorized method call');
		// Caller is now confirmed to be in the class hierarchy for this instance
	}

	// Example of calling a pseudo-protected method on the same instance
	callGatedMethod () {
		this.gatedMethod(this.#_);
	}

	// Example of calling a pseudo-protected method across instances
	callOtherGatedMethod (other) {
		if (#_ in other) { // brand check
			other.gatedMethod(other.#_);
		} else {
			// Incompatible
		}
	}
}

Object.freeze(Sub.prototype);
Object.freeze(Sub);
```

## Prototype Chain Inheritance

The shared-state object has a prototype chain that mirrors the class hierarchy. Each class defines its own `__protected` static property that extends the parent's:

```javascript
// Base class
class Base {
	static __protected = Object.freeze({
		baseMethod () { console.log('Base method'); },
		get protoBase () { return true; }
	});
}

// Sub class extends the prototype
class Sub extends Base {
	static __protected = Object.freeze(Object.setPrototypeOf({
		subMethod () {
			super.baseMethod(); // Call parent's protected method
			console.log('Sub method');
		},
		get protoSub () { return true; }
	}, super.__protected));
}

// Conceptual structure (not strictly valid syntax)
const instance = new Sub();
const state = instance.#_;

state.baseMethod();  // Inherited from Base
state.subMethod();   // Defined in Sub
console.log(state.protoBase);  // true (inherited)
console.log(state.protoSub);   // true (own property)
```

## Cross-Instance Protected Access

Cross-instance access is a natural consequence of how JavaScript private fields work. Since `#_` is class-private (not instance-private), methods within a class can access `#_` on other instances of the same (or more derived) classes:

```javascript
class Sub extends Base {
	// ...

	// Compare to another node that is instanceof Sub (i.e. Sub or extends Sub)
	// Note that this won't work with a new Base() instance because such an instance
	// has a Base #_ (inaccessible to Sub methods) but not a Sub #_.
	compareWith (otherNode) {
		const state = this.#_; // Sub-level #_ of this instance
		const otherState = otherNode.#_; // Sub-level #_ of otherNode

		return state.value === otherState.value;
	}
}
```

## How The Pattern Works

The pattern uses four key mechanisms:

1. **Shared-State Object with Prototype Chain**: The protected properties are stored in a single shared object created with `Object.create(this.constructor.__protected)`. This object has a prototype chain that mirrors the class hierarchy, allowing protected methods to be defined on the prototype.

2. **Private Fields (`#_`)**: Each class in the hierarchy has its own private `#_` field that references the same shared protected-state object. This ensures protected properties are accessible within the class hierarchy but not from outside.

3. **Tokenized Subscription Pattern**: During instantiation, the `Base` constructor creates a subscriber registration function (`#_subFn`) protected by a private token (`#_subToken`), and passes `#_subFn` to `this[_SUB]()`. Each subclass in the chain delegates to `super[_SUB](subFn)` to acquire the valid verification token and registers its private field setter via `return subFn(subToken, (p) => { this.#_ ||= p; });`. External callers cannot subvert `[_SUB]()` because `Base` validates the subscriber function and rejects unauthorized callers.

4. **Distribution**: When subclasses call `this[_GET]()` in their constructors after `super()`, `Base` distributes the protected shared-state object to all registered subscribers and removes the completed subscriptions.

### The `__this` Back-Reference

The shared-state object includes a non-enumerable `__this` property that references back to the original instance. This allows protected methods defined on the prototype to access the instance and verify authentication:

```javascript
static __protected = Object.freeze({
	logState () {
		const [thys, _thys] = [this.__this, this];

		// `thys` is the original instance
		// `_thys` is the protected shared-state object
		// Optional: verify main-object/protected-state-object association
		if (_thys !== thys.#_) throw new Error('Unauthorized');
		console.log('Protected state:', _thys);
	}
});
```

## Property and Method Access Levels

```javascript
class Example extends Base {
	#_;
	#privateField;  // Private: only accessible in this class

	static __protected = Object.freeze(Object.setPrototypeOf({
		// Protected method on prototype
		protectedMethod () {
			const [thys, _thys] = [this.__this, this];

			// Access protected properties via `_thys` (the shared-state object)
			console.log('Protected value:', _thys.protectedField);
			// Access instance via `thys`
			console.log('Instance:', thys);
		}
	}, super.__protected));

	constructor () {
		super();
		this[_GET]();

		const state = this.#_;

		this.publicField = 'public';           // Public: accessible everywhere
		state.protectedField = 'protected';    // Protected: accessible in hierarchy
		this.#privateField = 'private';        // Private: only in this class

		// Call protected method
		state.protectedMethod();
	}

	[_SUB] (subFn) {
		const subToken = super[_SUB](subFn);
		return subFn(subToken, (p) => { this.#_ ||= p; });
	}
}

Object.freeze(Example.prototype);
Object.freeze(Example);
```

## Protected Methods vs Pseudo-Protected Methods

### Protected Methods on Prototype

Protected methods can be defined on the `__protected` static property. These methods are accessible through the shared-state object and can access protected properties directly:

```javascript
static __protected = Object.freeze({
	// Protected method accessible via state.protectedMethod()
	protectedMethod () {
		const [thys, _thys] = [this.__this, this];

		// `_thys` is the shared-state object
		console.log('Protected property:', _thys.protectedField);
		// Access instance via `thys`
		const instance = thys;
	}
});

// Call from any method in the hierarchy
someMethod () {
	this.#_.protectedMethod();
}
```

### Pseudo-Protected Methods

Pseudo-protected ("gated") methods are publicly-visible methods that require the caller to pass the shared-state object to verify authenticity. This pattern is useful when you need a method to be callable from outside but want to restrict access:

```javascript
// Pseudo-protected method (publicly visible but access-controlled)
gatedMethod (state) {
	if (state !== this.#_) throw new Error('Unauthorized method call');
	// Caller is confirmed to be in the class hierarchy for this instance
}

// A method at any class level can call a pseudo-protected method on its own instance
// (the #_ of each class refers to the same shared object)
callGatedMethod () {
	this.gatedMethod(this.#_);
}

// A method can also call a pseudo-protected method on another instance
// if the other instance is instanceof the calling method's class
// (A method in a more-derived sub-class cannot protected-call a less-derived instance)
callOtherGatedMethod (other) {
	if (#_ in other) { // brand check
		other.gatedMethod(other.#_);
	} else {
		// Incompatible
	}
}
```

## Security and Execution Environment Integrity

The security of this protected-properties pattern relies on **execution environment integrity**. In JavaScript, private fields (`#field`) are enforced by the JavaScript engine, but the pattern orchestrates sharing using standard runtime built-ins.

### Environmental Dependencies

The security guarantees depend on standard JavaScript built-ins and prototypes remaining uncompromised:
- `Object`, `Object.prototype`, and methods such as `Object.assign`, `Object.create`, `Object.defineProperty`, `Object.freeze`, and `Object.setPrototypeOf`
- `Set`, `Set.prototype`, and methods such as `Set.prototype.add`, `Set.prototype.delete`, and `Set.prototype[Symbol.iterator]`
- `Symbol`, `Symbol.iterator`, and `Symbol.for`
- `Function.prototype`

If untrusted code executes prior to class initialization or mutates these built-in prototypes or methods (e.g. prototype pollution or monkey-patching), it could intercept shared state or subvert verification tokens.

### Environmental Hardening

To harden runtime environments you control (e.g., at Node.js or Deno startup before loading untrusted modules):

```javascript
if (!Object.isFrozen(Object)) {
	Object.freeze(Object);
	Object.freeze(Object.prototype);
	Object.freeze(Set);
	Object.freeze(Set.prototype);
	Object.freeze(Symbol);
	Object.freeze(Function.prototype);
}
```

Additionally, `Base` and `Sub` implementations freeze their prototypes and constructors (`Object.freeze(Base.prototype)`, `Object.freeze(Base)`) as well as the protected prototypes (`__protected`) to guard against prototype tampering after initialization.

### Practical Limitations

Integrity management is difficult even under the best of circumstances and is impossible to guarantee in uncontrolled environments (such as web browsers executing arbitrary third-party scripts or browser extensions). The pattern provides robust encapsulation for application architecture and guards against accidental misuse, but true security isolation in JavaScript requires a hardened, pristine runtime environment.

## Browser Support

Works in all modern browsers and Deno / Node.js / etc. environments that support:
- ES6 Classes
- ES2022 Private fields (`#`)

## License

This content is placed in the public domain by the author.

## Resources

- [Blog Post: Implementing JavaScript Protected Properties](https://www.kappacs.com/implementing-javascript-protected-properties)
- Author: Brian Katzung <briank@kappacs.com>

## Contributing

This is a pattern demonstration. Feel free to adapt it to your needs or suggest improvements via issues and pull requests.

## Credits

- The new, shorter `#_` naming convention was inspired by this [gist](https://gist.github.com/crisdosaygo/636a40f9e47967cf14b0d4b5ebd68e72) by [crisdosaygo](https://github.com/crisdosaygo/).
- Many thanks to [Jordan Harband](https://es.discourse.group/u/ljharb/summary) for [detailed analysis, feedback, and fixes](https://es.discourse.group/t/protected-support-for-class/68/30).
