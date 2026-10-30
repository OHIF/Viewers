#!/usr/bin/env node
/*
 * Fail-fast validator for the OHIF extension gallery data file.
 *
 * Dependency-free by design (no ajv): the docs build runs this before
 * docusaurus so a malformed gallery entry breaks the build instead of
 * shipping. The checks below mirror
 * platform/docs/static/schemas/extension-gallery.schema.json.
 *
 * Exit 0 when every entry is valid; exit 1 printing the offending entry
 * index and field on the first failure encountered.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(here, '..', 'src', 'data', 'extension-gallery.json');

// Keep in sync with platform/core/src/extensions/MODULE_TYPES.js
const MODULE_TYPES = [
  'commandsModule',
  'customizationModule',
  'stateSyncModule',
  'dataSourcesModule',
  'panelModule',
  'sopClassHandlerModule',
  'toolbarModule',
  'viewportModule',
  'contextModule',
  'layoutTemplateModule',
  'hangingProtocolModule',
  'utilityModule',
];

const TYPES = ['extension', 'mode'];
const NAME_PATTERN = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
const MAX_DESCRIPTION_LENGTH = 200;

function fail(message) {
  console.error(`validate-gallery: ${message}`);
  process.exit(1);
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertUrl(value, entryIndex, field) {
  if (typeof value !== 'string' || value.length === 0) {
    fail(`entry ${entryIndex} field "${field}" must be a non-empty URL string`);
  }
  try {
    // eslint-disable-next-line no-new
    new URL(value);
  } catch {
    fail(`entry ${entryIndex} field "${field}" is not a parseable URL: ${value}`);
  }
}

let raw;
try {
  raw = readFileSync(DATA_PATH, 'utf8');
} catch (error) {
  fail(`could not read ${DATA_PATH}: ${error.message}`);
}

let data;
try {
  data = JSON.parse(raw);
} catch (error) {
  fail(`${DATA_PATH} is not valid JSON: ${error.message}`);
}

if (!isPlainObject(data)) {
  fail('root value must be an object');
}

if (!Array.isArray(data.entries)) {
  fail('root "entries" must be an array');
}

const allowedRootKeys = new Set(['$schema', 'entries']);
for (const key of Object.keys(data)) {
  if (!allowedRootKeys.has(key)) {
    fail(`unexpected root key "${key}"`);
  }
}

const allowedEntryKeys = new Set([
  'name',
  'type',
  'description',
  'maintainer',
  'modules',
  'hostRange',
  'links',
]);
const allowedMaintainerKeys = new Set(['name', 'url']);
const allowedLinkKeys = new Set(['npm', 'repository', 'docs']);

const seenNames = new Set();

data.entries.forEach((entry, i) => {
  if (!isPlainObject(entry)) {
    fail(`entry ${i} must be an object`);
  }

  for (const key of Object.keys(entry)) {
    if (!allowedEntryKeys.has(key)) {
      fail(`entry ${i} has unexpected field "${key}"`);
    }
  }

  for (const required of allowedEntryKeys) {
    if (!(required in entry)) {
      fail(`entry ${i} is missing required field "${required}"`);
    }
  }

  // name
  if (typeof entry.name !== 'string' || !NAME_PATTERN.test(entry.name)) {
    fail(`entry ${i} field "name" is not a valid npm package name: ${JSON.stringify(entry.name)}`);
  }
  if (seenNames.has(entry.name)) {
    fail(`entry ${i} field "name" is a duplicate: ${entry.name}`);
  }
  seenNames.add(entry.name);

  // type
  if (!TYPES.includes(entry.type)) {
    fail(`entry ${i} field "type" must be one of ${TYPES.join(', ')} (got ${JSON.stringify(entry.type)})`);
  }

  // description
  if (typeof entry.description !== 'string' || entry.description.length === 0) {
    fail(`entry ${i} field "description" must be a non-empty string`);
  }
  if (entry.description.length > MAX_DESCRIPTION_LENGTH) {
    fail(`entry ${i} field "description" exceeds ${MAX_DESCRIPTION_LENGTH} characters`);
  }

  // maintainer
  if (!isPlainObject(entry.maintainer)) {
    fail(`entry ${i} field "maintainer" must be an object`);
  }
  for (const key of Object.keys(entry.maintainer)) {
    if (!allowedMaintainerKeys.has(key)) {
      fail(`entry ${i} field "maintainer" has unexpected key "${key}"`);
    }
  }
  if (typeof entry.maintainer.name !== 'string' || entry.maintainer.name.length === 0) {
    fail(`entry ${i} field "maintainer.name" must be a non-empty string`);
  }
  if ('url' in entry.maintainer) {
    assertUrl(entry.maintainer.url, i, 'maintainer.url');
  }

  // modules
  if (!Array.isArray(entry.modules)) {
    fail(`entry ${i} field "modules" must be an array`);
  }
  entry.modules.forEach(mod => {
    if (!MODULE_TYPES.includes(mod)) {
      fail(`entry ${i} field "modules" contains an unknown module type: ${JSON.stringify(mod)}`);
    }
  });

  // hostRange
  if (typeof entry.hostRange !== 'string' || entry.hostRange.length === 0) {
    fail(`entry ${i} field "hostRange" must be a non-empty string`);
  }

  // links
  if (!isPlainObject(entry.links)) {
    fail(`entry ${i} field "links" must be an object`);
  }
  for (const key of Object.keys(entry.links)) {
    if (!allowedLinkKeys.has(key)) {
      fail(`entry ${i} field "links" has unexpected key "${key}"`);
    }
  }
  assertUrl(entry.links.npm, i, 'links.npm');
  assertUrl(entry.links.repository, i, 'links.repository');
  if ('docs' in entry.links) {
    assertUrl(entry.links.docs, i, 'links.docs');
  }
});

console.log(`validate-gallery: OK (${data.entries.length} entr${data.entries.length === 1 ? 'y' : 'ies'})`);
process.exit(0);
