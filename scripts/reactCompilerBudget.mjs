/**
 * React Compiler coverage ratchet.
 *
 * The sibling script, reactCompilerLintBudget.mjs, counts what ESLint reports.
 * This one records what the compiler actually does, which is a different thing:
 * most refusal categories have no lint rule enabled, and `preserve-manual-
 * memoization` has never once fired in this workspace despite the compiler
 * refusing fourteen functions for exactly that reason. Only compiling finds
 * those.
 *
 * .react-compiler-budget.json names every file that is expected to refuse or to
 * opt out, and it must match exactly. Fixing one therefore fails the build too,
 * until its entry is removed.
 *
 *   refusals         file -> number of functions the compiler declined to memoize
 *   fileOptOuts      files opted out by a directive at the top of the file
 *   functionOptOuts  file -> number of functions opted out by a directive of their own
 *
 * Entries are per file, with no line numbers: the compiler reports every
 * offending function as `(anonymous)`, and a line would churn on any edit above
 * it. The OUTPUT does print locations, pointing at the offending expression
 * rather than the enclosing function.
 *
 * Opt-outs are tracked because a refusal vanishes from `refusals` whether it was
 * fixed or merely hidden behind a directive. Listing the opt-outs is what tells
 * those two apart.
 *
 * `functionOptOuts` is empty today. It is the easiest kind to miss: the file has
 * no directive at the top, so it is not a `fileOptOuts` entry, and the function
 * is skipped rather than refused, so it is not in `refusals` either. Without
 * this list nothing would record it.
 *
 * HOW A FILE IS CLASSIFIED. Opted out means the file's LEADING directive is one
 * of the compiler's OPT_OUT_DIRECTIVES ('use no memo' or the older 'use no
 * forget'). Searching for that text anywhere would also match an indented
 * directive inside one function body and write off its siblings, so the check
 * skips leading comments and whitespace and then requires the directive first.
 *
 * SLOTS. The compiler emits a memo cache at the top of a compiled component,
 * `const $ = _c(n)`, and a slot is one cell of it. Cells hold cached results and
 * the inputs those results are compared against:
 *
 *   const $ = _c(3);
 *   let t1;
 *   if ($[0] !== full || $[1] !== onPick) {   // two cells hold the inputs
 *     t1 = <button onClick={onPick}>{full}</button>;
 *     $[0] = full; $[1] = onPick; $[2] = t1;  // one cell holds the result
 *   } else {
 *     t1 = $[2];                              // unchanged, so reuse it
 *   }
 *
 * The total is a rough measure of how much memoization was emitted, and NOT a
 * count of anything in the source. The compiler decides what is worth caching
 * (a cheap string concatenation is recomputed, not cached), and caches nest — a
 * fragment is itself cached with its already-cached children as inputs. So the
 * number cannot be divided back into values or dependencies.
 *
 * What matters here is only whether a cache was emitted at all. No `_c(` in the
 * output means nothing was memoized.
 *
 * One more check backs up the rule above. The compiler reports a slot count
 * even for a file it emits nothing for, so a count with no `_c(` in the output
 * means the work was planned and then discarded. A file in that state with no
 * directive to explain it does not fit any of the three lists, so the script
 * fails rather than guess where to put it.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Which directories the compiler applies to. Shared with babel.config.js,
// rsbuild.config.ts and eslint.config.mjs, so this gate scans exactly what the
// build compiles.
import compilerScope from '../react-compiler.scope.cjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const budgetPath = path.join(repoRoot, '.react-compiler-budget.json');
const budget = JSON.parse(readFileSync(budgetPath, 'utf8'));

const require = createRequire(path.join(repoRoot, 'package.json'));
let babel;
let plugin;
try {
  babel = require('@babel/core');
  plugin = require.resolve('babel-plugin-react-compiler');
} catch {
  console.error('@babel/core or babel-plugin-react-compiler not found.');
  console.error('Run "pnpm install" first.');
  process.exit(2);
}

// Application code only: no tests, mocks or generated output. Which directories
// count is decided in react-compiler.scope.cjs, not here.
const SOURCE = /\.(js|jsx|ts|tsx)$/;
const NOT_SOURCE = /\.test\.|\/__tests__\/|\/__mocks__\//;

/**
 * The file's leading directive, if it opts out, else null. Both spellings are
 * accepted because the compiler accepts both.
 */
