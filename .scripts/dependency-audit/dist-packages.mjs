#!/usr/bin/env node
/**
 * Lists the npm packages in a built OHIF viewer (platform/app/dist), for the
 * daily dependency check. Two sources:
 *
 * 1. Our build's source maps. Every `.../node_modules/<package>/...` path in
 *    them is code that was bundled in. The version comes from the installed
 *    package; for code a library inlined from another package (read from that
 *    library's own source map, see rsbuild.audit.config.ts) from a
 *    `.pnpm/<name>@<version>/` path when there is one, otherwise "any version".
 *    Maps inside folders copied whole from a package (below) are skipped.
 * 2. Packages the build copies in whole (`output.copy` entries whose source is
 *    inside node_modules/<package>, e.g. onnxruntime-web, dicom-microscopy-viewer).
 *    Their prebuilt files can contain any of their dependencies, so each counts
 *    with its whole dependency tree from pnpm-lock.yaml, at the lockfile's
 *    versions (the same limit as pnpm audit).
 *
 * It fails (exit 2) only when it can't answer: no packages in the maps, no
 * copied package (the copy list moved), or a copied package missing from the
 * lockfile.
 *
 * Usage:
 *   node dist-packages.mjs --record <record.json> --lockfile <pnpm-lock.yaml> --out <dist-packages.json>
 * Output: { "packages": { "<name>": { "versions": [...], "anyVersion": bool } } }
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parseAllDocuments } from 'yaml';

import { PACKAGE_NAME, escapeCommand } from './audit.mjs';

const toPosix = p => p.split(path.sep).join('/');

/**
 * The innermost `node_modules/<name>` in a path: { name, dir }, or null when
 * the path isn't inside a package. `.pnpm` store folders are skipped.
 */
export function packageOfPath(filePath) {
  const parts = toPosix(filePath).split('/');
  for (let i = parts.length - 2; i >= 0; i--) {
    if (parts[i] !== 'node_modules') {
      continue;
    }
    const scoped = parts[i + 1]?.startsWith('@');
    const name = scoped ? `${parts[i + 1]}/${parts[i + 2]}` : parts[i + 1];
    if (!name || name === '.pnpm' || !PACKAGE_NAME.test(name)) {
      continue;
    }
    return { name, dir: parts.slice(0, i + (scoped ? 3 : 2)).join('/') };
  }
  return null;
}

/** `<version>` from a `.pnpm/<name>@<version>` store path, or null. */
export function pnpmStoreVersion(filePath, name) {
  const store = `.pnpm/${name.replace('/', '+')}@`;
  const at = toPosix(filePath).lastIndexOf(store);
  if (at < 0) {
    return null;
  }
  return toPosix(filePath)
    .slice(at + store.length)
    .split('/')[0]
    .split('_')[0];
}

/**
 * A source-map `sources` entry as a file path: drops the `webpack:///` prefix
 * and context-module suffixes (`moment|sync`), resolves relative paths against
 * the build context.
 *
 * Expects the `webpack:///<path>` form that rsbuild.config.ts sets with
 * `devtoolModuleFilenameTemplate` for production. Package names are found from
 * the last `node_modules/<name>` in a path, so other forms mostly still work; if
 * no package is found at all, the run fails.
 */
export function sourcePath(source, context) {
  const withoutScheme = source.replace(/^webpack:\/\/\/?/, '');
  const candidate = withoutScheme.split('|').find(part => part.includes('node_modules/'));
  if (!candidate) {
    return null;
  }
  return path.isAbsolute(candidate) || /^[a-z]:/i.test(candidate)
    ? path.normalize(candidate)
    : path.resolve(context, candidate);
}

/**
 * Each package's dependency tree from a pnpm lockfile (both YAML documents):
 * `roots` are { name, version }; returns [{ name, version }], roots included.
 * Throws when a root isn't in the lockfile.
 */
export function lockfileTree(lockText, roots) {
  const snapshots = Object.assign(
    {},
    ...parseAllDocuments(lockText).map(doc => doc.toJS()?.snapshots ?? {})
  );
  // Snapshot keys are `name@version` plus an optional `(peer...)` suffix.
  const nameOf = key => key.slice(0, key.indexOf('@', 1));
  const versionOf = key => key.slice(key.indexOf('@', 1) + 1).split('(')[0];
  const found = new Map();
  const visit = key => {
    if (found.has(key) || !Object.hasOwn(snapshots, key)) {
      return;
    }
    found.set(key, { name: nameOf(key), version: versionOf(key) });
    const snapshot = snapshots[key] ?? {};
    for (const [dep, ref] of Object.entries({
      ...snapshot.dependencies,
      ...snapshot.optionalDependencies,
    })) {
      if (!String(ref).startsWith('link:')) {
        visit(`${dep}@${ref}`);
      }
    }
  };
  for (const root of roots) {
    const key = Object.keys(snapshots).find(
      k => nameOf(k) === root.name && versionOf(k) === root.version
    );
    if (!key) {
      throw new Error(`Copied package ${root.name}@${root.version} is not in pnpm-lock.yaml.`);
    }
    visit(key);
  }
  return [...found.values()];
}

