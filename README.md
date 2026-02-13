# protected-js

A pattern for implementing protected properties and methods in native JavaScript using ES2022 private fields.

## Overview

JavaScript doesn't natively support protected properties (properties accessible within a class hierarchy but not from outside). This library provides an elegant pattern to implement protected properties and methods using JavaScript's private fields (`#`) and a subscription-based distribution system.

## Features

- **True Protected Properties**: Properties accessible within class hierarchies but not from outside
- **Protected Methods**: Access-controlled methods that verify caller authenticity
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
    #guarded = { /* Protected-properties storage */ };
    #guardedSubs = new Set(); /* Subscribers (setter functions) */

    constructor () {
        this._subGuarded(this.#guardedSubs); // Invite sub-class access
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

    constructor () {
        super();
        this._getGuarded(); // Obtained protected-property access
    }

	// Subscribe to #guarded protected properties
    _subGuarded (subs) {
        super._subGuarded(subs);
        subs.add((g) => this.#guarded ||= g);
    }
}
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

The pattern uses three key mechanisms:

1. **Private Fields (`#guarded`)**: Each class in the hierarchy has its own private `#guarded` field that references the same shared protected properties object.

2. **Subscription Pattern**: Subclasses subscribe to receive the protected properties object through the `_subGuarded()` method.

3. **Distribution**: The base class distributes the protected properties to all subscribers via `_getGuarded()`, which must be called in each constructor after `super()`.

## Property Access Levels

```javascript
class Example extends Base {
    #guarded;
    #privateField;  // Private: only accessible in this class

    constructor () {
        super();
        this._getGuarded();
        const guarded = this.#guarded;

        this.publicField = 'public';           // Public: accessible everywhere
        guarded.protectedField = 'protected';  // Protected: accessible in hierarchy
        this.#privateField = 'private';        // Private: only in this class
    }
}
```

## Pseudo-Protected Methods

Pseudo-protected methods are publicly-visible methods that require the caller to verify that it is calling from within the instance class hierarchy.

```javascript
protectedMethod (guarded) {
    if (guarded !== this.#guarded) throw new Error('Unauthorized method call');
}

// A method at any class level can call a pseudo-protected method on its own instance
// (the #guarded of each class refers to the same shared objedt).
callProtectedMethod () {
    this.protectedMethod(this.#guarded);
}

// A method can also call a pseudo-protected method on another instance
// if the other instance is instanceof the calling method's class
// (A method in a more-derived sub-class cannot protected-call a less-derived instance)
callOtherProtectedMethod (other) {
    try {
        other.protectedMethod(other.#guarded);
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
