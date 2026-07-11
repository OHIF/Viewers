#!/usr/bin/env node
/*
 * Sync-check for the canonical scaffolded-extension AGENTS.md.
 *
 * WS9 owns the canonical AGENTS.md content. It lives in two places that must
 * never drift:
 *   1. platform/create-ohif/templates/extension/AGENTS.md (shipped verbatim by
 *      the scaffolder; the {{name}} token is a template placeholder).
 *   2. The fenced block between the AGENTS_MD markers in
 *      platform/docs/docs/platform/extensions/building-with-agents.md.
 *
 * This script (dependency-free by design, mirroring validate-gallery.mjs)
 * extracts the docs block, strips the code-fence lines, normalizes CRLF to LF,
 * and byte-compares it against the template file. It runs in the docs build so
 * a drift breaks the build instead of shipping stale guidance.
 *
 * Exit 0 when the two are identical. Exit 1 printing a unified-diff-style
 * mismatch. If the template file does not exist yet, print a warning and
 * soft-pass (exit 0) so the docs build is not blocked before the scaffolder
 * template has landed.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolve(
  here,
  '..',
  '..',
  'create-ohif',
  'templates',
  'extension',
  'AGENTS.md'
);
const DOCS_PATH = resolve(
  here,
  '..',
  'docs',
  'platform',
  'extensions',
  'building-with-agents.md'
);

const START_MARKER = '<!-- AGENTS_MD_START -->';
const END_MARKER = '<!-- AGENTS_MD_END -->';

function fail(message) {
  console.error(`check-agents-md-sync: ${message}`);
  process.exit(1);
}

// Normalize CRLF to LF (Windows checkouts) and drop a single trailing newline
// so a trailing-newline-only difference is not treated as drift.
function normalize(text) {
  return text.replace(/\r\n/g, '\n').replace(/\n$/, '');
}

let templateRaw;
try {
  templateRaw = readFileSync(TEMPLATE_PATH, 'utf8');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.warn(
      `check-agents-md-sync: template not found at ${TEMPLATE_PATH} — soft-pass ` +
        '(scaffolder template has not landed yet).'
    );
    process.exit(0);
  }
  fail(`could not read template ${TEMPLATE_PATH}: ${error.message}`);
}

let docsRaw;
try {
  docsRaw = readFileSync(DOCS_PATH, 'utf8');
} catch (error) {
  fail(`could not read docs page ${DOCS_PATH}: ${error.message}`);
}

const docsLf = docsRaw.replace(/\r\n/g, '\n');
const startIndex = docsLf.indexOf(START_MARKER);
const endIndex = docsLf.indexOf(END_MARKER);
if (startIndex === -1 || endIndex === -1) {
  fail(
    `could not find ${START_MARKER} / ${END_MARKER} markers in ${DOCS_PATH}`
  );
}
if (endIndex < startIndex) {
  fail(`${END_MARKER} appears before ${START_MARKER} in ${DOCS_PATH}`);
}

let blockLines = docsLf.slice(startIndex + START_MARKER.length, endIndex).split('\n');

// Trim blank lines surrounding the fenced block.
while (blockLines.length && blockLines[0].trim() === '') {
  blockLines.shift();
}
while (blockLines.length && blockLines[blockLines.length - 1].trim() === '') {
  blockLines.pop();
}

// Strip the opening and closing code-fence lines.
if (blockLines.length && blockLines[0].startsWith('```')) {
  blockLines.shift();
} else {
  fail(`expected an opening code fence after ${START_MARKER} in ${DOCS_PATH}`);
}
if (blockLines.length && blockLines[blockLines.length - 1].startsWith('```')) {
  blockLines.pop();
} else {
  fail(`expected a closing code fence before ${END_MARKER} in ${DOCS_PATH}`);
}

const docsContent = normalize(blockLines.join('\n'));
const templateContent = normalize(templateRaw);

if (docsContent === templateContent) {
  console.log('check-agents-md-sync: OK (template and docs block are in sync)');
  process.exit(0);
}

// Unified-diff-style mismatch report (dependency-free line diff).
const a = templateContent.split('\n');
const b = docsContent.split('\n');
const max = Math.max(a.length, b.length);
const diffLines = [];
diffLines.push(`--- ${TEMPLATE_PATH}`);
diffLines.push(`+++ ${DOCS_PATH} (AGENTS_MD block)`);
for (let i = 0; i < max; i++) {
  if (a[i] === b[i]) {
    continue;
  }
  if (a[i] !== undefined) {
    diffLines.push(`- ${a[i]}`);
  }
  if (b[i] !== undefined) {
    diffLines.push(`+ ${b[i]}`);
  }
}

fail(
  'canonical AGENTS.md and the docs AGENTS_MD block have drifted:\n' +
    diffLines.join('\n')
);
