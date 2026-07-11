// WS2.3 (as revised by Appendix A C1): the runtime-loading gate logic lives in
// runtimeExtensionLoader.ts and is tested directly (no string-eval of emitted
// code). Runs under jsdom, origin http://localhost. WS7 extends this suite
// with the descriptor/cache/audit behaviors.
import { isUrlLike, loadExternalModule } from './runtimeExtensionLoader';

describe('isUrlLike', () => {
  test.each([
    'https://x.example.com/y.js',
    'http://x.example.com/y.js',
    '/plugins/a.js',
    './a.js',
    '../a.js',
    '//host/x.js',
  ])('URL-shaped: %s', s => expect(isUrlLike(s)).toBe(true));

  test.each([
    '@ohif/extension-foo',
    'dicom-microscopy-viewer',
    'data:text/javascript,alert(1)',
    'blob:http://localhost/x',
  ])('not URL-shaped: %s', s => expect(isUrlLike(s)).toBe(false));
});

describe('loadExternalModule', () => {
  const loadedModule = { default: { id: 'loaded-plugin' } };

  beforeEach(() => {
    window.browserImportFunction = jest.fn().mockResolvedValue(loadedModule);
  });

  afterEach(() => {
    delete window.browserImportFunction;
    delete window.config;
    delete window.__ohif;
  });

  test('unknown bare names throw a descriptive error naming pluginConfig.json without importing', async () => {
    await expect(loadExternalModule('@typo/extension-name')).rejects.toThrow(
      /unknown module "@typo\/extension-name".*pluginConfig\.json/s
    );
    expect(window.browserImportFunction).not.toHaveBeenCalled();
  });

  test('data: and blob: URIs are refused by the bare-name throw', async () => {
    await expect(loadExternalModule('data:text/javascript,alert(1)')).rejects.toThrow(
      /unknown module/
    );
    await expect(loadExternalModule('blob:http://localhost/x')).rejects.toThrow(/unknown module/);
    expect(window.browserImportFunction).not.toHaveBeenCalled();
  });

  test('same-origin path, relative path, and absolute URL are allowed', async () => {
    await expect(loadExternalModule('/plugins/a.js')).resolves.toBe(loadedModule.default);
    await expect(loadExternalModule('./plugins/a.js')).resolves.toBe(loadedModule.default);
    await expect(loadExternalModule('http://localhost/deep/b.js')).resolves.toBe(
      loadedModule.default
    );
    expect(window.browserImportFunction).toHaveBeenCalledTimes(3);
    expect(window.browserImportFunction).toHaveBeenCalledWith('/plugins/a.js');
  });

  test('cross-origin is denied by default with an actionable message', async () => {
    await expect(loadExternalModule('https://evil.example.com/x.js')).rejects.toThrow(
      /refusing to load plugin code .* runtimeExtensionOrigins/s
    );
    expect(window.browserImportFunction).not.toHaveBeenCalled();
  });

  test('protocol-relative URLs resolve cross-origin and are denied', async () => {
    await expect(loadExternalModule('//evil.example.com/x.js')).rejects.toThrow(/not allowlisted/);
  });

  test('different port is a different origin', async () => {
    await expect(loadExternalModule('http://localhost:8080/x.js')).rejects.toThrow(
      /not allowlisted/
    );
  });

  test('window.config.runtimeExtensionOrigins allowlists an origin (with normalization)', async () => {
    window.config = { runtimeExtensionOrigins: ['https://cdn.example.com/any/path'] };
    await expect(loadExternalModule('https://cdn.example.com/plugins/ext.js')).resolves.toBe(
      loadedModule.default
    );
    await expect(loadExternalModule('https://other.example.com/ext.js')).rejects.toThrow(
      /not allowlisted/
    );
  });

  test('window.__ohif.runtimeExtensionOrigins is the canonical stash and takes precedence over window.config', async () => {
    // Function-style app configs cannot carry the array on window.config, so
    // the loader reads the __ohif stash first.
    window.__ohif = { runtimeExtensionOrigins: ['https://cdn.example.com'] };
    await expect(loadExternalModule('https://cdn.example.com/plugins/ext.js')).resolves.toBe(
      loadedModule.default
    );

    // When the stash exists, window.config's list is not consulted.
    window.__ohif = { runtimeExtensionOrigins: [] };
    window.config = { runtimeExtensionOrigins: ['https://cdn.example.com'] };
    await expect(loadExternalModule('https://cdn.example.com/plugins/ext.js')).rejects.toThrow(
      /not allowlisted/
    );
  });

  test('malformed allowlist entries are ignored, not fatal', async () => {
    window.config = { runtimeExtensionOrigins: [null, 42, '%%%'] };
    await expect(loadExternalModule('https://cdn.example.com/x.js')).rejects.toThrow(
      /not allowlisted/
    );
  });
});