function fileOptOutDirective(source) {
  const body = source.replace(/^﻿/, '').replace(/^(?:\s|\/\/[^\n]*\n?|\/\*[\s\S]*?\*\/)*/, '');
  const match = /^["'](use no (?:memo|forget))["']\s*;/.exec(body);
  return match ? match[1] : null;
}

/** The opt-out directive written on a given line, for reporting. */
function directiveAt(absPath, line) {
  if (!line) {
    return null;
  }
  const text = readFileSync(absPath, 'utf8').split(/\r?\n/)[line - 1] ?? '';
  const match = /["'](use no (?:memo|forget))["']/.exec(text);
  return match ? `'${match[1]}'` : null;
}

// --others adds untracked files so a component that has not been staged yet is
// still scanned; --exclude-standard keeps .gitignore'd output (dist/,
// node_modules/) out. In CI everything is committed and this is a no-op.
const listed = spawnSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', ...compilerScope.gitPathspecs],
  {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }
);

if (listed.status !== 0) {
  console.error('git ls-files failed');
  console.error(listed.stderr || listed.error?.message || '');
  process.exit(2);
}

const listedFiles = listed.stdout
  .split(/\r?\n/)
  .filter(Boolean)
  .filter(file => SOURCE.test(file) && !NOT_SOURCE.test(file));

// The compiler never runs on a scope-excluded file, so it reports nothing - the
// same as a utility file with no components. Without this split, a React
// component in an excluded directory would pass through unclassified and the
// exclusion would leave no trace in the output. Set those files aside and name
// them instead.
const excludedByScope = listedFiles.filter(file => !compilerScope.isCompiled(file));
const files = listedFiles.filter(file => compilerScope.isCompiled(file));

if (files.length === 0) {
  console.error('no source files matched; check the globs in this script');
  process.exit(2);
}

/** @type {Record<string, number>} */
const refusals = {};
/** @type {string[]} */
const fileOptOuts = [];
/** @type {Record<string, number>} */
const functionOptOuts = {};
const functionOptOutDetail = [];
const refusalDetail = [];
const optOutRefusals = [];
const unexplained = [];
const threw = [];

// Everything below reads `memoSlots` off the compiler's events. If that field is
// ever renamed it would read as 0 everywhere, and the check for files that were
// analyzed but never memoized would quietly stop firing rather than break.
// Nothing else would look wrong, so this records whether it was ever populated.
let sawSlotCount = false;

/**
 * Where a refusal actually is. The compiler attributes a refusal to a whole
 * function, but usually also carries the offending expression's location, which
 * can be many lines further down. Prefer the precise one; fall back to the
 * function, which is always present.
 */
function refusalLocation(event, options) {
  return (
    options.details?.[0]?.loc?.start?.line ??
    options.loc?.start?.line ??
    event.fnLoc?.start?.line ??
    '?'
  );
}

/** One refused function, as two lines: where it is, then why. */
function describe(rel, line, { category, reason, alsoAt }) {
  const extra = alsoAt?.size
    ? `  (also at line${alsoAt.size === 1 ? '' : 's'} ${[...alsoAt].sort((a, b) => a - b).join(', ')})`
    : '';
  return `  ${rel}:${line}\n      ${category}: ${reason}${extra}`;
}

for (const rel of files) {
  const abs = path.join(repoRoot, rel);
  if (!existsSync(abs)) {
    continue;
  }

  const optedOut = fileOptOutDirective(readFileSync(abs, 'utf8'));

  const events = [];
  let code = '';
  try {
    code = babel.transformFileSync(abs, {
      rootMode: 'upward',
      filename: abs,
      plugins: [[plugin, { logger: { logEvent: (_file, event) => events.push(event) } }]],
    }).code;
  } catch (error) {
    threw.push(`${rel}  ${String(error.message).split('\n')[0].slice(0, 160)}`);
    continue;
  }

  let claimedSlots = 0;
  // Deduplicated by source line: the compiler emits several diagnostics for one
  // function, and the unit being recorded is the function. The first diagnostic
  // for a function is the one kept, which is also the only one the compiler
  // acts on — clearing it routinely exposes a different category underneath.
  const refusedLines = new Map();

  for (const event of events) {
    if (event.kind === 'CompileError') {
      // Keyed on the function, which is the unit being counted; the locations
      // reported are the offending expressions, which is what a reader needs.
      //
      // A function can produce several diagnostics. Measured across the whole
      // tree, they are always the SAME category — no function anywhere reports
      // two — so only the extra locations are worth keeping.
      //
      // The category a refusal reports is a lower bound: a function often turns
      // out to have a second, different problem, but only once the first is
      // fixed. That one is not in this event list, so there is nothing more to
      // print for it here.
      const fnLine = event.fnLoc?.start?.line ?? -1;
      const options = event.detail?.options ?? {};
      const at = refusalLocation(event, options);
      if (!refusedLines.has(fnLine)) {
        refusedLines.set(fnLine, {
          category: options.category ?? 'Unknown',
          reason: String(options.reason ?? 'no reason given'),
          at,
          alsoAt: new Set(),
        });
      } else {
        const existing = refusedLines.get(fnLine);
        if (at !== existing.at) {
          existing.alsoAt.add(at);
        }
      }
    } else if (event.kind === 'CompileSuccess') {
      claimedSlots += event.memoSlots ?? 0;
      if (event.memoSlots > 0) {
        sawSlotCount = true;
      }
    } else if (event.kind === 'CompileSkip') {
      functionOptOuts[rel] = (functionOptOuts[rel] ?? 0) + 1;
      // Which spelling was used, read from the source. The compiler's own
      // reason string cannot say: it interpolates the directive node rather
      // than its value, and reads "Skipped due to '[object Object]'".
      functionOptOutDetail.push(
        `${rel}:${event.loc?.start?.line ?? event.fnLoc?.start?.line ?? '?'}  ` +
          `${directiveAt(abs, event.loc?.start?.line) ?? 'opt-out directive'}`
      );
    }
  }

  const emittedSlots = (code.match(/_c\((\d+)\)/g) ?? []).reduce(
    (total, match) => total + Number(match.slice(3, -1)),
    0
  );

  if (optedOut) {
    fileOptOuts.push(rel);
    // Refusals inside an opted-out file are not recorded against the budget:
    // nothing in the file is being memoized anyway. Listed at the end of the
    // output, because they would all appear at once if the directive was
    // removed.
    for (const detail of refusedLines.values()) {
      optOutRefusals.push(describe(rel, detail.at, detail));
    }
    continue;
  }

  // Cross-check: the compiler planned work and emitted none, with no directive
  // to explain it. Not a state this script understands, so say so rather than
  // quietly classify it.
  if (claimedSlots > 0 && emittedSlots === 0) {
    unexplained.push(`${rel}  (${claimedSlots} slots intended, none emitted)`);
  }

  if (refusedLines.size > 0) {
    refusals[rel] = refusedLines.size;
    for (const detail of refusedLines.values()) {
      refusalDetail.push(describe(rel, detail.at, detail));
    }
  }
}

fileOptOuts.sort();

/**
 * Compares a `file -> count` map against the budget and returns the three ways
 * it can differ, each already formatted for printing.
 */
function diffCounts(actual, expected) {
  const added = [];
  const removed = [];
  const changed = [];
  for (const [file, count] of Object.entries(actual)) {
    if (!(file in expected)) {
      added.push(`${file}  (${count})`);
    } else if (expected[file] !== count) {
      changed.push(`${file}  ${expected[file]} -> ${count}`);
    }
  }
  for (const file of Object.keys(expected)) {
    if (!(file in actual)) {
      removed.push(file);
    }
  }
  return { added: added.sort(), removed: removed.sort(), changed: changed.sort() };
}

function diffList(actual, expected) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  return {
    added: actual.filter(file => !expectedSet.has(file)).sort(),
    removed: expected.filter(file => !actualSet.has(file)).sort(),
    changed: [],
  };
}

