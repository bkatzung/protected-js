# protected-js

A pattern for implementing protected properties and methods in native JavaScript using ES2022 private fields and shared-state objects.

## Overview

JavaScript doesn't natively support protected properties (properties accessible within a class hierarchy but not from outside). This library provides a sophisticated pattern to implement protected properties and methods using JavaScript's private fields (`#`), a subscription-based distribution system, and a shared-state object with prototype inheritance.

## Features

- **True Protected Properties**: Properties accessible within class hierarchies but not from outside
- **Protected Shared-State Object**: A single shared object with prototype chain for protected data and methods
- **Protected Methods on Prototype**: Methods defined on the protected prototype that can access protected state
- **Pseudo-Protected Methods**: Access-controlled methods that verify caller authenticity
- **Cross-Instance Access**: Naturally supports protected property access across instances of the same class
- **Zero Dependencies**: Pure JavaScript implementation
- **Type Safe**: Works seamlessly with TypeScript
- **Lightweight**: Minimal overhead with efficient subscription pattern

## Pattern Application

### Base-Class Pattern

Incorporate the base-class pattern into your base class. Excerpted from [`protected-base.js`](protected-base.js):

```javascript
// Base-class protected-properties-pattern essentials
class Base {
	#guarded; // Base's private access to shared protected properties
	#guardedSubs = new Set(); // Subscribers (setter functions)

	// Base-class prototype for protected shared-state object
	static protoProtected = {
		logGuarded () {
			// When called as guarded.logGuarded() or this.#guarded.logGuarded():
			// `this` will be the protected shared-state object
			// `this.thys` will be the original object instance
			const guarded = this.thys.#guarded;
			console.log('Base #guarded:', guarded);
		},
		get protoBase () { return true; }
	};

	constructor () {
		const guarded = this.#guarded = Object.create(this.constructor.protoProtected);
		guarded.thys = this; // Back-reference to the instance
		guarded.base = true; // Protected property
		this._subGuarded(this.#guardedSubs); // Invite sub-class access
		// Public props: this.prop
		// Protected props: this.#guarded.prop (or guarded.prop)
		// Private props: this.#prop
	}

	// Distribute protected-property access
	_getGuarded () {
		const guarded = this.#guarded, subs = this.#guardedSubs;
		try {
			for (const sub of subs) {
				sub(guarded); // Attempt distribution to subscriber
				subs.delete(sub); // Remove successfully-completed subscriptions
			}
		}
		catch (_) { }
	}

	_subGuarded () { } // Base-class stub
}
```

### Sub-Class Pattern

Incorporate the sub-class pattern into your sub-classes. Excerpted from [`protected-sub.js`](protected-sub.js):

```javascript
// Sub-class protected-properties-pattern essentials
class Sub extends Base {
	#guarded; // Sub's private access to shared protected properties

	// Sub-class prototype for protected shared-state object
	static protoProtected = Object.setPrototypeOf({
		logGuarded () {
			console.log('Sub #guarded', this.thys.#guarded);
			super.logGuarded(); // Call parent's protected method
		},
		get protoSub () { return true; }
	}, Base.protoProtected);

	constructor () {
		super();
		// <-- Sub's this.#guarded no longer throws
		this._getGuarded(); // Obtain protected-property access
		// <-- Sub's this.#guarded is now populated and available for use
		const guarded = this.#guarded;
		guarded.sub = true; // Protected property
	}

	// Subscribe to #guarded protected properties
	_subGuarded (subs) {
		super._subGuarded(subs); // Must be first
		subs.add((g) => this.#guarded ||= g); // Set this.#guarded once
	}
}
```

## Prototype Chain Inheritance

The shared-state object has a prototype chain that mirrors the class hierarchy. Each class defines its own `protoProtected` static property that extends the parent's:

```javascript
// Base class
class Base {
	static protoProtected = {
		baseMethod () { console.log('Base method'); },
		get protoBase () { return true; }
	};
}

// Sub class extends the prototype
class Sub extends Base {
	static protoProtected = Object.setPrototypeOf({
		subMethod () {
			super.baseMethod(); // Call parent's protected method
			console.log('Sub method');
		},
		get protoSub () { return true; }
	}, Base.protoProtected);
}

// Conceptual structure (not strictly valid syntax)
const instance = new Sub();
const guarded = instance.#guarded;
guarded.baseMethod();  // Inherited from Base
guarded.subMethod();   // Defined in Sub
console.log(guarded.protoBase);  // true (inherited)
console.log(guarded.protoSub);   // true (own property)
```

## Cross-Instance Protected Access

Cross-instance access is a natural consequence of how JavaScript private fields work. Since `#guarded` is class-private (not instance-private), methods within a class can access `#guarded` on other instances of the same (or more derived) classes:

