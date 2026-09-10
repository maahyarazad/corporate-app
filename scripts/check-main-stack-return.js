#!/usr/bin/env node
/**
 * Going home goes through returnToMain(), never navigate("Main", ...).
 *
 * navigate() pops only when the target is ALREADY in the stack
 * (@react-navigation/routers StackRouter.js, NAVIGATE case: it returns
 * `routes.slice(0, index)` on a hit). When it is not, navigate PUSHES.
 *
 * `Main` really is absent from the stack in this app: availOffer.screen.js and
 * offerRedeemForm.js both reset to `[TransactionSummary]`. From there,
 * navigate("Main") yields [TransactionSummary, Main] - the receipt mounted
 * underneath the home screen, reachable by pressing back.
 *
 * So this is not a style rule. The banned form is correct on the common path
 * and wrong on a real one, which is exactly the kind of thing a human review
 * waves through. Hence a gate.
 *
 * Usage: npm run check:main-return
 */
"use strict";

const babel = require("@babel/core");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// The helper itself is where the reset lives, so it is the one place allowed to
// name the route. Excluded by path rather than by a comment pragma, matching
// how the other gates in this directory handle their exemptions.
const EXEMPT = [path.join("src", "navigation", "navigate.js")];

const BANNED_ROUTE = "Main";

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.jsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

// Matches both `navigate("Main")` and `<anything>.navigate("Main")` - the
// module helper and the useNavigation() form. Property access is checked on the
// name only, so navigation.navigate, nav.navigate and props.navigation.navigate
// are all caught.
function isNavigateCallee(callee) {
  if (callee.type === "Identifier") return callee.name === "navigate";
  if (callee.type === "MemberExpression" && !callee.computed) {
    return callee.property.type === "Identifier" &&
      callee.property.name === "navigate";
  }
  return false;
}

const bad = [];
const unparseable = [];

for (const file of walk(path.join(ROOT, "src"))) {
  const rel = path.relative(ROOT, file);
  if (EXEMPT.includes(rel)) continue;

  let ast;
  try {
    ast = babel.parseSync(fs.readFileSync(file, "utf8"), {
      filename: file, cwd: ROOT, presets: ["babel-preset-expo"],
      babelrc: false, configFile: false,
    });
  } catch (e) {
    // Never swallow this: a file that does not parse is a failure, and
    // silently skipping it would let a real regression through unnoticed.
    unparseable.push(`${rel}: ${e.message.split("\n")[0]}`);
    continue;
  }

  babel.traverse(ast, {
    CallExpression(p) {
      if (!isNavigateCallee(p.node.callee)) return;
      const first = p.node.arguments[0];
      if (!first || first.type !== "StringLiteral") return;
      if (first.value !== BANNED_ROUTE) return;
      bad.push(`${rel}:${p.node.loc ? p.node.loc.start.line : "?"}`);
    },
  });
}

if (unparseable.length) {
  console.error("ERROR: these files could not be parsed, so they were not checked:\n");
  unparseable.forEach((u) => console.error("  " + u));
  process.exit(1);
}

if (bad.length) {
  console.error(`ERROR: navigate("${BANNED_ROUTE}", ...) does not reliably go home.`);
  console.error("       It pops only if Main is already in the stack, and pushes if it is not");
  console.error("       - which is what happens after a redemption. Use returnToMain() from");
  console.error("       src/navigation/navigate.js instead.\n");
  bad.forEach((b) => console.error("  " + b));
  process.exit(1);
}

console.log(`check:main-return OK - no direct navigate("${BANNED_ROUTE}") outside ${EXEMPT.join(", ")}.`);
