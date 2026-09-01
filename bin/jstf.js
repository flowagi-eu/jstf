#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve, dirname, extname } from "node:path";
import { pathToFileURL } from "node:url";
import { register } from "node:module";
import * as esbuild from "esbuild";

const [, , entry, ...args] = process.argv;

if (!entry) {
  console.error("Usage: jstf <script.jstf> [args...]");
  process.exit(1);
}

const entryFile = resolve(entry);


if (!existsSync(entryFile)) {
  console.error(`File not found: ${entryFile}`);
  process.exit(1);
}

const configFile = resolve(
  dirname(entryFile),
  "jstf.config.js"
);

const esbuildPath = import.meta.resolve("esbuild");

/*
 * ------------------------------------------------------------
 * Loader
 * ------------------------------------------------------------
 *
 * Keep the loader as an in-memory module.
 */

const loaderSource = `
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from ${JSON.stringify(esbuildPath)};

const configFile = ${JSON.stringify(configFile)};

export async function load(url, context, nextLoad) {
  if (!url.startsWith("file:")) {
    return nextLoad(url, context);
  }

  const filename = fileURLToPath(url);

/*
   * Never transform node_modules.
   *
   * This is important because packages such as Express
   * may contain CommonJS .js files.
   */
  if (filename.includes("/node_modules/")) {
    return nextLoad(url, context);
  }

  if (extname(filename) !== ".js") {
    return nextLoad(url, context);
  }

  if (filename === configFile) {
    return nextLoad(url, context);
  }

  const source = await readFile(filename, "utf8");

  /*
   * Find the types BEFORE esbuild removes them.
   */
  const functions = findFunctions(source);

  /*
   * Strip the TypeScript-style annotations.
   */
  const result = await esbuild.transform(source, {
    loader: "ts",
    format: "esm",
  platform: "node",
    target: "es2022",
    sourcefile: filename,
    sourcemap: "inline"
  });

  /*
   * Add runtime checks.
   */
  const code = injectChecks(
    result.code,
    functions
  );

  return {
    format: "module",
    source: code,
    shortCircuit: true
  };
}


/*
 * ============================================================
 * FIND FUNCTIONS
 * ============================================================
 */

function findFunctions(source) {
  const functions = [];

  const regex =
    /function\\s+([A-Za-z_$][\\w$]*)\\s*\\(([^)]*)\\)\\s*\\{/g;

  let match;

  while ((match = regex.exec(source))) {
    const name = match[1];
    const parameters = match[2];
  //console.log('match',name,parameters);

    const checks = [];

    for (const parameter of splitParameters(parameters)) {
      const parsed = parseParameter(parameter);

      if (parsed) {
        checks.push(parsed);
      }
    }

    if (checks.length) {
      functions.push({
        name,
        checks
      });
    }
  }

  return functions;
}


/*
 * ============================================================
 * PARAMETERS
 * ============================================================
 */

function parseParameter(parameter) {
  const match = parameter
    .trim()
    .match(
      /^([A-Za-z_$][\\w$]*)\\s*:\\s*([A-Za-z_$][\\w$]*)$/
    );

  if (!match) {
    return null;
  }

  return {
    name: match[1],
    type: match[2]
  };
}


function splitParameters(value) {
  const result = [];

  let start = 0;
  let depth = 0;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if ("([{".includes(char)) {
      depth++;
    } else if (")]}".includes(char)) {
      depth--;
    } else if (char === "," && depth === 0) {
      result.push(value.slice(start, i));
      start = i + 1;
    }
  }

  result.push(value.slice(start));

  return result;
}


/*
 * ============================================================
 * TYPE CHECK
 * ============================================================
 */

function makeCheck(name, type) {
  let expression;

  if (type === "string") {
    expression =
      "typeof " + name + ' !== "string"';
  } else if (type === "number") {
    expression =
      "typeof " + name + ' !== "number"';
  } else if (type === "boolean") {
    expression =
      "typeof " + name + ' !== "boolean"';
  } else {
    /*
     * For now custom types are treated as classes.
     *
     * Example:
     *
     * class User {}
     *
     * function foo(user: User) {}
     */
    expression =
      "!(" + name + " instanceof " + type + ")";
  }

  const message =
    name + " must be " + type;

  return (
    "if (" + expression + ") {" +
    "\\n" +
    "  throw new TypeError(" +
    JSON.stringify(message) +
    ");" +
    "\\n" +
    "}"
  );
}


/*
 * ============================================================
 * INJECT CHECKS
 * ============================================================
 */

function injectChecks(code, functions) {
  /*
   * Work backwards so offsets don't matter.
   */
  for (const fn of functions.reverse()) {
    const checks = fn.checks
      .map(function (check) {
        return makeCheck(
          check.name,
          check.type
        );
      })
      .join("\\n");

    /*
     * Locate the compiled function.
     *
     * Example:
     *
     * function greet(name, age, active) {
     */
    const pattern = new RegExp(
      "function\\\\s+" +
      escapeRegExp(fn.name) +
      "\\\\s*\\\\([^)]*\\\\)\\\\s*\\\\{"
    );

    const match = pattern.exec(code);

    if (!match) {
      continue;
    }

    const position =
      match.index + match[0].length;

    code =
      code.slice(0, position) +
      "\\n" +
      checks +
      "\\n" +
      code.slice(position);
  }

  return code;
}


/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function escapeRegExp(value) {
  return value.replace(
    /[.*+?^()|[\]\\]/g,
    "\\$&"
  );
}
`;


/*
 * ------------------------------------------------------------
 * Register loader
 * ------------------------------------------------------------
 */

const loaderURL =
  "data:text/javascript;charset=utf-8," +
  encodeURIComponent(loaderSource);

register(loaderURL, {
  parentURL: pathToFileURL(entryFile).href
});


/*
 * ------------------------------------------------------------
 * Run target
 * ------------------------------------------------------------
 */

process.argv = [
  process.execPath,
  entryFile,
  ...args
];

await import(
  pathToFileURL(entryFile).href
);
