const pluginConfigSchema = require('../pluginConfig.schema.json');
const fs = require('fs');
const os = require('os');
const path = require('path');
const schemaConstraints = require('../../../.rspack/schemaConstraints');
// Importing this applies an OHIF_ENV profile (if any) before we read
// PLUGIN_CONFIG, so a downstream deployment can point the build at a
// pluginConfig.json it owns instead of editing this repo. tailwind.config.js and
// scripts/ohif-plugin.mjs come through here too, so all three agree.
const { resolvePluginConfigPath } = require('../../../.rspack/loadBuildProfile');

const PLUGIN_CONFIG_PATH = resolvePluginConfigPath();
const pluginConfig = JSON.parse(fs.readFileSync(PLUGIN_CONFIG_PATH, 'utf8'));

// --- pluginConfig.json structural validation (mirrors pluginConfig.schema.json).
// Hand-rolled on purpose: the build must not gain a runtime dependency for this.
//
// STRUCTURE (which keys exist, which are required, their types) is hand-rolled
// below. VALUE constraints (`pattern`, `minLength`) are read straight out of
// pluginConfig.schema.json instead of being retyped, so the two cannot drift —
// the previous version type-checked strings only and silently accepted a
// packageName that violated the schema's npm-name pattern. Parity is pinned by
// platform/app/src/__tests__/pluginConfigSchemaParity.test.js.
const PLUGIN_FIELDS = { packageName: 'string', default: 'boolean', directory: 'string' };
const PUBLIC_FIELDS = {
  directory: 'string',
  packageName: 'string',
  importPath: 'string',
  globalName: 'string',
  importName: 'string',
  to: 'string',
};
const ROOT_KEYS = ['$schema', 'root', 'extensions', 'modes', 'public'];

const PLUGIN_CONSTRAINTS = schemaConstraints(pluginConfigSchema.definitions.plugin.properties);
const PUBLIC_CONSTRAINTS = schemaConstraints(pluginConfigSchema.definitions.publicEntry.properties);

// Fields the codegen interpolates into generated JS string literals (see
// getRuntimeLoadModesExtensions): packageName/globalName/importName land inside
// "double quotes", importPath inside 'single quotes'. A quote, backslash, or
// newline in any of them injects code into pluginImports.js, so reject those
// characters unconditionally — independently of whatever the schema patterns
// happen to allow.
const INTERPOLATED_FIELDS = ['packageName', 'globalName', 'importName', 'importPath'];
const UNSAFE_INTERPOLATION = /["'\\\r\n]/;

function checkEntry(errors, where, entry, allowed, required, constraints = {}) {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    errors.push(
      `${where}: expected an object ({ "packageName": ... }), got ${JSON.stringify(entry)}`
    );
    return;
  }
  const label = entry.packageName ? `${where} (${entry.packageName})` : where;
  for (const field of required) {
    if (typeof entry[field] !== 'string' || !entry[field]) {
      errors.push(`${label}: missing required string field "${field}"`);
    }
  }
  for (const [key, value] of Object.entries(entry)) {
    if (!(key in allowed)) {
      errors.push(
        key === 'version'
          ? `${label}: the "version" field is dead — nothing reads it; delete the line`
          : `${label}: unknown field "${key}" (allowed: ${Object.keys(allowed).join(', ')})`
      );
      continue;
    }
    if (typeof value !== allowed[key]) {
      errors.push(`${label}: "${key}" must be a ${allowed[key]}, got ${typeof value}`);
      continue;
    }
    if (typeof value !== 'string') {
      continue;
    }
    if (INTERPOLATED_FIELDS.includes(key) && UNSAFE_INTERPOLATION.test(value)) {
      errors.push(
        `${label}: "${key}" value ${JSON.stringify(value)} contains a quote, backslash, or ` +
          'newline; those characters would be injected verbatim into the generated pluginImports.js'
      );
      continue;
    }
    const constraint = constraints[key];
    if (!constraint) {
      continue;
    }
    if (constraint.minLength !== undefined && value.length < constraint.minLength) {
      errors.push(
        `${label}: "${key}" must be at least ${constraint.minLength} character(s) long ` +
          '(pluginConfig.schema.json)'
      );
    } else if (constraint.pattern && !constraint.pattern.test(value)) {
      errors.push(
        `${label}: "${key}" value ${JSON.stringify(value)} does not match the schema pattern ` +
          `/${constraint.pattern.source}/ (pluginConfig.schema.json)`
      );
    }
  }
}