const refusalDiff = diffCounts(refusals, budget.refusals ?? {});
const fileOptOutDiff = diffList(fileOptOuts, budget.fileOptOuts ?? []);
const functionOptOutDiff = diffCounts(functionOptOuts, budget.functionOptOuts ?? {});

const totalRefused = Object.values(refusals).reduce((sum, n) => sum + n, 0);
const totalFunctionOptOuts = Object.values(functionOptOuts).reduce((sum, n) => sum + n, 0);

console.log(`react-compiler coverage: ${files.length} source files`);
console.log(`  refusals:  ${totalRefused} function(s) in ${Object.keys(refusals).length} file(s)`);
console.log(`  file opt-outs:     ${fileOptOuts.length}`);
console.log(`  function opt-outs: ${totalFunctionOptOuts}`);
if (excludedByScope.length > 0) {
  // Name the directories, not the files: the exclusion is a directory-level
  // decision in react-compiler.scope.cjs and that is what a reader will look for.
  const dirs = [
    ...new Set(
      excludedByScope.map(
        file =>
          compilerScope.excluded.find(dir => file === dir || file.startsWith(`${dir}/`)) ?? file
      )
    ),
  ].sort();
  console.log(
    `  excluded by react-compiler.scope.cjs: ${excludedByScope.length} file(s) under ${dirs.join(', ')}`
  );
}

