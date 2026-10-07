#!/usr/bin/env node
/**
 * Audits only the package versions a pull request adds to pnpm-lock.yaml.
 *
 * Compares the PR's lockfile with the lockfile at the point where the PR
 * branched off its target, and looks up every added name@version in npm's bulk
 * advisory endpoint (the one `pnpm audit` uses). A new high or critical advisory
 * fails the check unless its GHSA is in `auditConfig.ignoreGhsas` of the PR's
 * pnpm-workspace.yaml. Advisories already present on the target branch never
 * fail a PR. Ignores the PR adds to that list are called out for reviewers.
 *
 * Every input is data from the pull request; nothing in it is executed.
 *
 * Usage:
 *   node audit.mjs --base <lockfile> --head <lockfile>
 *     --base-workspace <pnpm-workspace.yaml> --head-workspace <pnpm-workspace.yaml>
 *
 * "base" is the PR's branch point on its target branch, "head" the PR. Any file
 * may be missing; a missing base lockfile (target branch without a pnpm
 * lockfile) makes every package in the head lockfile count as added.
 * The number of ignores the PR adds goes to $GITHUB_OUTPUT as `new_ignores`
 * when set. Writes a Markdown report
 * to $GITHUB_STEP_SUMMARY when set. Exits 1 when the PR adds a blocking
 * advisory, deletes the lockfile, or adds many entries it cannot audit; 2 on
 * errors.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { parseAllDocuments, parse } from 'yaml';

const BULK_ADVISORY_URL = 'https://registry.npmjs.org/-/npm/v1/security/advisories/bulk';
const BLOCKING_SEVERITIES = new Set(['critical', 'high']);
const SEVERITY_ORDER = ['critical', 'high', 'moderate', 'low', 'info'];
// npm package names; anything else in a lockfile key is reported, not queried.
const PACKAGE_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;
const REGISTRY_VERSION = /^\d+\.\d+\.\d+(-[0-9a-z.-]+)?(\+[0-9a-z.-]+)?$/i;
const GHSA_ID = /^GHSA(-[23456789cfghjmpqrvwx]{4}){3}$/;

function readText(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

/**
 * Returns Map<name, Set<version>> of every package in the lockfile. pnpm 12
 * writes two YAML documents (pnpm's own lock for `packageManager`, then the
 * project lock); both are read. Keys of `packages:` are `name@version`.
 */
function lockfilePackages(text) {
  const packages = new Map();
  for (const doc of parseAllDocuments(text)) {
    if (doc.errors.length) {
      throw new Error(`pnpm-lock.yaml does not parse: ${doc.errors[0].message}`);
    }
    for (const key of Object.keys(doc.toJS()?.packages ?? {})) {
      const at = key.lastIndexOf('@');
      if (at <= 0) {
        continue;
      }
      const name = key.slice(0, at);
      if (!packages.has(name)) {
        packages.set(name, new Set());
      }
      packages.get(name).add(key.slice(at + 1));
    }
  }
  return packages;
}

function addedPackages(base, head) {
  const added = [];
  for (const [name, versions] of head) {
    for (const version of versions) {
      if (!base.get(name)?.has(version)) {
        added.push({ name, version });
      }
    }
  }
  return added.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
}

async function postWithRetry(body) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(BULK_ADVISORY_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        return await response.json();
      }
      lastError = new Error(`advisory endpoint returned ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, attempt * 2000));
  }
  throw lastError;
}

/**
 * The endpoint returns the advisories affecting any of the versions sent for a
 * package. Sending one version per package per request keeps each advisory tied
 * to the exact version it affects, without semver range matching here.
 */
async function lookUpAdvisories(packages) {
  const remaining = [...packages];
  const findings = [];
  while (remaining.length) {
    const round = new Map();
    for (let i = 0; i < remaining.length; ) {
      if (round.has(remaining[i].name)) {
        i++;
      } else {
        round.set(remaining[i].name, remaining.splice(i, 1)[0]);
      }
    }
    const body = Object.fromEntries([...round].map(([name, pkg]) => [name, [pkg.version]]));
    const result = await postWithRetry(body);
    for (const [name, advisories] of Object.entries(result)) {
      const pkg = round.get(name);
      for (const advisory of advisories ?? []) {
        findings.push({
          ...pkg,
          ghsa:
            advisory.url?.match(/GHSA(-[23456789cfghjmpqrvwx]{4}){3}/)?.[0] ?? `npm-${advisory.id}`,
          severity: advisory.severity,
          title: advisory.title,
          url: advisory.url,
        });
      }
    }
  }
  return findings.sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
      a.name.localeCompare(b.name) ||
      a.version.localeCompare(b.version)
  );
}

// Workflow-command escaping, so outside text cannot start another command.
function escapeCommand(text) {
  return String(text).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

function table(findings) {
  const rows = findings.map(
    f =>
      `| ${f.severity} | \`${f.name}@${f.version}\` | [${f.ghsa}](${f.url}) | ${f.title.replace(/\|/g, '\\|')} |`
  );
  return ['| Severity | Package | Advisory | Title |', '|---|---|---|---|', ...rows].join('\n');
}