function validatePluginConfig(config) {
  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    return ['root: must be an object with "extensions" and "modes" arrays'];
  }
  const errors = [];
  for (const key of Object.keys(config)) {
    if (!ROOT_KEYS.includes(key)) {
      errors.push(`root: unknown section "${key}" (allowed: ${ROOT_KEYS.join(', ')})`);
    }
  }
  if (config.root !== undefined && (typeof config.root !== 'string' || !config.root)) {
    errors.push('root: "root" must be a non-empty string (a path relative to this config file)');
  }
  for (const section of ['extensions', 'modes']) {
    if (!Array.isArray(config[section])) {
      errors.push(`root: "${section}" must be an array`);
      continue;
    }
    const seen = new Set();
    config[section].forEach((entry, i) => {
      checkEntry(
        errors,
        `${section}[${i}]`,
        entry,
        PLUGIN_FIELDS,
        ['packageName'],
        PLUGIN_CONSTRAINTS
      );
      const name = entry && entry.packageName;
      if (name && seen.has(name)) {
        errors.push(`${section}[${i}]: duplicate packageName "${name}"`);
      }
      if (name) {
        seen.add(name);
      }
    });
  }
  if (config.public !== undefined) {
    if (!Array.isArray(config.public)) {
      errors.push('root: "public" must be an array');
    } else {
      config.public.forEach((entry, i) => {
        checkEntry(errors, `public[${i}]`, entry, PUBLIC_FIELDS, [], PUBLIC_CONSTRAINTS);
        if (entry && typeof entry === 'object' && !entry.directory && !entry.packageName) {
          errors.push(`public[${i}]: needs at least one of "directory" or "packageName"`);
        }
      });
    }
  }
  return errors;
}

const configErrors = validatePluginConfig(pluginConfig);
if (configErrors.length) {
  throw new Error(
    `Invalid ${PLUGIN_CONFIG_PATH} (${configErrors.length} error${configErrors.length === 1 ? '' : 's'}):\n` +
      configErrors.map(e => `  - ${e}`).join('\n') +
      '\nExpected shape: platform/app/pluginConfig.schema.json'
  );
}

const autogenerationDisclaimer = `
// THIS FILE IS AUTOGENERATED AS PART OF THE EXTENSION AND MODE PLUGIN PROCESS.
// IT SHOULD NOT BE MODIFIED MANUALLY \n`;

const extractName = val => (typeof val === 'string' ? val : val.packageName);

const publicURL = process.env.PUBLIC_URL || '/';

// Emitted at the top of the generated pluginImports.js. All runtime-loading
// logic (descriptor detection/loading, the runtimeModules cache consulted by
// the string branch, URL detection, deny-by-default origin allowlist,
// descriptive unknown-name error, semver gate against the DefinePlugin-injected
// process.env.VERSION_NUMBER) lives in platform/app/src/runtimeExtensionLoader.ts
// so it is directly unit-testable; the codegen only emits this import, the
// descriptor branches, the cache lookup, and the gated fallthrough inside
// loadModule.
const RUNTIME_LOADER_IMPORT =
  'import {\n' +
  '  isRuntimeDescriptor,\n  loadRuntimeDescriptor,\n  resolveRuntimeModule,\n  loadExternalModule,\n' +
  "} from './runtimeExtensionLoader';\n\n";

