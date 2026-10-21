// The generated pluginImports.js
// is codegen and gitignored, so test the GENERATOR against a fixture config in
// a temp dir and assert on the emitted source. All runtime-loading
// logic (descriptor detection/loading, the runtimeModules cache, the origin
// allowlist gate) lives in platform/app/src/runtimeExtensionLoader.ts (tested
// directly in its own suite); the codegen emits the loader import, the
// descriptor branches, the cache lookup, and the gated fallthrough.
const fs = require('fs');
const os = require('os');
const path = require('path');
const writePluginImportsFile = require('../../.rspack/writePluginImportsFile.js');

const fixture = {
  extensions: [
    { packageName: '@fixture/ext-a' },
    {
      packageName: '@fixture/ext-url',
      importPath: '/plugins/ext-url/index.umd.js',
      globalName: 'fixtureExtUrl',
    },
  ],
  modes: [{ packageName: '@fixture/mode-a' }],
  public: [],
};

describe('writePluginImportsFile codegen', () => {
  let src;
  beforeAll(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ohif-codegen-'));
    writePluginImportsFile(tmp, path.join(tmp, 'dist'), fixture);
    src = fs.readFileSync(path.join(tmp, 'pluginImports.js'), 'utf8');
  });

  test('emits the runtimeExtensionLoader import (all six names) before loadModule', () => {
    expect(src).toContain("} from './runtimeExtensionLoader';");
    for (const name of [
      'isRuntimeDescriptor',
      'loadRuntimeDescriptor',
      'resolveRuntimeModule',
      'loadExternalModule',
      'sharePlugin',
      'loadInPhases',
    ]) {
      expect(src).toContain(name);
      expect(src.indexOf(name)).toBeLessThan(src.indexOf('async function loadModule'));
    }
  });

  test('branch order: descriptor < string passthrough < static branches < cache < gated fallthrough', () => {
    const order = [
      "} from './runtimeExtensionLoader';",
      'if (isRuntimeDescriptor(module)) return loadRuntimeDescriptor(module, builtInPlugins, kind);',
      "if (typeof module !== 'string') return module;",
      'if( module==="@fixture/ext-a")',
      'const runtimeModule = resolveRuntimeModule(module);',
      'return loadExternalModule(module);',
    ];
    const positions = order.map(s => src.indexOf(s));
    positions.forEach((pos, i) => {
      expect(pos).toBeGreaterThan(-1);
      if (i > 0) {
        expect(pos).toBeGreaterThan(positions[i - 1]);
      }
    });
  });

  test('emits the tuple-descriptor branch ahead of the string passthrough', () => {
    expect(src).toContain('if (Array.isArray(module) && isRuntimeDescriptor(module[0])) {');
    expect(src).toContain('return [await loadRuntimeDescriptor(module[0], builtInPlugins, kind), module[1]];');
    expect(src.indexOf('Array.isArray(module)')).toBeLessThan(
      src.indexOf("if (typeof module !== 'string') return module;")
    );
  });

  test('declares every pluginConfig extension and mode as built in, before loadModule', () => {
    const declaration =
      'const builtInPlugins = new Set(["@fixture/ext-a","@fixture/ext-url","@fixture/mode-a"]);';
    expect(src).toContain(declaration);
    expect(src.indexOf(declaration)).toBeLessThan(src.indexOf('async function loadModule'));
  });

  test('the cache lookup returns before the fallthrough', () => {
    expect(src).toContain('if (runtimeModule !== undefined) return runtimeModule;');
    expect(src.indexOf('if (runtimeModule !== undefined) return runtimeModule;')).toBeLessThan(
      src.indexOf('return loadExternalModule(module);')
    );
  });

  test('the fallthrough delegates to loadExternalModule and never calls browserImportFunction(module) directly', () => {
    expect(src).toContain('return loadExternalModule(module);');
    expect(src.match(/window\.browserImportFunction\(module\)/g)).toBe(null);
    expect(src).not.toContain('(await window.browserImportFunction(module)).default');
  });

  test('the fallthrough comes after every declared-plugin branch', () => {
    expect(src.indexOf('if( module==="@fixture/ext-a")')).toBeLessThan(
      src.indexOf('return loadExternalModule(module);')
    );
    expect(src.indexOf('if( module==="@fixture/mode-a")')).toBeLessThan(
      src.indexOf('return loadExternalModule(module);')
    );
  });

  test('preserves existing branches', () => {
    expect(src).toContain("  if (typeof module !== 'string') return module;");
    expect(src).toContain('if( module==="@fixture/ext-a") {');
    expect(src).toContain('const imported = await import("@fixture/ext-a");');
    expect(src).toContain("window.browserImportFunction('/plugins/ext-url/index.umd.js')");
    expect(src).toContain('window["fixtureExtUrl"]');
    expect(src).toContain('export { loadModule, modes, extensions, importItems };');
  });

  test('every compiled-in extension and mode shares itself', () => {
    expect(src).toContain('return sharePlugin("@fixture/ext-a", imported).default;');
    expect(src).toContain('return sharePlugin("@fixture/mode-a", imported).default;');
  });

  test('an importPath entry does not share itself (its own script sets its global)', () => {
    expect(src).not.toContain('sharePlugin("@fixture/ext-url"');
  });

  test('importItems loads in phases instead of all at once', () => {
    expect(src).toContain('  return loadInPhases(modules, module => loadModule(module, kind));');
    expect(src).not.toContain('Promise.all(modules.map(loadModule))');
  });

  test('importItems and loadModule pass the kind through to the descriptor loader', () => {
    expect(src).toContain('export default function importItems(modules, kind) {');
    expect(src).toContain('async function loadModule(module, kind) {');
  });
});

// The same generator run against the REAL pluginConfig.json (the
// default third argument), still writing to a temp dir so the checked-out tree
// is untouched. Proves the shipped codegen shape: branch order, the absent
// ungated fallthrough, the dicom-microscopy-viewer importPath branch, exports.
describe('writePluginImportsFile codegen against the real pluginConfig.json', () => {
  let src;
  beforeAll(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ohif-codegen-real-'));
    writePluginImportsFile(tmp, path.join(tmp, 'dist'));
    src = fs.readFileSync(path.join(tmp, 'pluginImports.js'), 'utf8');
  });

  test('branch ORDER: loader import < descriptor branch < string passthrough < first static branch < cache < gated fallthrough', () => {
    const order = [
      "} from './runtimeExtensionLoader';",
      'isRuntimeDescriptor(module)',
      "typeof module !== 'string'",
      'if( module==="@ohif/extension-default")',
      'resolveRuntimeModule(module)',
      'return loadExternalModule(module);',
    ];
    const positions = order.map(s => src.indexOf(s));
    positions.forEach((pos, i) => {
      expect(pos).toBeGreaterThan(-1);
      if (i > 0) {
        expect(pos).toBeGreaterThan(positions[i - 1]);
      }
    });
  });

  test('the old ungated fallthrough is gone', () => {
    expect(src).not.toContain('(await window.browserImportFunction(module)).default');
  });

  test('the dicom-microscopy-viewer importPath branch is still emitted verbatim', () => {
    expect(src).toContain(
      [
        '  if( module==="dicom-microscopy-viewer") {',
        "    const imported = await window.browserImportFunction('/dicom-microscopy-viewer/dicomMicroscopyViewer.min.js');",
        '    return window["dicomMicroscopyViewer"];',
        '  }',
      ].join('\n')
    );
  });

  test('the exports line is present', () => {
    expect(src).toContain('export { loadModule, modes, extensions, importItems };');
  });
});
