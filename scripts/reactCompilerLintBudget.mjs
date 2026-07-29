/**
 * React Compiler lint ratchet.
 *
 * Runs the compiler-health ESLint config and fails when the number of
 * problems grows beyond the committed budget. The budget only goes down:
 * when a change reduces the counts, tighten .react-compiler-lint-budget.json
 * in the same PR so the improvement is locked in.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const budgetPath = path.join(repoRoot, '.react-compiler-lint-budget.json');
const budget = JSON.parse(readFileSync(budgetPath, 'utf8'));

const result = spawnSync(
  'npx',
  ['eslint', '--config', 'eslint.config.mjs', '--no-config-lookup', '--format', 'json', '.'],
  { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
);

if (!result.stdout) {
  console.error('eslint produced no output');
  console.error(result.stderr || '');
  process.exit(2);
}

const reports = JSON.parse(result.stdout);
const errors = reports.reduce((sum, r) => sum + r.errorCount, 0);
const warnings = reports.reduce((sum, r) => sum + r.warningCount, 0);

console.log(`react-compiler lint: ${errors} errors, ${warnings} warnings`);
console.log(`budget:              ${budget.errors} errors, ${budget.warnings} warnings`);

if (errors > budget.errors || warnings > budget.warnings) {
  console.error('Budget exceeded. New code must not add react-compiler lint problems.');
  console.error('Run "pnpm run lint:compiler" locally to see the diagnostics.');
  process.exit(1);
}

if (errors < budget.errors || warnings < budget.warnings) {
  console.log('Counts are below budget. Consider tightening .react-compiler-lint-budget.json');
  console.log(`to { "errors": ${errors}, "warnings": ${warnings} } in this PR.`);
}