/** `auditConfig.ignoreGhsas` of a pnpm-workspace.yaml; [] when the file is missing. */
function readIgnoreGhsas(file) {
  const text = readText(file);
  const list = text ? parse(text)?.auditConfig?.ignoreGhsas : null;
  return Array.isArray(list) ? list.map(String) : [];
}

/**
 * Whether an ignore entry can match an advisory: a GHSA ID, or the
 * `npm-<id>` name lookUpAdvisories gives an advisory without one.
 */
function isIgnoreId(entry) {
  return GHSA_ID.test(entry) || /^npm-\d+$/.test(entry);
}

/** An ignore entry safe to show: anything else is PR text, cut to [A-Za-z0-9-]. */
function ignoreLabel(entry) {
  return isIgnoreId(entry) ? entry : entry.replace(/[^A-Za-z0-9-]/g, '') || '(empty)';
}

/** Ignores the PR adds, with what each one silences in this PR. */
function newIgnoresSection(newIgnores, findings) {
  const lines = [
    `### ⚠️ This PR adds ${newIgnores.length} ignore(s) to \`auditConfig.ignoreGhsas\``,
    '',
    'Reviewers: check the reason given for each one in `pnpm-workspace.yaml`.',
    '',
  ];
  for (const ghsa of newIgnores) {
    if (!isIgnoreId(ghsa)) {
      lines.push(
        `- invalid entry \`${ignoreLabel(ghsa)}\`: not a GHSA ID or \`npm-<number>\`, so it matches no advisory`
      );
      continue;
    }
    const id = GHSA_ID.test(ghsa)
      ? `[${ghsa}](https://github.com/advisories/${ghsa})`
      : `\`${ghsa}\``;
    const silenced = [
      ...new Set(findings.filter(f => f.ghsa === ghsa).map(f => `\`${f.name}@${f.version}\``)),
    ];
    lines.push(
      silenced.length
        ? `- ${id}: silences ${silenced.join(', ')}, added by this PR`
        : `- ${id}: matches nothing this PR adds (it may cover an advisory already on the target branch)`
    );
  }
  lines.push('');
  return lines;
}

function lockfileSection({ added, notAudited, blocking, allowed, other, baseMissing, partial }) {
  const lines = [];
  if (baseMissing) {
    lines.push(
      'The target branch has no `pnpm-lock.yaml`, so every package in the PR lockfile counts as added.',
      ''
    );
  }
  lines.push(`This PR adds ${added} package version(s) to \`pnpm-lock.yaml\`.`, '');
  if (blocking.length) {
    lines.push(
      `### ❌ ${blocking.length} new high or critical advisory(ies)`,
      '',
      table(blocking),
      '',
      'To fix: pick versions that are not affected (an `overrides` entry in `pnpm-workspace.yaml` if the package is transitive; `pnpm why <package>` shows what brings it in). ' +
        'If the advisory does not apply to how OHIF uses the package, add its GHSA to `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml` with a comment saying why, for review.',
      ''
    );
  } else {
    lines.push(
      partial
        ? 'No high or critical advisories among the entries that could be audited.'
        : '### ✅ No new high or critical advisories',
      ''
    );
  }
  if (allowed.length) {
    lines.push(
      `### Allowed by \`auditConfig.ignoreGhsas\` (${allowed.length})`,
      '',
      table(allowed),
      ''
    );
  }
  if (other.length) {
    lines.push(
      `<details><summary>${other.length} new moderate or low advisory(ies), not blocking</summary>`,
      '',
      table(other),
      '',
      '</details>',
      ''
    );
  }
  if (notAudited.length) {
    lines.push(
      `<details><summary>${notAudited.length} added entry(ies) not from the npm registry, not audited</summary>`,
      '',
      // Unvalidated lockfile keys: drop control characters (one entry, one
      // line) and backticks (it stays inside the code span).
      ...notAudited.map(p => `- \`${`${p.name}@${p.version}`.replace(/[\x00-\x1f\x7f`]/g, '')}\``),
      '',
      '</details>',
      ''
    );
  }
  return lines;
}

