#!/usr/bin/env node
/**
 * Static-config screens receive ONLY `route`.
 *
 * @react-navigation/core renders them through a render callback:
 *
 *   const MemoizedScreen = React.memo(({ component }) => {
 *     const route = useRoute();
 *     return React.createElement(component, { route });   // no navigation
 *   });
 *
 * So a screen written as `({ navigation }) => ...` gets `undefined` and throws
 * "Cannot read property 'navigate' of undefined" the first time it navigates.
 * Use `useNavigation()` instead. This check fails the build on the prop form.
 *
 * Usage: npm run check:screen-props
 */
"use strict";

const babel = require("@babel/core");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// Components registered in a static navigator config.
function registeredScreens() {
  const names = new Set();
  for (const f of ["navigation.js", "src/screens/homenavigation.js"]) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, "utf8");
    for (const m of s.matchAll(/screen:\s*(\w+)/g)) names.add(m[1]);
    for (const m of s.matchAll(/\n\s{4}[\w"' -]+:\s*(\w+),/g)) names.add(m[1]);
  }
  return names;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.jsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const screens = registeredScreens();
const bad = [];
const unparseable = [];

for (const file of walk(path.join(ROOT, "src"))) {
  let ast;
  try {
    ast = babel.parseSync(fs.readFileSync(file, "utf8"), {
      filename: file, cwd: ROOT, presets: ["babel-preset-expo"],
      babelrc: false, configFile: false,
    });
  } catch (e) {
    // Never swallow this: a file that does not parse is a failure, and
    // silently skipping it would let a real regression through unnoticed.
    unparseable.push(`${path.relative(ROOT, file)}: ${e.message.split("\n")[0]}`);
    continue;
  }

  babel.traverse(ast, {
    VariableDeclarator(p) {
      const name = p.node.id.name;
      if (!name || !screens.has(name)) return;
      const fn = p.node.init;
      if (!fn || !/FunctionExpression|ArrowFunctionExpression/.test(fn.type)) return;
      const param = fn.params[0];
      if (!param || param.type !== "ObjectPattern") return;
      const takesNav = param.properties.some(
        (pr) => pr.type === "ObjectProperty" && pr.key.name === "navigation"
      );
      if (takesNav) {
        bad.push(`${path.relative(ROOT, file)}  ->  ${name}`);
      }
    },
  });
}

if (unparseable.length) {
  console.error("ERROR: these files could not be parsed, so they were not checked:\n");
  unparseable.forEach((u) => console.error("  " + u));
  process.exit(1);
}

if (bad.length) {
  console.error("ERROR: static-config screens cannot take a `navigation` prop.");
  console.error("       They receive only `route`. Use useNavigation() instead.\n");
  bad.forEach((b) => console.error("  " + b));
  process.exit(1);
}

console.log(`check:screen-props OK - ${screens.size} registered screens, none rely on a navigation prop.`);
