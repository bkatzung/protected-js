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

## Naming Conventions

- **`#_`**: Private field for accessing the shared protected-state object (formerly `#guarded`)
- **`#_subs`**: Private field for protected-property subscriptions (formerly `#guardedSubs`)
- **`__protected`**: Static property defining the protected prototype (formerly `protoProtected`)
- **`__this`**: Property on the protected-state object referencing the original instance (formerly `thys`)
- **`_thys`**: Local variable name for the protected-state object (when `this` refers to it)
- **`thys`**: Local variable name for the original instance object
- **`_get_()`**: Method to distribute protected-property access (formerly `_getGuarded()`)
- **`_sub_()`**: Method to subscribe to protected-property access (formerly `_subGuarded()`)

## Pattern Application

### Base-Class Pattern

Incorporate the base-class pattern into your base class. Excerpted from [`protected-base.js`](protected-base.js):

```javascript
// Base-class protected-properties-pattern essentials
class Base {
	#_; // Base's private access to shared protected properties
	#_subs = new Set(); // Protected-property subscriptions (setter functions)

	// Base-class prototype for protected shared-state object
	static __protected = {
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
			__this: this, // Back-reference to the instance
			base: true, // Protected property
		});
		this._sub_(this.#_subs); // Invite sub-class access
		// Public props: this.prop
		// Protected props: this.#_.prop (or guarded.prop)
		// Private props: this.#prop
	}

	// Distribute protected-property access
	_get_ () {
		const guarded = this.#_, subs = this.#_subs;
		try {
			for (const sub of subs) {
				sub(guarded); // Attempt distribution to subscriber
				subs.delete(sub); // Remove successfully-completed subscriptions
			}
		}
		catch (_) { }
	}

	_sub_ () { } // Base-class stub
}
```

### Sub-Class Pattern

Incorporate the sub-class pattern into your sub-classes. Excerpted from [`protected-sub.js`](protected-sub.js):

```javascript
// Sub-class protected-properties-pattern essentials
class Sub extends Base {
	#_; // Sub's private access to shared protected properties

	// Sub-class prototype for protected shared-state object
	static __protected = Object.setPrototypeOf({
		logGuarded () {
			const [thys, _thys] = [this.__this, this];
			if (_thys !== thys.#_) throw new Error('Unauthorized');
			console.log('Sub #_', this);
			super.logGuarded(); // Call parent's protected method
		},
		get protoSub () { return true; }
	}, super.__protected);

	constructor () {
		super();
		// <-- Sub's this.#_ no longer throws
		this._get_(); // Obtain protected-property access
		// <-- Sub's this.#_ is now populated and available for use
		const guarded = this.#_;
		guarded.sub = true; // Protected property
	}

	// Subscribe to #_ protected properties
	_sub_ (subs) {
		super._sub_(subs); // Must be first
		subs.add((p) => this.#_ ||= p); // Set this.#_ once
	}
}
```

## Prototype Chain Inheritance

The shared-state object has a prototype chain that mirrors the class hierarchy. Each class defines its own `__protected` static property that extends the parent's:

```javascript
// Base class
class Base {
	static __protected = {
		baseMethod () { console.log('Base method'); },
		get protoBase () { return true; }
	};
}

// Sub class extends the prototype
class Sub extends Base {
	static __protected = Object.setPrototypeOf({
		subMethod () {
			super.baseMethod(); // Call parent's protected method
			console.log('Sub method');
		},
		get protoSub () { return true; }
	}, super.__protected);
}

// Conceptual structure (not strictly valid syntax)
const instance = new Sub();
const guarded = instance.#_;
guarded.baseMethod();  // Inherited from Base
guarded.subMethod();   // Defined in Sub
console.log(guarded.protoBase);  // true (inherited)
console.log(guarded.protoSub);   // true (own property)
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
		const guarded = this.#_; // Sub-level #_ of this instance
		const otherGuarded = otherNode.#_; // Sub-level #_ of otherNode
		return guarded.value === otherGuarded.value;
	}
}
```

## How The Pattern Works

The pattern uses four key mechanisms:

1. **Shared-State Object with Prototype Chain**: The protected properties are stored in a single shared object created with `Object.create(this.constructor.__protected)`. This object has a prototype chain that mirrors the class hierarchy, allowing protected methods to be defined on the prototype.

2. **Private Fields (`#_`)**: Each class in the hierarchy has its own private `#_` field that references the same shared protected-state object. This ensures protected properties are accessible within the class hierarchy but not from outside.

3. **Subscription Pattern**: Subclasses subscribe to receive the protected shared-state object through the `_sub_()` method. The base class collects these subscriptions during construction.

4. **Distribution**: The base class distributes the protected shared-state object to all subscribers via `_get_()`, which must be called in each subclass constructor after `super()`.

### The `__this` Back-Reference

The shared-state object includes a `__this` property that references back to the original instance. This allows protected methods defined on the prototype to access the instance's private fields:

```javascript
static __protected = {
	logGuarded () {
		const [thys, _thys] = [this.__this, this];
		// `thys` is the original instance
		// `_thys` is the protected shared-state object
		// Optional: verify main-object/protected-state-object association
		if (_thys !== thys.#_) throw new Error('Unauthorized');
		console.log('Protected state:', _thys);
	}
};
```

## Property and Method Access Levels

```javascript
class Example extends Base {
	#_;
	#privateField;  // Private: only accessible in this class

	static __protected = Object.setPrototypeOf({
		// Protected method on prototype
		protectedMethod () {
			const [thys, _thys] = [this.__this, this];
			// Access protected properties via `_thys` (the shared-state object)
			console.log('Protected value:', _thys.protectedField);
			// Access instance via `thys`
			console.log('Instance:', thys);
		}
	}, super.__protected);

	constructor () {
		super();
		this._get_();
		const guarded = this.#_;

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

Protected methods can be defined on the `__protected` static property. These methods are accessible through the shared-state object and can access protected properties directly:

```javascript
static __protected = {
	// Protected method accessible via guarded.protectedMethod()
	protectedMethod () {
		const [thys, _thys] = [this.__this, this];
		// `_thys` is the shared-state object
		console.log('Protected property:', _thys.protectedField);
		// Access instance via `thys`
		const instance = thys;
	}
};

// Call from any method in the hierarchy
someMethod () {
	this.#_.protectedMethod();
}
```

### Pseudo-Protected Methods

Pseudo-protected methods are publicly-visible methods that require the caller to pass the shared-state object to verify authenticity. This pattern is useful when you need a method to be callable from outside but want to restrict access:

```javascript
// Pseudo-protected method (publicly visible but access-controlled)
guardedMethod (guarded) {
	if (guarded !== this.#_) throw new Error('Unauthorized method call');
	// Caller is confirmed to be in the class hierarchy for this instance
}

// A method at any class level can call a pseudo-protected method on its own instance
// (the #_ of each class refers to the same shared object)
callGuardedMethod () {
	this.guardedMethod(this.#_);
}

// A method can also call a pseudo-protected method on another instance
// if the other instance is instanceof the calling method's class
// (A method in a more-derived sub-class cannot protected-call a less-derived instance)
callOtherGuardedMethod (other) {
	try {
		const otherGuarded = other.#_; // Throws if other is incompatible
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
