#### (Currently Experimental Stage)

jstf: Simple Types and Custom Classes for NodeJS Functions.
# Write better JavaScript, Keep it simple, and actually enforce types of function arguments at runtime.

jstf is a super tiny superset of Node.js that adds optional runtime type validation to function arguments.

It supports simple built-in types like `string`, `number`, and `boolean`, as well as custom classess.

```js
function add(a: number, b: number) {
    return a + b;
}
```

jstf transpiles this into JavaScript AND adds runtime checks:

```js
function add(a, b) {
    if (typeof a !== "number") throw new TypeError();
    if (typeof b !== "number") throw new TypeError();

    return a + b;
}
```

### Also supports custom classes:
```js
class User {
   id = 1
}

function fn1(user: User) {
	console.log(user);
}

fn1(new User());

fn1('other type'); // TypeError: user must be User

```


### Why?

Somehow both JavaScript and TypeScript don't satisfy this common need:

* **JavaScript** — no type validation at all for function arguments, not even for simple types like string, number, boolean, etc.
* **TypeScript** — compile-time types, erased at runtime, also adds a lot of development time, because of complex type definitions.
* **jstf** — simple types and custom classes for function arguments validated at runtime.

Unlike TypeScript, jstf only focuses on function arguments. Variables and return values remain normal JavaScript.

We're trying to avoid building a type system that leads to wasting time through micromanagement, and instead remain practical by focusing only on typed function arguments only.

The runtime overhead per function call is very small and generally negligible compared to real-world work such as HTTP requests, database queries, and heavy I/O.

### Usage
```
jstf yourscript.jstf
```

### Install
```
git clone https://github.com/flowagi-eu/jstf
npm install # for esbuild
npm link # for 'jstf' command
```