const realFs = {
  exists: p => fs.existsSync(p),
  readJson: p => JSON.parse(fs.readFileSync(p, 'utf8')),
  listMaps: dir =>
    fs
      .readdirSync(dir, { recursive: true })
      .filter(f => f.endsWith('.map'))
      .map(f => path.join(dir, f)),
};

/**
 * The packages in the build. Returns { packages, fromMaps, copied }: the
 * caller fails when fromMaps (package entries read from our maps) or copied
 * (packages copied in whole) is zero. `fsx` is injectable for tests.
 */
export function distPackages(record, lockText, { fsx = realFs } = {}) {
  const packages = new Map();
  const add = (name, version) => {
    if (!packages.has(name)) {
      packages.set(name, { versions: new Set(), anyVersion: false });
    }
    if (version) {
      packages.get(name).versions.add(version);
    } else {
      packages.get(name).anyVersion = true;
    }
  };
  const installedVersion = dir => {
    const pj = path.join(dir, 'package.json');
    return fsx.exists(pj) ? (fsx.readJson(pj).version ?? null) : null;
  };

  // Packages copied in whole, from the build's copy list.
  const copiedRules = record.copyRules
    .map(rule => ({ ...rule, pkg: packageOfPath(rule.from) }))
    .filter(rule => rule.pkg);
  const copiedDirs = copiedRules.map(rule => `${toPosix(path.resolve(rule.to))}/`);

  // 1. Our build's source maps.
  let fromMaps = 0;
  for (const mapFile of fsx.listMaps(record.distRoot)) {
    if (copiedDirs.some(dir => toPosix(path.resolve(mapFile)).startsWith(dir))) {
      continue; // a copied package's own map: covered by its lockfile tree below
    }
    for (const source of fsx.readJson(mapFile).sources ?? []) {
      const file = sourcePath(source, record.context);
      const pkg = file && packageOfPath(file);
      if (!pkg) {
        continue;
      }
      fromMaps++;
      // Package folder installed: its version (the file itself may be the
      // package's unpublished original source, listed in its own map). Not
      // installed: code a library inlined from another package. Path artifacts
      // that look like names (e.g. `src`) are harmless: the daily check only
      // matches names that are in the lockfile.
      add(
        pkg.name,
        fsx.exists(pkg.dir) ? installedVersion(pkg.dir) : pnpmStoreVersion(file, pkg.name)
      );
    }
  }

  // 2. Copied packages, each with its whole lockfile dependency tree.
  const roots = [
    ...new Map(
      copiedRules.map(rule => [
        rule.pkg.name,
        { name: rule.pkg.name, version: installedVersion(rule.pkg.dir) },
      ])
    ).values(),
  ];
  for (const { name, version } of lockfileTree(lockText, roots)) {
    add(name, version);
  }

  return {
    packages: Object.fromEntries(
      [...packages]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, e]) => [name, { versions: [...e.versions].sort(), anyVersion: e.anyVersion }])
    ),
    fromMaps,
    copied: roots.length,
  };
}

function main() {
  const { values } = parseArgs({
    options: Object.fromEntries(['record', 'lockfile', 'out'].map(n => [n, { type: 'string' }])),
  });
  if (!values.record || !values.lockfile || !values.out) {
    throw new Error(
      'usage: dist-packages.mjs --record <record.json> --lockfile <pnpm-lock.yaml> --out <dist-packages.json>'
    );
  }
  const record = JSON.parse(fs.readFileSync(values.record, 'utf8'));
  const { packages, fromMaps, copied } = distPackages(
    record,
    fs.readFileSync(values.lockfile, 'utf8')
  );
  // The viewer always bundles npm packages and always copies onnxruntime-web,
  // so zero of either means the build changed shape, not that there's nothing.
  if (fromMaps === 0) {
    throw new Error(
      "No npm packages were found in the build's source maps; their path format may have " +
        'changed. Update sourcePath() in .scripts/dependency-audit/dist-packages.mjs.'
    );
  }
  if (copied === 0) {
    throw new Error(
      'No package copied in whole was found in the build config; the copy list may have moved. ' +
        'Update .scripts/dependency-audit/rsbuild.audit.config.ts.'
    );
  }
  fs.writeFileSync(values.out, JSON.stringify({ packages }, null, 1));
  console.log(
    `Found ${Object.keys(packages).length} package(s) in the build ` +
      `(${copied} copied in whole).`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(`::error title=Dependency check failed::${escapeCommand(error.message)}`);
    process.exit(2);
  }
}