if (refusalDetail.length > 0) {
  console.log('\nRefusals:');
  for (const entry of refusalDetail) {
    console.log(entry);
  }
}

if (functionOptOutDetail.length > 0) {
  console.log('\nFunction opt-outs:');
  for (const entry of functionOptOutDetail) {
    console.log(`  ${entry}`);
  }
}

// Last, because these are not part of the budget and are the least urgent
// thing on the page: the file already opts out, so nothing is regressing.
if (optOutRefusals.length > 0) {
  console.log('\nRefusals inside opt-out files. Not reported with the budgeted refusals');
  console.log('above, because nothing in these files is being memoized anyway — but');
  console.log('removing the directive would not be enough to make them compile:');
  for (const entry of optOutRefusals) {
    console.log(entry);
  }
}

let failed = false;

function report(label, diff, ...advice) {
  if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
    return;
  }
  failed = true;
  console.error(`\n${label}:`);
  for (const entry of diff.added) {
    console.error(`  + ${entry}`);
  }
  for (const entry of diff.changed) {
    console.error(`  ~ ${entry}`);
  }
  for (const entry of diff.removed) {
    console.error(`  - ${entry}   (no longer applies)`);
  }
  if (diff.added.length > 0 || diff.changed.length > 0) {
    for (const line of advice) {
      console.error(`  ${line}`);
    }
  }
}

if (!sawSlotCount) {
  console.error('\nNo file reported a slot count, across every source file in the repo.');
  console.error('That should be impossible while anything is being memoized, so the');
  console.error('compiler has most likely renamed or dropped the `memoSlots` event field.');
  console.error('Until this is fixed, a file that is silently not being memoized would go');
  console.error('unnoticed.');
  failed = true;
}

if (threw.length > 0) {
  console.error(`\n${threw.length} file(s) failed to compile at all. These are never budgeted:`);
  for (const entry of threw) {
    console.error(`  ${entry}`);
  }
  failed = true;
}

if (unexplained.length > 0) {
  console.error('\nThe compiler reported memoizing these files, but their compiled output');
  console.error("contains no memo cache, and no leading 'use no memo' directive explains it.");
  console.error('');
  console.error('A slot is one cell of the cache the compiler emits at the top of a compiled');
  console.error('component, `const $ = _c(n)`. Cells hold cached results and the inputs those');
  console.error('results are compared against, so the count is a rough measure of how much');
  console.error('memoization was intended — not a count of anything in your source. What');
  console.error('matters here is that a count was reported and no cache reached the output:');
  console.error('the work was planned and then discarded.');
  console.error('');
  console.error('This script does not recognize that state, so it is failing rather than');
  console.error('guessing how to count these files:');
  for (const entry of unexplained) {
    console.error(`  ${entry}`);
  }
  failed = true;
}

report(
  'Refusals do not match the budget',
  refusalDiff,
  'A refusal means the compiler cannot memoize that function. Fix it, or accept it',
  'with the budget printed at the end of this output.'
);
report(
  'File opt-outs do not match the budget',
  fileOptOutDiff,
  'Opting a file out removes it from coverage entirely. Prefer fixing the cause; to',
  'accept it, use the budget printed at the end of this output.'
);
report(
  'Function opt-outs do not match the budget',
  functionOptOutDiff,
  'A directive inside one function body opts that function out on its own. Prefer',
  'fixing the cause; to accept it, use the budget printed at the end of this output.'
);

if (failed) {
  console.error('\nIf every difference above is intended, replace the contents of');
  console.error('.react-compiler-budget.json with this, and say why in the commit message:');
  console.error(JSON.stringify({ refusals, fileOptOuts, functionOptOuts }, null, 2));
  process.exit(1);
}