function isAbsolutePath(path) {
  return path.startsWith('http') || path.startsWith('/');
}

function constructLines(input, categoryName) {
  let pluginCount = 0;

  const lines = {
    importLines: [],
    addToWindowLines: [],
  };

  if (!input) return lines;

  input.forEach(entry => {
    if (entry.default === false) return;

    const packageName = extractName(entry);

    lines.addToWindowLines.push(`${categoryName}.push("${packageName}");\n`);

    pluginCount++;
  });

  return lines;
}

function getFormattedImportBlock(importLines) {
  let content = '';
  // Imports
  importLines.forEach(importLine => {
    content += importLine;
  });

  return content;
}

function getFormattedWindowBlock(addToWindowLines) {
  let content =
    'const extensions = [];\n' +
    'const modes = [];\n' +
    '\n// Not required any longer\n' +
    'window.extensions = extensions;\n' +
    'window.modes = modes;\n\n';

  addToWindowLines.forEach(addToWindowLine => {
    content += addToWindowLine;
  });

  return content;
}

function getRuntimeLoadModesExtensions(modules) {
  const dynamicLoad = [];
  // Branch ORDER is load-bearing: (1) the descriptor branch must come BEFORE the
  // `typeof module !== 'string'` passthrough (descriptors are objects and would
  // otherwise be handed to ExtensionManager raw); (2) the static per-package
  // branches come before the cache so bundled packages can never be shadowed by
  // a runtime descriptor reusing their name; (3) the cache comes before the
  // gated fallthrough so Mode.tsx bare names hit the cache instead of a 404
  // import.
  dynamicLoad.push(
    '\n\n// Add a dynamic runtime loader',
    'async function loadModule(module) {',
    '  // Track B: app-config runtime descriptors ({ packageName, importPath, ... })',
    '  if (isRuntimeDescriptor(module)) return loadRuntimeDescriptor(module);',
    '  if (Array.isArray(module) && isRuntimeDescriptor(module[0])) {',
    '    return [await loadRuntimeDescriptor(module[0]), module[1]];',
    '  }',
    "  if (typeof module !== 'string') return module;"
  );
  modules.forEach(module => {
    const packageName = extractName(module);
    if (!packageName) {
      return;
    }
    if (module.importPath) {
      // TRUST MODEL: a pluginConfig.json `importPath` is build-time
      // configuration, baked into the bundle by whoever built the viewer, so it
      // is trusted and imported directly — no origin allowlist and no
      // integrity/SRI check, even when the URL is absolute and cross-origin.
      // Changing one requires editing pluginConfig.json and rebuilding, which
      // is the same trust level as editing the app's source. Runtime-supplied
      // URLs are NOT trusted this way: see the tiers documented on
      // loadExternalModule in platform/app/src/runtimeExtensionLoader.ts.
      dynamicLoad.push(
        `  if( module==="${packageName}") {`,
        `    const imported = await window.browserImportFunction('${isAbsolutePath(module.importPath) ? '' : publicURL}${module.importPath}');`,
        '    return ' +
          (module.globalName
            ? `window["${module.globalName}"];`
            : `imported["${module.importName || 'default'}"];`),
        '  }'
      );
      return;
    }
    dynamicLoad.push(
      `  if( module==="${packageName}") {`,
      `    const imported = await import("${packageName}");`,
      '    return imported.default;',
      '  }'
    );
  });
  // TODO - handle more cases for import than just default
  dynamicLoad.push(
    '  // Track B: bare-name resolution for runtime-loaded packages (Mode.tsx dependencies)',
    '  const runtimeModule = resolveRuntimeModule(module);',
    '  if (runtimeModule !== undefined) return runtimeModule;',
    '  // WS2: gated fallthrough — deny-by-default origin allowlist; unknown bare',
    '  // names throw a descriptive error (see runtimeExtensionLoader.ts).',
    '  return loadExternalModule(module);',
    '}\n',
    '// Import a list of items (modules or string names)',
    '// @return a Promise evaluating to a list of modules',
    'export default function importItems(modules) {',
    '  return Promise.all(modules.map(loadModule));',
    '}\n',
    'export { loadModule, modes, extensions, importItems };\n\n'
  );
  return dynamicLoad.join('\n');
}

