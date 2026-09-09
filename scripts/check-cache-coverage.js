#!/usr/bin/env node
/**
 * Every GET made through useRequest must resolve to a cache policy.
 *
 * The response cache is applied centrally in hooks/useRequest.js, which consults
 * utils/cachePolicy.js. That indirection is what keeps call sites unchanged, but
 * it also means a new GET endpoint is silently uncached: nothing fails, the
 * screen just quietly stops benefiting. This check closes that gap by walking
 * every `request(url, "get", ...)` call site in the source and asserting each
 * one matches a policy.
 *
 * Template literals are normalised before matching: every `${...}` becomes `1`,
 * because a policy matches on the path shape and the id-anchored routes
 * (/v2/post/{id}, /v2/partner/{id}) expect a digit there. A non-numeric
 * placeholder would report those as uncovered when at runtime they match.
 *
 * Two levels of reporting, because cachePolicy.js ends in a catch-all and a
 * bare "does it match something" check would therefore always pass:
 *
 *   FAIL - a GET that resolves to no policy at all. Only reachable if the
 *          catch-all is removed or the url is not a literal path.
 *   WARN - a GET that only the catch-all picks up. Cached, but on the default
 *          TTL and user-scoped, so shared data gets a row per account. Worth a
 *          named policy; not worth failing a build over.
 *
 * Deliberately NOT covered: the two raw `axios.get("/v2/auth/refresh_token")`
 * calls in helper/refreshAccessToken.js and src/services/auth_v2/auth.context.js.
 * They bypass useRequest on purpose. Caching a token refresh would serve a stale
 * token and break authentication, so their exclusion is a requirement, not a gap.
 *
 * Usage: npm run check:cache-coverage
 */
"use strict";

const babel = require("@babel/core");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SEARCH_DIRS = ["src", "hooks"];

// Loading cachePolicy.js directly would need the babel pipeline; the module is
// plain data plus two pure functions, so it is cheaper to evaluate its source.
function loadPolicies() {
  const source = fs.readFileSync(
    path.join(ROOT, "utils", "cachePolicy.js"),
    "utf8"
  );
  const { code } = babel.transform(source, {
    filename: "cachePolicy.js",
    presets: [["@babel/preset-env", { targets: { node: "current" } }]],
    babelrc: false,
    configFile: false,
  });

  const module = { exports: {} };
  new Function("module", "exports", code)(module, module.exports);
  return module.exports;
}

function jsFiles(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      jsFiles(full, found);
    } else if (entry.name.endsWith(".js")) {
      found.push(full);
    }
  }
  return found;
}

// `request(url, "get", ...)` where url is a string or a template literal.
// Interpolations collapse to a placeholder: policies match on path, not query.
const CALL = /request\(\s*(`[^`]*`|"[^"]*"|'[^']*')\s*,\s*["'`]get["'`]/g;

function normalise(raw) {
  return raw
    .slice(1, -1)
    .replace(/\$\{[^}]*\}/g, "1")
    .trim();
}

function main() {
  const { policyFor } = loadPolicies();
  const uncovered = [];
  const defaulted = [];
  let checked = 0;

  for (const dir of SEARCH_DIRS) {
    for (const file of jsFiles(path.join(ROOT, dir))) {
      const source = fs.readFileSync(file, "utf8");
      for (const match of source.matchAll(CALL)) {
        const url = normalise(match[1]);
        if (!url.startsWith("/")) continue; // not a literal endpoint
        checked++;

        const policy = policyFor(url, "get");
        const where = `${path.relative(ROOT, file)}  ->  ${url}`;

        if (!policy) {
          uncovered.push(where);
        } else if (policy.id === "default-get") {
          defaulted.push(where);
        }
      }
    }
  }

  if (uncovered.length) {
    console.error(
      `\ncheck:cache-coverage FAILED - ${uncovered.length} GET call site(s) resolve to no cache policy:\n`
    );
    for (const line of uncovered) console.error(`  ${line}`);
    console.error(
      "\nAdd a policy to utils/cachePolicy.js, or confirm the catch-all should cover it.\n"
    );
    process.exit(1);
  }

  if (defaulted.length) {
    console.warn(
      `\ncheck:cache-coverage WARNING - ${defaulted.length} GET call site(s) fall through to the catch-all:\n`
    );
    for (const line of defaulted) console.warn(`  ${line}`);
    console.warn(
      "\nThese are cached, but on the default TTL and scoped per account. Give them a named policy in utils/cachePolicy.js when the right TTL is known.\n"
    );
  }

  console.log(
    `check:cache-coverage OK - ${checked} GET call sites, every one resolves to a cache policy` +
      (defaulted.length
        ? ` (${defaulted.length} via the catch-all).`
        : `, all named.`)
  );
}

main();
