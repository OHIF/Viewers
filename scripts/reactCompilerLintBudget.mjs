/**
 * React Compiler lint ratchet.
 *
 * Runs the compiler-health ESLint config and applies two gates, deliberately
 * different in kind:
 *
 *   1. React 19 guardrails (the `no-restricted-*` block in eslint.config.mjs)
 *      are ZERO tolerance. The workspace has no legacy violations of these, so
 *      any hit is new code and fails immediately, naming the file. Folding them
 *      into the budget would let a new `forwardRef` hide inside unrelated
 *      headroom, or net out against an unrelated fix in the same PR.
 *
 *   2. Compiler debt (react-hooks diagnostics) is budgeted. The count may only
 *      go down: when a change reduces it, tighten
 *      .react-compiler-lint-budget.json in the same PR so the win is locked in.
 *
 * Diagnostics of the form "Definition for rule X was not found" are ignored.
 * They come from eslint-disable comments aimed at the main .eslintrc config,
 * whose plugins this minimal config deliberately does not load, and they say
 * nothing about compiler health. Counting them made an unrelated master merge
 * fail the ratchet.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const budgetPath = path.join(repoRoot, '.react-compiler-lint-budget.json');
const budget = JSON.parse(readFileSync(budgetPath, 'utf8'));

// The guardrail block in eslint.config.mjs. Keep in sync with it.
const GUARDRAIL_RULES = new Set([
  'no-restricted-imports',
  'no-restricted-properties',
  'no-restricted-syntax',
]);

const UNKNOWN_RULE = /^Definition for rule '(.+)' was not found/;

const eslintArgs = ['--config', 'eslint.config.mjs', '--no-config-lookup', '--format', 'json', '.'];
const eslintBin = path.join(repoRoot, 'node_modules', 'eslint', 'bin', 'eslint.js');

if (!existsSync(eslintBin)) {
  console.error(`eslint not found at ${eslintBin}`);
  console.error('Run "pnpm install" first.');
  process.exit(2);
}

// Run the workspace binary directly: no PATH lookup, no network, and identical
// behavior locally and in CI.
const result = spawnSync(process.execPath, [eslintBin, ...eslintArgs], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

if (!result.stdout) {
  console.error('eslint produced no output');
  console.error(result.stderr || result.error?.message || '');
  process.exit(2);
}

const reports = JSON.parse(result.stdout);

let errors = 0;
let warnings = 0;
const ignoredByRule = new Map();
const guardrailHits = [];

for (const report of reports) {
  for (const message of report.messages) {
    const unknownRule = message.message && UNKNOWN_RULE.exec(message.message);
    if (unknownRule) {
      const rule = message.ruleId ?? unknownRule[1];
      ignoredByRule.set(rule, (ignoredByRule.get(rule) ?? 0) + 1);
      continue;
    }

    if (message.ruleId && GUARDRAIL_RULES.has(message.ruleId)) {
      const file = path.relative(repoRoot, report.filePath);
      guardrailHits.push(`${file}:${message.line}:${message.column}  ${message.message}`);
      continue;
    }

    if (message.severity === 2) {
      errors += 1;
    } else {
      warnings += 1;
    }
  }
}

console.log(`react-compiler lint: ${errors} errors, ${warnings} warnings`);
console.log(`budget:              ${budget.errors} errors, ${budget.warnings} warnings`);
const ignoredTotal = [...ignoredByRule.values()].reduce((sum, count) => sum + count, 0);
if (ignoredTotal > 0) {
  console.log(`ignored:             ${ignoredTotal} diagnostics for rules this config does not load`);
  const byFrequency = [...ignoredByRule.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
  for (const [rule, count] of byFrequency) {
    console.log(`  ${String(count).padStart(3)}  ${rule}`);
  }
  console.log('  From eslint-disable comments aimed at the legacy .eslintrc config. Registering');
  console.log('  these plugins here, with their rules off, would resolve the names and clear them.');
}

let failed = false;

if (guardrailHits.length > 0) {
  console.error(`\nReact 19 guardrail violations (${guardrailHits.length}). These are never budgeted:`);
  for (const hit of guardrailHits) {
    console.error(`  ${hit}`);
  }
  failed = true;
}

if (errors > budget.errors || warnings > budget.warnings) {
  console.error('\nBudget exceeded. The react-hooks diagnostic count may only go down.');
  console.error('Run "pnpm run lint:compiler" locally to see the diagnostics.');
  failed = true;
}

if (failed) {
  process.exit(1);
}

if (errors < budget.errors || warnings < budget.warnings) {
  console.log('\nCounts are below budget. Tighten .react-compiler-lint-budget.json');
  console.log(`to { "errors": ${errors}, "warnings": ${warnings} } in this PR.`);
}