const REPO_ROOT = path.resolve(__dirname, '../../../');

// Base for `./`-relative `directory` values, and the tree scanned for in-tree
// extensions/ and modes/ workspaces.
//
// Default: the OHIF repo root, which is what the shipped config's values mean
// ("./platform/public"). A config that lives outside this repo — selected with
// PLUGIN_CONFIG / an OHIF_ENV profile — declares its own `"root"`, resolved
// against the config file's directory, so it can use short relative paths for
// the plugins it owns. Omitting `root` keeps the historical meaning exactly, so
// no existing config changes behavior.
const CONFIG_DIR = path.dirname(PLUGIN_CONFIG_PATH);
const CONFIG_ROOT = pluginConfig.root
  ? path.resolve(CONFIG_DIR, pluginConfig.root)
  : REPO_ROOT;
// Trees searched for workspace plugins and installed dependencies, nearest
// first. Identical to [REPO_ROOT] unless an external config set `root`.
const SEARCH_ROOTS = CONFIG_ROOT === REPO_ROOT ? [REPO_ROOT] : [CONFIG_ROOT, REPO_ROOT];

const fromDirectory = dirPath => {
  if (!dirPath) return;
  if (dirPath[0] === '.') return path.join(CONFIG_ROOT, dirPath.substring(1));
  if (dirPath[0] === '~') return os.homedir() + dirPath.substring(1);
  return dirPath;
};

// The set of plugin package names declared in pluginConfig.json. Resolution and
// asset copying are driven entirely by this list — a package present in the
// extensions/ or modes/ workspaces but NOT listed here is ignored, and an
// external (out-of-tree) package listed here with a `directory` is included.
let declaredPluginNamesCache;
function getDeclaredPluginNames() {
  if (declaredPluginNamesCache) {
    return declaredPluginNamesCache;
  }
  const names = new Set();
  for (const entry of [...(pluginConfig.extensions || []), ...(pluginConfig.modes || [])]) {
    const name = extractName(entry);
    if (name) {
      names.add(name);
    }
  }
  declaredPluginNamesCache = names;
  return names;
}

// Map each in-tree plugin's real package name to its directory, but ONLY for the
// plugins declared in pluginConfig.json. This lets the bundler resolve those
// plugins from their source without them being dependencies of platform/app
// (and therefore without entries in package.json / the lockfile), while leaving
// undeclared workspace packages out of the build entirely.
let workspacePluginDirsCache;
function getWorkspacePluginDirs() {
  if (workspacePluginDirsCache) {
    return workspacePluginDirsCache;
  }
  const declared = getDeclaredPluginNames();
  const map = {};
  // Nearest root first, and an earlier hit is never overwritten, so a
  // workspace's own extensions/<name> shadows a same-named one in the harness
  // checkout.
  for (const searchRoot of SEARCH_ROOTS) {
    for (const group of ['extensions', 'modes']) {
      const root = path.join(searchRoot, group);
      if (!fs.existsSync(root)) {
        continue;
      }
      for (const dir of fs.readdirSync(root)) {
        const pkgJsonPath = path.join(root, dir, 'package.json');
        if (!fs.existsSync(pkgJsonPath)) {
          continue;
        }
        try {
          const { name } = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
          if (name && declared.has(name) && !map[name]) {
            map[name] = path.join(root, dir);
          }
        } catch {
          // ignore an unparseable package.json
        }
      }
    }
  }
  workspacePluginDirsCache = map;
  return map;
}

