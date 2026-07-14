const fs = require('fs');
const os = require('os');
const path = require('path');
// immutability-helper powers the $set / $push / $apply notation an
// APP_PLUGIN_CONFIG override can use — the same library and commands the OHIF
// CustomizationService applies (platform/core/src/services/CustomizationService).
const update = require('immutability-helper').default || require('immutability-helper');

// The static default plugin config, and the directory that a relative
// APP_PLUGIN_CONFIG path (and its `include`s) resolve against.
const APP_DIR = path.resolve(__dirname, '..');
const BASE_PLUGIN_CONFIG_PATH = path.join(APP_DIR, 'pluginConfig.json');

// Extra plugins injected via environment variables rather than
// pluginConfig.json, so a deployment can add extensions/modes without editing
// tracked files:
//
//   EXTRA_EXTENSIONS="@ohif/extension-foo,@bar/ext=~/code/bar-ext" \
//   EXTRA_MODES="my-mode" yarn dev
//
// Each comma-separated entry is a package name, optionally followed by
// `=<directory>` pointing at the package root of an out-of-tree plugin (same
// semantics as a pluginConfig `directory` override — `.` and `~` prefixes are
// resolved by fromDirectory below). Entries without a directory are resolved
// like any declared plugin: from the extensions/ or modes/ workspaces, or from
// node_modules when installed as a dependency.
//
// The entries are appended to the in-memory pluginConfig before any of the
// caches below are built, so name declaration, alias resolution, asset copying
// and the generated pluginImports.js all treat them exactly like plugins
// declared in pluginConfig.json.
//
// Companion-mode auto-detection: if an EXTRA_EXTENSIONS package bundles a mode in
// a `mode/` subdirectory, that mode is registered automatically (see below), so
// `EXTRA_EXTENSIONS=<ext>` alone brings in the extension and its mode without a
// separate EXTRA_MODES entry.
//
// The plugin config is assembled in three layers, each overriding the previous:
//
//   1. pluginConfig.json                 the static, tracked default (never edited here)
//   2. APP_PLUGIN_CONFIG=<file>          an optional tracked override file. It may
//                                        `include` the default (and/or other files)
//                                        and layer extensions/modes/public over it —
//                                        plain arrays append (de-duped by package
//                                        name), immutability-helper commands like
//                                        { "$set": [...] } replace a whole list.
//   3. EXTRA_EXTENSIONS / EXTRA_MODES    names injected via env, appended last.
//
// Layer 2 lets a build pin exactly which plugins it ships in its own tracked file
// without touching the shared default; layer 3 keeps the lightweight, 12-Factor
// runtime-injection path. See loadPluginConfig / mergePluginConfig below.
/**
 * Parse a comma-separated EXTRA_EXTENSIONS / EXTRA_MODES env value into the
 * plugin-entry shape used by pluginConfig.
 *
 * @param {string} [envValue] Comma-separated list of `packageName` or
 *   `packageName=<directory>` entries. Empty/undefined yields an empty list.
 * @returns {Array<{packageName: string, directory?: string}>} One entry per
 *   parsed plugin; `directory` is present only when a `=<directory>` override
 *   was supplied. Entries with no package name are dropped.
 */
function parseExtraPlugins(envValue) {
  if (!envValue) {
    return [];
  }
  return envValue
    .split(',')
    .map(entry => {
      const [packageName, directory] = entry.trim().split('=');
      return directory ? { packageName, directory } : { packageName };
    })
    .filter(plugin => plugin.packageName);
}

// Resolve a config path. ~ expands to the home dir, absolute paths are used
// verbatim, and everything else (including ./ and ../) resolves against `fromDir`.
function resolveConfigPath(fromDir, configPath) {
  if (path.isAbsolute(configPath)) return configPath;
  if (configPath[0] === '~') return path.join(os.homedir(), configPath.substring(1));
  return path.resolve(fromDir, configPath);
}

