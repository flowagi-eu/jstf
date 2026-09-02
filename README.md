#### Currently Experimental

# Run JavaScript/TypeScript without strict rules + runtime type checking for functions (using @CheckAtRuntime)

jstf lets you use TypeScript syntax directly in Node.js without requiring types everywhere or enforcing a strict TypeScript workflow.

It transpiles `.ts` and `.tsx` files in memory using esbuild and otherwise behaves like normal Node.js.

When you want runtime type checking, use `@CheckAtRuntime`:

```ts
@CheckAtRuntime
function greet(user: User, name: string) {
    console.log(`Hello ${name}`);
}

greet(new User(), "John");

greet("wrong", 123);
// TypeError: user must be User
```

Without `@CheckAtRuntime`, types are optional and are simply transpiled away:

```ts
function greet(name: string) {
    console.log(name);
}

greet(123); // runs normally
```

### Features

* TypeScript syntax in Node.js
* No strict typing rules
* `.ts` / `.tsx` with ESM imports
* In-memory esbuild transpilation
* `@CheckAtRuntime` for runtime type checking
* Automatically loads .env from the script directory
* Source maps in `.source-map/`
* Normal Node.js `process.argv`

### Usage

```bash
jstf server.ts arg1 arg2
```

### Install

```bash
git clone https://github.com/flowagi-eu/jstf
cd jstf
npm install
npm link
```

### Philosophy

**Use TypeScript syntax when you want it. Keep JavaScript's freedom. Add runtime type checking fast on-demand without needing additional libraries.**