// Source directory of a workspace plugin: an explicit `directory` override wins
// (out-of-tree plugins), otherwise look it up among the in-tree workspaces by
// package name. Returns undefined for an external plugin that is instead
// installed as a normal dependency (resolved from node_modules — see
// pluginAssetDir and getPluginResolveAliases).
function workspacePluginDir(plugin) {
  if (plugin.directory) {
    return fromDirectory(plugin.directory);
  }
  return getWorkspacePluginDirs()[extractName(plugin)];
}

// Where a plugin's copyable assets (public/, dist/) live. In-tree and
// `directory`-overridden plugins use their source dir; anything else declared
// in pluginConfig falls back to node_modules. This is what lets an external
// extension/mode be included by adding it to the root package.json as a normal
// dependency (e.g. third-party packages such as dicom-microscopy-viewer).
function pluginAssetDir(plugin) {
  const dir = workspacePluginDir(plugin);
  if (dir) {
    return dir;
  }
  const name = extractName(plugin);
  if (!name) {
    return undefined;
  }
  for (const searchRoot of SEARCH_ROOTS) {
    const inNodeModules = path.join(searchRoot, 'node_modules', name);
    if (fs.existsSync(inNodeModules)) {
      return inNodeModules;
    }
  }
  return undefined;
}

// Alias map fed into webpack `resolve.alias`. The trailing `$` makes each alias
// an EXACT match for the bare package specifier that the generated
// pluginImports.js imports, so deep subpath imports (e.g.
// `@ohif/extension-cornerstone/types`) still flow through normal resolution and
// honor each package's `exports` map.
//
// Only in-tree / `directory`-overridden plugins get an alias. An external
// plugin installed as a root dependency intentionally gets none: its bare
// specifier then resolves through webpack's normal node_modules walk-up
// (resolve.modules includes the repo-root node_modules), exactly like any other
// installed package.
function getPluginResolveAliases() {
  const alias = {};
  for (const entry of [...(pluginConfig.extensions || []), ...(pluginConfig.modes || [])]) {
    const name = extractName(entry);
    const dir = workspacePluginDir(entry);
    if (name && dir) {
      alias[`${name}$`] = dir;
    }
  }
  return alias;
}

// Tailwind content globs for declared plugins that are NOT in-tree workspace
// packages (those are covered by the static globs in
// platform/app/tailwind.config.js). Covers out-of-tree `directory` plugins
// and third-party plugins installed into node_modules (published tarballs
// ship src/ — see the publish workstream's `files` field). fast-glob needs
// forward slashes and rejects '..' segments, hence resolve + replace.
function getPluginContentGlobs() {
  const workspaceDirs = getWorkspacePluginDirs();
  const globs = [];
  for (const entry of [...(pluginConfig.extensions || []), ...(pluginConfig.modes || [])]) {
    const name = extractName(entry);
    const workspaceDir = !entry.directory && workspaceDirs[name];
    // Only THIS repo's extensions/ and modes/ are covered by the static globs.
    // A workspace plugin found under an external CONFIG_ROOT still needs one.
    if (workspaceDir && workspaceDir.startsWith(REPO_ROOT + path.sep)) {
      continue;
    }
    const dir = pluginAssetDir(entry);
    if (!dir || !fs.existsSync(path.join(dir, 'src'))) {
      continue; // absent checkout / dist-only package: nothing to scan
    }
    globs.push(`${path.resolve(dir).replace(/\\/g, '/')}/src/**/*.{jsx,js,ts,tsx,css}`);
  }
  return globs;
}