```javascript
class Sub extends Base {
	// ...

	// Compare to another node that is instanceof Sub (i.e. Sub or extends Sub)
	// Note that this won't work with a new Base() instance because such an instance
	// has a Base #guarded (inaccessible to Sub methods) but not a Sub #guarded.
	compareWith (otherNode) {
		const guarded = this.#guarded; // Sub-level #guarded of this instance
		const otherGuarded = otherNode.#guarded; // Sub-level #guarded of otherNode
		return guarded.value === otherGuarded.value;
	}
}
```

## How The Pattern Works

The pattern uses four key mechanisms:

1. **Shared-State Object with Prototype Chain**: The protected properties are stored in a single shared object created with `Object.create(this.constructor.protoProtected)`. This object has a prototype chain that mirrors the class hierarchy, allowing protected methods to be defined on the prototype.

2. **Private Fields (`#guarded`)**: Each class in the hierarchy has its own private `#guarded` field that references the same shared protected-state object. This ensures protected properties are accessible within the class hierarchy but not from outside.

3. **Subscription Pattern**: Subclasses subscribe to receive the protected shared-state object through the `_subGuarded()` method. The base class collects these subscriptions during construction.

4. **Distribution**: The base class distributes the protected shared-state object to all subscribers via `_getGuarded()`, which must be called in each subclass constructor after `super()`.

### The `thys` Back-Reference

The shared-state object includes a `thys` property that references back to the original instance. This allows protected methods defined on the prototype to access the instance's private fields:

```javascript
static protoProtected = {
	logGuarded () {
		// `this` is the shared-state object
		// `this.thys` is the original instance
		const guarded = this.thys.#guarded;
		console.log('Protected state:', guarded);
	}
};
```

## Property and Method Access Levels

```javascript
class Example extends Base {
	#guarded;
	#privateField;  // Private: only accessible in this class

	static protoProtected = Object.setPrototypeOf({
		// Protected method on prototype
		protectedMethod () {
			// Access protected properties via `this` (the shared-state object)
			console.log('Protected value:', this.protectedField);
			// Access instance via `this.thys`
			console.log('Instance:', this.thys);
		}
	}, Base.protoProtected);

	constructor () {
		super();
		this._getGuarded();
		const guarded = this.#guarded;

		this.publicField = 'public';           // Public: accessible everywhere
		guarded.protectedField = 'protected';  // Protected: accessible in hierarchy
		this.#privateField = 'private';        // Private: only in this class

		// Call protected method
		guarded.protectedMethod();
	}
}
```

## Protected Methods vs Pseudo-Protected Methods

### Protected Methods on Prototype

Protected methods can be defined on the `protoProtected` static property. These methods are accessible through the shared-state object and can access protected properties directly:

```javascript
static protoProtected = {
	// Protected method accessible via guarded.protectedMethod()
	protectedMethod () {
		// `this` is the shared-state object
		console.log('Protected property:', this.protectedField);
		// Access instance via `this.thys`
		const instance = this.thys;
	}
};

// Call from any method in the hierarchy
someMethod () {
	this.#guarded.protectedMethod();
}
```

### Pseudo-Protected Methods

Pseudo-protected methods are publicly-visible methods that require the caller to pass the shared-state object to verify authenticity. This pattern is useful when you need a method to be callable from outside but want to restrict access:

```javascript
// Pseudo-protected method (publicly visible but access-controlled)
guardedMethod (guarded) {
	if (guarded !== this.#guarded) throw new Error('Unauthorized method call');
	// Caller is confirmed to be in the class hierarchy for this instance
}

// A method at any class level can call a pseudo-protected method on its own instance
// (the #guarded of each class refers to the same shared object)
callGuardedMethod () {
	this.guardedMethod(this.#guarded);
}

// A method can also call a pseudo-protected method on another instance
// if the other instance is instanceof the calling method's class
// (A method in a more-derived sub-class cannot protected-call a less-derived instance)
callOtherGuardedMethod (other) {
	try {
		const otherGuarded = other.#guarded; // Throws if other is incompatible
		other.guardedMethod(otherGuarded);
	} catch (_err) {
		// TypeError thrown if other is incompatible
	}
}
```

## Browser Support

Works in all modern browsers and Deno / Node.js / etc. environments that support:
- ES6 Classes
- Private fields (`#`)

## License

This content is placed in the public domain by the author.

## Resources

- [Blog Post: Implementing JavaScript Protected Properties](https://www.kappacs.com/implementing-javascript-protected-properties)
- Author: Brian Katzung <briank@kappacs.com>

## Contributing

This is a pattern demonstration. Feel free to adapt it to your needs or suggest improvements via issues and pull requests.
