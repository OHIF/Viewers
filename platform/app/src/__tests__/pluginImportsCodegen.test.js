// WS2.3 (as revised by Appendix A C1): the generated pluginImports.js is
// codegen and gitignored, so test the GENERATOR against a fixture config in a
// temp dir and assert on the emitted source. Per C1, the runtime-loading gate
// logic lives in platform/app/src/runtimeExtensionLoader.ts (tested directly
// in src/runtimeExtensionLoader.test.js); the codegen only emits the loader
// import and the gated fallthrough that delegates to loadExternalModule.
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

  test('emits the runtimeExtensionLoader import before loadModule', () => {
    expect(src).toContain("import { loadExternalModule } from './runtimeExtensionLoader';");
    expect(src.indexOf('loadExternalModule')).toBeLessThan(src.indexOf('async function loadModule'));
  });

  test('the fallthrough delegates to loadExternalModule and never calls browserImportFunction(module) directly', () => {
    expect(src).toContain('return loadExternalModule(module);');
    expect(src.match(/window\.browserImportFunction\(module\)/g)).toBe(null);
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
});
