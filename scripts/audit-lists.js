#!/usr/bin/env node
/**
 * List audit: inventories every FlatList/SectionList under src/ and enforces the
 * contract in specs/003-flatlist-optimization/contracts/list-api.md §C5.
 *
 * Rules enforced:
 *   1. No FlatList without a `data` prop  (it is a ScrollView, not a list)
 *   2. No list without `keyExtractor`     (index keys break reconciliation)
 *   3. No inline `renderItem={({item}) => ...}` (new identity every render)
 *   4. No `onEndReachedThreshold` > 1     (unit is multiples of viewport)
 *
 * Comments are stripped before matching. This is not optional: `keyExtractor` on
 * locationcards.js and `scrollEnabled={false}` on posts.screen.js are both present
 * but commented out, and a naive matcher reports them as active.
 *
 * Usage: npm run audit:lists [--json]
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const TAG = /<((?:Animated\.)?(?:FlatList|SectionList))(\s|>)/g;

function collect(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(p, out);
    else if (/\.jsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

// Find the end of the opening JSX tag, ignoring `>` inside braces.
function openingTagEnd(src, from) {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return i;
  }
  return -1;
}

function stripComments(block) {
  return block
    .split("\n")
    .filter((line) => !/^\s*\/\//.test(line))
    .join("\n")
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

function analyze() {
  const rows = [];
  for (const file of collect(SRC)) {
    const src = fs.readFileSync(file, "utf8");
    TAG.lastIndex = 0;
    let m;
    while ((m = TAG.exec(src))) {
      const end = openingTagEnd(src, m.index + m[1].length + 1);
      if (end < 0) continue;
      const block = stripComments(src.slice(m.index, end + 1));
      const thresholdMatch = block.match(/onEndReachedThreshold=\{([\d.]+)\}/);
      rows.push({
        file: path.relative(ROOT, file),
        line: src.slice(0, m.index).split("\n").length,
        tag: m[1],
        hasData: /\sdata=/.test(block),
        hasRenderItem: /renderItem=/.test(block),
        keyExtractor: /keyExtractor=/.test(block),
        inlineRenderItem: /renderItem=\{\s*\(/.test(block),
        getItemLayout: /getItemLayout=/.test(block),
        horizontal: /horizontal(=\{true\}|\s|>)/.test(block),
        noScroll: /scrollEnabled=\{false\}/.test(block),
        inlineStyle: /(?:contentContainerStyle|style)=\{\{/.test(block),
        threshold: thresholdMatch ? parseFloat(thresholdMatch[1]) : null,
      });
    }
  }
  return rows;
}

const rows = analyze();

const violations = {
  noData: rows.filter((r) => !r.hasData && !r.hasRenderItem),
  missingKey: rows.filter((r) => r.hasData && !r.keyExtractor),
  inlineRenderItem: rows.filter((r) => r.inlineRenderItem),
  badThreshold: rows.filter((r) => r.threshold !== null && r.threshold > 1),
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ rows, violations }, null, 2));
  process.exit(0);
}

console.log(`List instances: ${rows.length}`);
console.log(`  missing keyExtractor:      ${violations.missingKey.length}`);
console.log(`  inline renderItem:         ${violations.inlineRenderItem.length}`);
console.log(`  FlatList without data:     ${violations.noData.length}`);
console.log(`  onEndReachedThreshold > 1: ${violations.badThreshold.length}`);
console.log(`  getItemLayout present:     ${rows.filter((r) => r.getItemLayout).length}`);
console.log(`  scrollEnabled={false}:     ${rows.filter((r) => r.noScroll).length}`);
console.log(`  horizontal:                ${rows.filter((r) => r.horizontal).length}`);
console.log(`  inline style objects:      ${rows.filter((r) => r.inlineStyle).length}`);

const label = {
  noData: "FlatList with no data and no renderItem (use ScrollView)",
  missingKey: "missing keyExtractor (falls back to index keys)",
  inlineRenderItem: "inline renderItem (new identity every render)",
  badThreshold: "onEndReachedThreshold > 1 (unit is multiples of viewport)",
};

let failed = false;
for (const [key, list] of Object.entries(violations)) {
  if (!list.length) continue;
  failed = true;
  console.error(`\nERROR: ${label[key]}`);
  for (const r of list) {
    const extra = key === "badThreshold" ? ` (= ${r.threshold})` : "";
    console.error(`  ${r.file}:${r.line}${extra}`);
  }
}

if (failed) {
  console.error("\nSee specs/003-flatlist-optimization/contracts/list-api.md");
  process.exit(1);
}

console.log("\naudit:lists OK");
