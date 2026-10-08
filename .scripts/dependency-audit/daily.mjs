#!/usr/bin/env node
/**
 * Daily dependency check of a branch (master on the schedule), run by
 * .github/workflows/dependency-check-daily.yml after dist-packages.mjs.
 *
 * Audits every package version in pnpm-lock.yaml with npm's bulk advisory
 * endpoint (like the PR check), then groups the critical and high advisories:
 *
 * - Review immediately: critical or high, in a package that is in the viewer
 *   build (dist-packages.json from dist-packages.mjs);
 * - Review promptly: critical, in a package that is not;
 * - Review soon: high, in a package that is not;
 * - Ignored, update available: advisories in `auditConfig.ignoreGhsas` whose
 *   package's latest version on npm no longer has that advisory, so the
 *   ignore can be replaced by an upgrade.
 * Moderate and low are left out.
 *
 * The summary ($GITHUB_STEP_SUMMARY) is public: each row shows only the
 * advisory link and the package name, and nothing says why or when. The log
 * shows counts only. Findings never fail the run; if the check can't do its
 * job, it fails (exit 2) and writes no summary.
 *
 * Usage:
 *   node daily.mjs --lockfile <pnpm-lock.yaml> --workspace <pnpm-workspace.yaml>
 *     --dist-packages <dist-packages.json> --label <branch>
 */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import {
  PACKAGE_NAME,
  REGISTRY_VERSION,
  escapeCommand,
  lockfilePackages,
  lookUpAdvisories,
  readIgnoreGhsas,
  readText,
  tableCell,
} from './audit.mjs';

// `<registry>/<name>/latest` is the npm registry's dist-tag lookup. "Update
// available" only means the `latest` version no longer has the advisory; it
// may be a new major version.
const REGISTRY_URL = 'https://registry.npmjs.org/';

/** Whether this name@version is in dist, per dist-packages.json's `packages`. */
export function inDist(distPackages, name, version) {
  const entry = distPackages[name];
  return Boolean(entry && (entry.anyVersion || entry.versions.includes(version)));
}

/**
 * Groups findings (from lookUpAdvisories) into the summary lists. Each row is
 * { ghsa, url, name }, one per advisory and package.
 */
export function groupFindings(findings, distPackages, ignoreGhsas) {
  const groups = {
    immediately: new Map(),
    promptly: new Map(),
    soon: new Map(),
    ignored: new Map(),
  };
  for (const f of findings) {
    if (f.severity !== 'critical' && f.severity !== 'high') {
      continue;
    }
    let group;
    if (ignoreGhsas.has(f.ghsa)) {
      group = 'ignored';
    } else if (inDist(distPackages, f.name, f.version)) {
      group = 'immediately';
    } else {
      group = f.severity === 'critical' ? 'promptly' : 'soon';
    }
    groups[group].set(`${f.ghsa} ${f.name}`, { ghsa: f.ghsa, url: f.url, name: f.name });
  }
  const sorted = map =>
    [...map.values()].sort((a, b) => a.name.localeCompare(b.name) || a.ghsa.localeCompare(b.ghsa));
  return Object.fromEntries(Object.entries(groups).map(([key, map]) => [key, sorted(map)]));
}

function rowsTable(rows) {
  return [
    '| Advisory | Package |',
    '|---|---|',
    ...rows.map(r => `| [${tableCell(r.ghsa)}](${r.url}) | ${tableCell(r.name)} |`),
  ];
}

/** The public run summary: advisory and package per row, nothing more. */
export function renderSummary({ label, date, immediately, promptly, soon, updates }) {
  const section = (title, rows) => [
    `### ${title} (${rows.length})`,
    '',
    ...(rows.length ? rowsTable(rows) : ['None.']),
    '',
  ];
  return [
    `## Dependency check of ${tableCell(label)} – ${date}`,
    '',
    ...section('Review immediately', immediately),
    ...section('Review promptly', promptly),
    ...section('Review soon', soon),
    ...section('Ignored, update available', updates),
  ].join('\n');
}

/** The `latest` version of a package on the npm registry. */
async function latestVersion(name) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`${REGISTRY_URL}${name.replace('/', '%2F')}/latest`);
      if (response.ok) {
        return (await response.json()).version;
      }
      lastError = new Error(`npm registry returned ${response.status} for ${name}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, attempt * 2000));
  }
  throw lastError;
}

/**
 * The ignored rows whose package has an update: the package's latest version
 * no longer has that advisory. (GitHub's advisory data often leaves the fixed
 * version empty, so ask npm's advisory endpoint about the latest version.)
 */
async function rowsWithUpdate(rows) {
  const latest = new Map();
  for (const name of new Set(rows.map(r => r.name))) {
    latest.set(name, await latestVersion(name));
  }
  const stillAffected = await lookUpAdvisories(
    [...latest].map(([name, version]) => ({ name, version }))
  );
  return rows.filter(r => !stillAffected.some(f => f.name === r.name && f.ghsa === r.ghsa));
}

async function main() {
  const { values } = parseArgs({
    options: Object.fromEntries(
      ['lockfile', 'workspace', 'dist-packages', 'label'].map(n => [n, { type: 'string' }])
    ),
  });
  if (!values.lockfile || !values.workspace || !values['dist-packages'] || !values.label) {
    throw new Error(
      'usage: daily.mjs --lockfile <pnpm-lock.yaml> --workspace <pnpm-workspace.yaml> ' +
        '--dist-packages <dist-packages.json> --label <branch>'
    );
  }
  const lockText = readText(values.lockfile);
  if (lockText === null) {
    throw new Error('The branch has no pnpm-lock.yaml.');
  }
  const all = [...lockfilePackages(lockText)].flatMap(([name, versions]) =>
    [...versions].map(version => ({ name, version }))
  );
  const auditable = all.filter(p => PACKAGE_NAME.test(p.name) && REGISTRY_VERSION.test(p.version));
  const notAudited = all.length - auditable.length;
  if (notAudited > 5 && notAudited > all.length * 0.1) {
    throw new Error(
      `${notAudited} of ${all.length} lockfile entries are not name@version from the npm ` +
        'registry; the pnpm-lock.yaml format may have changed.'
    );
  }
  const distPackages = JSON.parse(fs.readFileSync(values['dist-packages'], 'utf8')).packages;
  const findings = await lookUpAdvisories(auditable);
  const groups = groupFindings(findings, distPackages, new Set(readIgnoreGhsas(values.workspace)));
  const updates = groups.ignored.length ? await rowsWithUpdate(groups.ignored) : [];

  const summary = renderSummary({
    label: values.label,
    date: new Date().toUTCString().slice(0, 16),
    immediately: groups.immediately,
    promptly: groups.promptly,
    soon: groups.soon,
    updates,
  });
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  }
  // Counts only in the log; the lists are in the run summary.
  console.log(
    `Audited ${auditable.length} package version(s): ${groups.immediately.length} to review ` +
      `immediately, ${groups.promptly.length} to review promptly, ${groups.soon.length} to ` +
      `review soon, ${updates.length} ignored with an update available. ` +
      'Details: the run summary.'
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(`::error title=Dependency check failed::${escapeCommand(error.message)}`);
    process.exit(2);
  });
}