async function main() {
  const { values } = parseArgs({
    options: Object.fromEntries(
      ['base', 'head', 'base-workspace', 'head-workspace'].map(name => [name, { type: 'string' }])
    ),
  });
  if (!values.base || !values.head || !values['base-workspace'] || !values['head-workspace']) {
    throw new Error(
      'usage: audit.mjs --base <lockfile> --head <lockfile> ' +
        '--base-workspace <pnpm-workspace.yaml> --head-workspace <pnpm-workspace.yaml>'
    );
  }

  const ignoreGhsas = new Set(readIgnoreGhsas(values['head-workspace']));
  const baseIgnoreGhsas = new Set(readIgnoreGhsas(values['base-workspace']));
  const newIgnores = [...ignoreGhsas].filter(ghsa => !baseIgnoreGhsas.has(ghsa));

  const lines = ['## Dependency audit', ''];
  let findings = [];
  let blocking = [];
  // Set when the check cannot do its job; it then fails rather than pass.
  let cannotAudit = null;
  const headText = readText(values.head);
  const baseText = readText(values.base);
  if (headText === null && baseText !== null) {
    cannotAudit = 'This PR deletes pnpm-lock.yaml, so its dependencies cannot be audited.';
    lines.push(`### ❌ ${cannotAudit}`, '');
  } else if (headText === null) {
    lines.push(
      'Neither the PR nor its target branch has a `pnpm-lock.yaml`; nothing to audit.',
      ''
    );
  } else if (baseText === headText) {
    lines.push('`pnpm-lock.yaml` is unchanged; nothing to audit.', '');
  } else {
    const added = addedPackages(lockfilePackages(baseText ?? ''), lockfilePackages(headText));
    const auditable = added.filter(
      p => PACKAGE_NAME.test(p.name) && REGISTRY_VERSION.test(p.version)
    );
    const notAudited = added.filter(p => !auditable.includes(p));
    // A few git or tarball entries are normal. Many means the lockfile format
    // probably changed and nothing is being audited, so fail instead.
    if (notAudited.length > 5 && notAudited.length > added.length * 0.1) {
      cannotAudit =
        `${notAudited.length} of the ${added.length} entries this PR adds are not ` +
        'name@version from the npm registry. The pnpm-lock.yaml format may have changed; ' +
        'update .scripts/dependency-audit/audit.mjs.';
      lines.push(`### ❌ ${cannotAudit}`, '');
    }
    findings = await lookUpAdvisories(auditable);
    const serious = findings.filter(f => BLOCKING_SEVERITIES.has(f.severity));
    blocking = serious.filter(f => !ignoreGhsas.has(f.ghsa));
    lines.push(
      ...lockfileSection({
        added: added.length,
        notAudited,
        blocking,
        allowed: serious.filter(f => ignoreGhsas.has(f.ghsa)),
        other: findings.filter(f => !BLOCKING_SEVERITIES.has(f.severity)),
        baseMissing: baseText === null,
        partial: cannotAudit !== null,
      })
    );
  }
  // New ignores go right under the heading, ahead of the lockfile results. The
  // workflow also flags them in the PR's checks list, from `new_ignores`.
  if (newIgnores.length) {
    lines.splice(2, 0, ...newIgnoresSection(newIgnores, findings));
  }
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_ignores=${newIgnores.length}\n`);
  }

  const markdown = lines.join('\n');
  // The report holds text from the PR. Pause workflow commands while it is
  // printed, so no line of it can act as one (e.g. hide the annotations
  // below). The token is random, so the PR cannot resume them early.
  const resumeToken = crypto.randomUUID();
  console.log(`::stop-commands::${resumeToken}`);
  console.log(markdown);
  console.log(`::${resumeToken}::`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  }
  for (const ghsa of newIgnores) {
    console.log(
      `::warning title=New audit ignore::${escapeCommand(`${ignoreLabel(ghsa)} added to auditConfig.ignoreGhsas`)}`
    );
  }
  for (const f of blocking) {
    // `:` and `,` end a title property in workflow commands.
    const title = escapeCommand(`${f.severity} advisory in ${f.name}@${f.version}`);
    console.log(
      `::error title=${title.replace(/[:,]/g, ' ')}::${escapeCommand(`${f.ghsa} ${f.title}`)}`
    );
  }
  if (cannotAudit) {
    console.log(`::error title=Dependency audit not possible::${escapeCommand(cannotAudit)}`);
  }
  return blocking.length || cannotAudit ? 1 : 0;
}

main().then(
  code => process.exit(code),
  error => {
    console.error(`::error title=Dependency audit failed::${escapeCommand(error.message)}`);
    process.exit(2);
  }
);
