// Keeps the daily check's build in step with OHIF's real production build.
// The workflow's build step copies the settings of platform/app's
// `build:viewer:ci` script (it can't run the script itself: the script fixes
// which rsbuild config file is used). If someone changes that script, this test
// fails on their PR, so the copy is updated instead of drifting silently.
// Run with `npm test` in this folder (node --test); CircleCI UNIT_TESTS runs it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const repo = path => fileURLToPath(new URL(`../../${path}`, import.meta.url));
const scripts = JSON.parse(fs.readFileSync(repo('platform/app/package.json'), 'utf8')).scripts;
const workflow = parse(
  fs.readFileSync(repo('.github/workflows/dependency-check-daily.yml'), 'utf8')
);
const buildStep = workflow.jobs.check.steps.find(
  step => step.name === 'Build the viewer and list the packages in dist'
);

// Settings only the workflow needs: runner memory, and where the wrapper
// config writes the copy list.
const WORKFLOW_ONLY = new Set(['NODE_OPTIONS', 'AUDIT_RECORD']);
const FIX = 'Update the build step in .github/workflows/dependency-check-daily.yml to match.';

/** `KEY=value` pairs given to cross-env in a package.json script. */
const crossEnv = script =>
  Object.fromEntries(
    script
      .split(/\s+/)
      .filter(token => /^[A-Z_][A-Z0-9_]*=/.test(token))
      .map(token => [token.slice(0, token.indexOf('=')), token.slice(token.indexOf('=') + 1)])
  );

/** The rsbuild arguments in a command, without the `--config <file>` pair. */
const rsbuildArgs = command => {
  const tokens = command.slice(command.indexOf('rsbuild ') + 'rsbuild '.length).split(/\s+/);
  const args = [];
  for (let i = 0; i < tokens.length && tokens[i] !== '&&'; i++) {
    if (tokens[i] === '--config') {
      i++; // the file differs on purpose: the workflow uses the wrapper config
    } else if (tokens[i]) {
      args.push(tokens[i]);
    }
  }
  return args;
};

// Nothing else may run around the build: a command that copies files into dist
// after rsbuild (e.g. `&& cp -r node_modules/x dist/x`) would put a package in
// dist that the check can't see.
test('the build:viewer:ci script still builds through the app `build` script only', () => {
  assert.match(
    scripts['build:viewer:ci'],
    /^pnpm run version:update && cross-env [^&|;]*pnpm run build$/,
    `build:viewer:ci changed shape. ${FIX}`
  );
});

test('the app `build` script runs rsbuild only', () => {
  assert.match(
    scripts.build,
    /^cross-env (\S+=\S+ )*rsbuild build [^&|;]*$/,
    `The build script changed shape. ${FIX}`
  );
});

test("the daily check's build step uses the same environment as build:viewer:ci", () => {
  const stepEnv = Object.fromEntries(
    Object.entries(buildStep.env)
      .filter(([key]) => !WORKFLOW_ONLY.has(key))
      .map(([key, value]) => [key, String(value)])
  );
  assert.deepEqual(stepEnv, crossEnv(scripts['build:viewer:ci']), FIX);
});

test("the daily check's build step runs rsbuild like the app `build` script", () => {
  const stepCommand = buildStep.run.split('\n').find(line => line.includes('rsbuild build'));
  assert.deepEqual(rsbuildArgs(stepCommand), rsbuildArgs(scripts.build), FIX);
});