function readPluginConfigJson(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`[pluginConfig] config file not found: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// True when `val` is an immutability-helper command spec (e.g. { $set: [...] },
// { $push: [...] }) rather than a plain value to append or replace.
function isCommandSpec(val) {
  return (
    val !== null &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    Object.keys(val).some(key => key.startsWith('$'))
  );
}

// Append `overrideList` onto `baseList`, de-duped by plugin package name: an
// override entry whose name matches a base entry REPLACES it (so a build can pin
// a version or flip `default`); otherwise it is appended.
function mergePluginList(baseList, overrideList) {
  const result = Array.isArray(baseList) ? [...baseList] : [];
  const indexByName = new Map(result.map((entry, i) => [extractName(entry), i]));
  for (const entry of overrideList) {
    const name = extractName(entry);
    if (name && indexByName.has(name)) {
      result[indexByName.get(name)] = entry;
    } else {
      if (name) indexByName.set(name, result.length);
      result.push(entry);
    }
  }
  return result;
}

// Merge an override config over a base config. For each key (except `include`):
//   - an immutability-helper command spec ({ $set: [...] }, ...) is applied via
//     immutability-helper `update`, the same notation the CustomizationService uses;
//   - a plain array is appended to the base list, de-duped by package name;
//   - anything else replaces the base value.
function mergePluginConfig(base, override) {
  const merged = { ...base };
  for (const key of Object.keys(override)) {
    if (key === 'include') continue;
    const val = override[key];
    if (isCommandSpec(val)) {
      merged[key] = update(merged[key] === undefined ? [] : merged[key], val);
    } else if (Array.isArray(val)) {
      merged[key] = mergePluginList(merged[key], val);
    } else {
      merged[key] = val;
    }
  }
  return merged;
}

// Load a config file and recursively resolve its `include` chain (a string or
// array of paths, each relative to the including file's own directory). Every
// included config forms the base that the file then merges over. `seen` guards
// against include cycles.
function loadConfigWithIncludes(file, seen) {
  const abs = path.resolve(file);
  if (seen.has(abs)) {
    throw new Error(`[pluginConfig] circular include detected at: ${abs}`);
  }
  seen.add(abs);
  const raw = readPluginConfigJson(abs);
  const includes = raw.include ? (Array.isArray(raw.include) ? raw.include : [raw.include]) : [];
  let base = {};
  for (const inc of includes) {
    base = mergePluginConfig(base, loadConfigWithIncludes(resolveConfigPath(path.dirname(abs), inc), seen));
  }
  return mergePluginConfig(base, raw);
}

// Layers 1 + 2 (see header). With no APP_PLUGIN_CONFIG the result is exactly the
// static default — identical to before this feature. With it set, the override
// file is the root: it typically `include`s the default to extend it, then layers
// its own extensions/modes/public over the result.
//
// TODO(scope-B): per-mode dependency override. A reviewer asked to also let a
// build reshape an INDIVIDUAL mode's internal extensionDependencies / route panels
// (e.g. swap a panel in mode-longitudinal without forking it). That data lives in
// each mode's SOURCE, not in pluginConfig, so it cannot be expressed by this
// build-time merge — it needs a runtime customization hook in the mode/route
// loading path. Deliberately out of scope here; tracked for a follow-up.
function loadPluginConfig() {
  const overridePath = process.env.APP_PLUGIN_CONFIG;
  if (!overridePath) {
    return readPluginConfigJson(BASE_PLUGIN_CONFIG_PATH);
  }
  return loadConfigWithIncludes(resolveConfigPath(APP_DIR, overridePath), new Set());
}

// Layer 1 + 2: static default, optionally replaced/extended by APP_PLUGIN_CONFIG.
const pluginConfig = loadPluginConfig();

// Layer 3 (last word): names injected via EXTRA_EXTENSIONS / EXTRA_MODES are
// merged on top of whatever the file layers produced — de-duped by package
// name, with the env entry replacing a same-named file entry (so an env
// `=<directory>` override wins over a pluginConfig.json registration).
pluginConfig.extensions = mergePluginList(
  pluginConfig.extensions,
  parseExtraPlugins(process.env.EXTRA_EXTENSIONS)
);
pluginConfig.modes = mergePluginList(pluginConfig.modes, parseExtraPlugins(process.env.EXTRA_MODES));

const autogenerationDisclaimer = `
// THIS FILE IS AUTOGENERATED AS PART OF THE EXTENSION AND MODE PLUGIN PROCESS.
// IT SHOULD NOT BE MODIFIED MANUALLY \n`;

function extractName(val) {
  return typeof val === 'string' ? val : val.packageName;
}

const publicURL = process.env.PUBLIC_URL || '/';

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
  dynamicLoad.push(
    '\n\n// Add a dynamic runtime loader',
    'async function loadModule(module) {',
    "  if (typeof module !== 'string') return module;"
  );
  modules.forEach(module => {
    const packageName = extractName(module);
    if (!packageName) {
      return;
    }
    if (module.importPath) {
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
    '  return (await window.browserImportFunction(module)).default;',
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

const fromDirectory = (srcDir, dirPath) => {
  if (!dirPath) return;
  if (dirPath[0] === '.') return srcDir + '/../../..' + dirPath.substring(1);
  if (dirPath[0] === '~') return os.homedir() + dirPath.substring(1);
  return dirPath;
};

const APP_SRC_DIR = path.resolve(__dirname, '../src');
const REPO_ROOT = path.resolve(__dirname, '../../../');

// Resolve a declared extension entry to its package root: an explicit
// `directory` override wins, otherwise look it up among the in-tree
// extensions/ workspaces by package name.
function resolveInjectedExtensionDir(entry) {
  if (entry.directory) {
    return fromDirectory(APP_SRC_DIR, entry.directory);
  }
  const root = path.join(REPO_ROOT, 'extensions');
  if (!fs.existsSync(root)) {
    return undefined;
  }
  for (const dir of fs.readdirSync(root)) {
    const pkgJsonPath = path.join(root, dir, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) {
      continue;
    }
    try {
      if (JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).name === entry.packageName) {
        return path.join(root, dir);
      }
    } catch {
      // ignore an unparseable package.json
    }
  }
  return undefined;
}

// Auto-register a companion mode bundled inside a declared extension.
// Convention: if a declared extension package contains a `mode/` subdirectory
// with its own package.json, register that mode automatically — so declaring
// the extension alone (via pluginConfig.json, APP_PLUGIN_CONFIG, or
// EXTRA_EXTENSIONS) pulls in the extension AND its bundled mode, with no
// separate mode entry. An explicitly declared mode still wins (a mode already
// present by name is left untouched). pluginConfig.extensions already includes
// the EXTRA_EXTENSIONS entries appended above.
for (const declared of pluginConfig.extensions || []) {
  const ext = typeof declared === 'string' ? { packageName: declared } : declared;
  const extDir = resolveInjectedExtensionDir(ext);
  if (!extDir) {
    continue;
  }
  const modeDir = path.join(extDir, 'mode');
  const modePkgJsonPath = path.join(modeDir, 'package.json');
  if (!fs.existsSync(modePkgJsonPath)) {
    continue;
  }
  let modeName;
  try {
    modeName = JSON.parse(fs.readFileSync(modePkgJsonPath, 'utf8')).name;
  } catch {
    continue;
  }
  if (!modeName || pluginConfig.modes.some(m => extractName(m) === modeName)) {
    continue;
  }
  pluginConfig.modes.push({ packageName: modeName, directory: modeDir });
}

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
  for (const group of ['extensions', 'modes']) {
    const root = path.join(REPO_ROOT, group);
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
        if (name && declared.has(name)) {
          map[name] = path.join(root, dir);
        }
      } catch {
        // ignore an unparseable package.json
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
    return fromDirectory(APP_SRC_DIR, plugin.directory);
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
  const inNodeModules = name && path.join(REPO_ROOT, 'node_modules', name);
  return inNodeModules && fs.existsSync(inNodeModules) ? inNodeModules : undefined;
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
        from = fromDirectory(APP_SRC_DIR, plugin.directory);
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

function writePluginImportsFile(SRC_DIR, DIST_DIR) {
  let pluginImportsJsContent = autogenerationDisclaimer;

  const extensionLines = constructLines(pluginConfig.extensions, 'extensions');
  const modeLines = constructLines(pluginConfig.modes, 'modes');

  pluginImportsJsContent += getFormattedImportBlock([
    ...extensionLines.importLines,
    ...modeLines.importLines,
  ]);
  pluginImportsJsContent += getFormattedWindowBlock([
    ...extensionLines.addToWindowLines,
    ...modeLines.addToWindowLines,
  ]);

  pluginImportsJsContent += getRuntimeLoadModesExtensions([
    ...pluginConfig.extensions,
    ...pluginConfig.modes,
    ...pluginConfig.public,
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
    [...pluginConfig.modes, ...pluginConfig.extensions],
    'public'
  );

  // Some extensions/modes ship prebuilt chunks/workers/wasm in dist/; copy them
  // if present.
  const copyPluginDistToDist = createCopyPluginToDist(
    DIST_DIR,
    [...pluginConfig.modes, ...pluginConfig.extensions],
    'dist'
  );

  // `public`-section entries (e.g. ./platform/public, dicom-microscopy-viewer)
  // point `directory` at the asset folder itself, so copy it verbatim.
  const copyPublicSectionToDist = createCopyPluginToDist(
    DIST_DIR,
    pluginConfig.public || [],
    'public',
    { literalDirectory: true }
  );

  return [...copyPluginPublicToDist, ...copyPluginDistToDist, ...copyPublicSectionToDist];
}

module.exports = writePluginImportsFile;
module.exports.getPluginResolveAliases = getPluginResolveAliases;
