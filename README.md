# protected-js

A pattern for implementing protected properties and methods in native JavaScript using ES2022 private fields.

## Overview

JavaScript doesn't natively support protected properties (properties accessible within a class hierarchy but not from outside). This library provides an elegant pattern to implement protected properties and methods using JavaScript's private fields (`#`) and a subscription-based distribution system.

## Features

- **True Protected Properties**: Properties accessible within class hierarchies but not from outside
- **Protected Methods**: Access-controlled methods that verify caller authenticity
- **Cross-Instance Access**: Optional variant supporting protected property access across instances
- **Zero Dependencies**: Pure JavaScript implementation
- **Type Safe**: Works seamlessly with TypeScript
- **Lightweight**: Minimal overhead with efficient subscription pattern

## Installation

Simply copy [`protected.js`](protected.js) or [`protected-cross-instance.js`](protected-cross-instance.js) into your project.

## Usage

### Basic Protected Properties

```javascript
import { A } from './protected.js';

// Base class with protected properties
class Animal extends A {
    #guarded;

    constructor(name) {
        super();
        this._getGuarded();
        const guarded = this.#guarded;
        
        // Initialize protected properties
        guarded.name = name;
        guarded.energy = 100;
    }

    _subGuarded(subs) {
        super._subGuarded(subs);
        subs.add((g) => this.#guarded ||= g);
    }

    // Protected method
    guardedGetEnergy(guarded) {
        if (guarded !== this.#guarded) throw new Error('Unauthorized');
        return guarded.energy;
    }
}

// Derived class accessing protected properties
class Dog extends Animal {
    #guarded;

    constructor(name, breed) {
        super(name);
        this._getGuarded();
        const guarded = this.#guarded;
        
        // Access protected properties from parent
        console.log(guarded.name); // Accessible!
        guarded.breed = breed;
    }

    _subGuarded(subs) {
        super._subGuarded(subs);
        subs.add((g) => this.#guarded ||= g);
    }

    bark() {
        const guarded = this.#guarded;
        console.log(`${guarded.name} (${guarded.breed}) barks!`);
        
        // Call protected method with authentication
        const energy = this.guardedGetEnergy(guarded);
        console.log(`Energy: ${energy}`);
    }
}

const dog = new Dog('Rex', 'Labrador');
dog.bark(); // Works!
// dog.#guarded // Error: Private field
// dog.guarded.name // Error: Not accessible
```

### Cross-Instance Protected Access

Use [`protected-cross-instance.js`](protected-cross-instance.js) when you need to access protected properties of other instances within the same class hierarchy:

```javascript
import { A } from './protected-cross-instance.js';

class Node extends A {
    #guarded;

    constructor(value) {
        super();
        this._getGuarded();
        const guarded = this.#guarded;
        guarded.value = value;
    }

    _subGuarded(subs) {
        super._subGuarded(subs);
        subs.add((g) => this.#guarded ||= g);
    }

    compareWith(otherNode) {
        const guarded = this.#guarded;
        // Access another instance's protected properties
        const otherGuarded = this._getGuardedFor(guarded, otherNode);
        return guarded.value === otherGuarded.value;
    }
}

const node1 = new Node(42);
const node2 = new Node(42);
console.log(node1.compareWith(node2)); // true
```

## How It Works

The pattern uses three key mechanisms:

1. **Private Fields (`#guarded`)**: Each class in the hierarchy has its own private `#guarded` field that references the same shared protected properties object.

2. **Subscription Pattern**: Subclasses subscribe to receive the protected properties object through the `_subGuarded()` method.

3. **Distribution**: The base class distributes the protected properties to all subscribers via `_getGuarded()`, which must be called in each constructor after `super()`.

### Property Access Levels

```javascript
class Example extends A {
    #guarded;
    #privateField;  // Private: only accessible in this class
    
    constructor() {
        super();
        this._getGuarded();
        const guarded = this.#guarded;
        
        this.publicField = 'public';           // Public: accessible everywhere
        guarded.protectedField = 'protected';  // Protected: accessible in hierarchy
        this.#privateField = 'private';        // Private: only in this class
    }
}
```

## API Reference

### Base Class `A`

#### Methods

- **`_getGuarded()`**: Distributes protected properties to subscribers. Must be called in each constructor after `super()`.
- **`_subGuarded(subs)`**: Override this to subscribe to protected properties. Add your setter function to the `subs` Set.
- **`guardedMethod(guarded)`**: Example of a protected method that requires authentication via the `guarded` parameter.

### Cross-Instance Variant

Additional method in [`protected-cross-instance.js`](protected-cross-instance.js):

- **`_getGuardedFor(auth, otherInstance)`**: Returns the protected properties of another instance. Requires authentication via the `auth` parameter.

## Implementation Pattern

For each class in your hierarchy:

1. Declare a private `#guarded` field
2. Call `super()` and `this._getGuarded()` in the constructor
3. Implement `_subGuarded(subs)` to subscribe to protected properties
4. Access protected properties via `this.#guarded.propertyName`

## Browser Support

Works in all modern browsers and Node.js environments that support:
- ES6 Classes
- Private fields (`#`)
- WeakMap (for cross-instance variant)

## License

This content is placed in the public domain by the author, Brian Katzung <briank@kappacs.com>.

## Resources

- [Blog Post: Implementing JavaScript Protected Properties](https://www.kappacs.com/implementing-javascript-protected-properties)
- Author: Brian Katzung <briank@kappacs.com>

## Contributing

This is a pattern demonstration. Feel free to adapt it to your needs or suggest improvements via issues and pull requests.