// Build CopyPlugin patterns for a set of plugins.
//
// For `public`-section entries (literalDirectory=true) a `directory` is the
// asset source itself — e.g. `./platform/public` or
// dicom-microscopy-viewer's prebuilt dist folder — so it is copied directly.
//
// For extension/mode entries a `directory` is instead the package ROOT (it
// doubles as the resolve alias target), so we copy its <folderName> (public/
// or dist/) subdirectory, exactly as we do for in-tree and node_modules
// plugins. This keeps an out-of-tree extension's assets landing in the same
// place as an in-tree one.
const createCopyPluginToDist = (distDir, plugins, folderName, { literalDirectory = false } = {}) => {
  return plugins
    .map(plugin => {
      let from;
      if (literalDirectory && plugin.directory) {
        from = fromDirectory(plugin.directory);
      } else {
        const dir = pluginAssetDir(plugin);
        from = dir && path.join(dir, folderName);
      }
      return from && fs.existsSync(from)
        ? {
            from,
            to: `${distDir}${plugin.to || ''}`,
            toType: 'dir',
          }
        : undefined;
    })
    .filter(Boolean);
};

// `config` is injectable for tests; the only real caller (rsbuild.config.ts)
// passes two args, so the default preserves behavior exactly.
function writePluginImportsFile(SRC_DIR, DIST_DIR, config = pluginConfig) {
  let pluginImportsJsContent = autogenerationDisclaimer;

  const extensionLines = constructLines(config.extensions, 'extensions');
  const modeLines = constructLines(config.modes, 'modes');

  pluginImportsJsContent += getFormattedImportBlock([
    RUNTIME_LOADER_IMPORT,
    ...extensionLines.importLines,
    ...modeLines.importLines,
  ]);
  pluginImportsJsContent += getFormattedWindowBlock([
    ...extensionLines.addToWindowLines,
    ...modeLines.addToWindowLines,
  ]);

  pluginImportsJsContent += getRuntimeLoadModesExtensions([
    ...config.extensions,
    ...config.modes,
    ...(config.public || []),
  ]);

  fs.writeFileSync(`${SRC_DIR}/pluginImports.js`, pluginImportsJsContent, { flag: 'w+' }, err => {
    if (err) {
      console.error(err);
      return;
    }
  });

  // Copy each extension/mode's static `public/` assets into the app dist.
  // Plugins are resolved from their source dir (see pluginAssetDir), so this
  // works whether they are in-tree, out-of-tree (`directory`), or installed as
  // dependencies of platform/app.
  const copyPluginPublicToDist = createCopyPluginToDist(
    DIST_DIR,
    [...config.modes, ...config.extensions],
    'public'
  );

  // Some extensions/modes ship prebuilt chunks/workers/wasm in dist/; copy them
  // if present.
  const copyPluginDistToDist = createCopyPluginToDist(
    DIST_DIR,
    [...config.modes, ...config.extensions],
    'dist'
  );

  // `public`-section entries (e.g. ./platform/public, dicom-microscopy-viewer)
  // point `directory` at the asset folder itself, so copy it verbatim.
  const copyPublicSectionToDist = createCopyPluginToDist(
    DIST_DIR,
    config.public || [],
    'public',
    { literalDirectory: true }
  );

  return [...copyPluginPublicToDist, ...copyPluginDistToDist, ...copyPublicSectionToDist];
}

module.exports = writePluginImportsFile;
module.exports.getPluginResolveAliases = getPluginResolveAliases;
module.exports.getPluginContentGlobs = getPluginContentGlobs;
module.exports.validatePluginConfig = validatePluginConfig;
// Which config this process is building from, and the base its relative
// `directory` values resolve against. Reported by `pnpm plugin doctor` and
// asserted by the build-profile tests.
module.exports.PLUGIN_CONFIG_PATH = PLUGIN_CONFIG_PATH;
module.exports.CONFIG_ROOT = CONFIG_ROOT;
// Exposed for pluginConfigSchemaParity.test.js only: the field/constraint
// tables above must stay in lockstep with pluginConfig.schema.json.
module.exports.validatorTables = {
  PLUGIN_FIELDS,
  PUBLIC_FIELDS,
  ROOT_KEYS,
  PLUGIN_CONSTRAINTS,
  PUBLIC_CONSTRAINTS,
  INTERPOLATED_FIELDS,
};
