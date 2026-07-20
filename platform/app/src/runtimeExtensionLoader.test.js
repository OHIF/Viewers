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

// ---------------------------------------------------------------------------
// WS7.7 — descriptor loader behaviors (C3 STRICT globalName discriminator per
// the WS10.7 matrix: globalName present = UMD global lookup, absent = ESM
// .default, no fallback chain in either direction), Mode bare-name cache
// resolution, audit records, integrity, styles, and failure surfacing.
//
// The runtimeModules cache is module-scope state, so each test re-requires the
// loader through jest.resetModules() and starts from a fresh window.__ohif.
// ---------------------------------------------------------------------------

const nodeCrypto = require('crypto');

const HOST_VERSION = '3.13.0-beta.89';
const PKG = '@test/runtime-ext';
const ORIGINAL_VERSION_NUMBER = process.env.VERSION_NUMBER;

describe('loadRuntimeDescriptor (WS7.7)', () => {
  let loader;
  let extModule; // fresh per test so toBe assertions prove identity, not equality

  const audit = () => (window.__ohif && window.__ohif.runtimeExtensions) || [];
  const lastRecord = () => audit()[audit().length - 1];

  // UMD contract: dynamic import of the script has the side effect of assigning
  // the library global; the import() namespace itself carries nothing useful.
  const mockUmdImport = (globalName = PKG) => {
    window.browserImportFunction.mockImplementation(async () => {
      window[globalName] = extModule;
      return {};
    });
  };
  // ESM contract: the import() namespace default-exports the extension/mode.
  const mockEsmImport = (ns = undefined) => {
    window.browserImportFunction.mockResolvedValue(ns ?? { default: extModule });
  };

  const umdDescriptor = overrides => ({
    packageName: PKG,
    importPath: '/plugins/t.umd.js',
    globalName: PKG,
    ...overrides,
  });
  const esmDescriptor = overrides => ({
    packageName: PKG,
    importPath: '/plugins/t.mjs',
    ...overrides,
  });

  beforeEach(() => {
    process.env.VERSION_NUMBER = HOST_VERSION;
    delete window.__ohif;
    delete window.config;
    delete window[PKG];
    extModule = { id: PKG };
    window.browserImportFunction = jest.fn();
    if (!window.crypto || !window.crypto.subtle) {
      Object.defineProperty(window, 'crypto', {
        value: nodeCrypto.webcrypto,
        configurable: true,
      });
    }
    global.fetch = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-blob');
    URL.revokeObjectURL = jest.fn();
    jest.resetModules();
    loader = require('./runtimeExtensionLoader');
  });

  afterEach(() => {
    delete window.browserImportFunction;
    delete window.__ohif;
    delete window.config;
    delete window[PKG];
    delete global.fetch;
    delete URL.createObjectURL;
    delete URL.revokeObjectURL;
    document.head.querySelectorAll('link[rel="stylesheet"]').forEach(l => l.remove());
  });

  afterAll(() => {
    process.env.VERSION_NUMBER = ORIGINAL_VERSION_NUMBER;
  });

  describe('C3 strict format discriminator', () => {
    test('UMD happy path: globalName set returns the window global and audits loaded/umd', async () => {
      mockUmdImport();
      const mod = await loader.loadRuntimeDescriptor(umdDescriptor());
      expect(mod).toBe(extModule);
      expect(window.browserImportFunction).toHaveBeenCalledWith(
        'http://localhost/plugins/t.umd.js'
      );
      const record = lastRecord();
      expect(record.status).toBe('loaded');
      expect(record.format).toBe('umd');
      expect(record.packageName).toBe(PKG);
      expect(record.hostVersion).toBe('3.13.0-beta.89');
      expect(record.resolvedUrl).toBe('http://localhost/plugins/t.umd.js');
      expect(typeof record.durationMs).toBe('number');
      expect(typeof record.timestamp).toBe('string');
    });

    test('ESM happy path: globalName absent returns the namespace default and audits loaded/esm', async () => {
      mockEsmImport();
      const mod = await loader.loadRuntimeDescriptor(esmDescriptor());
      expect(mod).toBe(extModule);
      const record = lastRecord();
      expect(record.status).toBe('loaded');
      expect(record.format).toBe('esm');
      expect(record.resolvedUrl).toBe('http://localhost/plugins/t.mjs');
    });

    test('globalName set but the script never assigns the global: import-error, NO .default fallback', async () => {
      // The namespace DOES have a default export; strict UMD lookup must not use it.
      mockEsmImport();
      const mod = await loader.loadRuntimeDescriptor(umdDescriptor());
      expect(mod).toBeNull();
      expect(lastRecord().status).toBe('import-error');
      expect(lastRecord().format).toBe('umd');
      expect(lastRecord().error).toMatch(/output\.library\.name/);
    });

    test('globalName absent but only a window global was assigned: import-error, NO window[packageName] fallback', async () => {
      // A UMD build loaded through an ESM descriptor: global gets set, namespace
      // has no default. Strict ESM lookup must not consult window[packageName].
      mockUmdImport();
      const mod = await loader.loadRuntimeDescriptor(esmDescriptor());
      expect(mod).toBeNull();
      expect(lastRecord().status).toBe('import-error');
      expect(lastRecord().format).toBe('esm');
      expect(lastRecord().error).toMatch(/no default export/);
    });
  });

  describe('Mode bare-name cache resolution (the task-6 scenario)', () => {
    test('resolveRuntimeModule returns the SAME object loadRuntimeDescriptor produced', async () => {
      // appInit loads the app-config descriptor -> runtimeModules.set; later a
      // bundled mode's route mounts and Mode.tsx calls loadModules with the BARE
      // package name (extensionDependencies keys). The generated string branch
      // has no static `if` for runtime packages, so it consults
      // resolveRuntimeModule — a cache hit, not a bare-specifier import that
      // would reject the Promise.all and leave the mode blank.
      mockUmdImport();
      const mod = await loader.loadRuntimeDescriptor(umdDescriptor());
      expect(loader.resolveRuntimeModule(PKG)).toBe(mod);
    });

    test('unknown bare names are not in the cache', async () => {
      expect(loader.resolveRuntimeModule('@never/loaded')).toBeUndefined();
    });

    test('idempotent: a second load for the same packageName does not import again', async () => {
      mockUmdImport();
      const first = await loader.loadRuntimeDescriptor(umdDescriptor());
      const second = await loader.loadRuntimeDescriptor(umdDescriptor());
      expect(second).toBe(first);
      expect(window.browserImportFunction.mock.calls.length).toBe(1);
      expect(audit().length).toBe(1); // no duplicate audit record either
    });
  });

  describe('origin allowlist', () => {
    test('cross-origin without allowlist: refused-origin, returns null, nothing imported', async () => {
      const mod = await loader.loadRuntimeDescriptor(
        umdDescriptor({ importPath: 'https://evil.example.com/x.js' })
      );
      expect(mod).toBeNull();
      expect(lastRecord().status).toBe('refused-origin');
      expect(window.browserImportFunction).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('protocol-relative importPath resolves to its real cross-origin and is refused', async () => {
      const mod = await loader.loadRuntimeDescriptor(
        umdDescriptor({ importPath: '//evil.example.com/x.js' })
      );
      expect(mod).toBeNull();
      expect(lastRecord().status).toBe('refused-origin');
      expect(lastRecord().resolvedUrl).toBe('http://evil.example.com/x.js');
    });
  });

  describe('integrity (allowlisted cross-origin)', () => {
    const CDN_URL = 'https://cdn.example.com/plugins/t.umd.js';
    const scriptBytes = Buffer.from(`window["${PKG}"] = { id: "${PKG}" };`);
    const goodIntegrity =
      'sha384-' + nodeCrypto.createHash('sha384').update(scriptBytes).digest('base64');

    const allowCdn = () => {
      window.__ohif = { runtimeExtensionOrigins: ['https://cdn.example.com'] };
    };
    const mockFetchScript = () => {
      global.fetch.mockResolvedValue({
        ok: true,
        arrayBuffer: async () =>
          scriptBytes.buffer.slice(
            scriptBytes.byteOffset,
            scriptBytes.byteOffset + scriptBytes.byteLength
          ),
      });
    };

    test('cross-origin without integrity is integrity-failed (required), before any fetch/import', async () => {
      allowCdn();
      const mod = await loader.loadRuntimeDescriptor(umdDescriptor({ importPath: CDN_URL }));
      expect(mod).toBeNull();
      expect(lastRecord().status).toBe('integrity-failed');
      expect(lastRecord().error).toMatch(/integrity is required/);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(window.browserImportFunction).not.toHaveBeenCalled();
    });

    test('correct sha384 integrity: fetch -> digest -> blob import -> loaded, blob URL revoked', async () => {
      allowCdn();
      mockFetchScript();
      mockUmdImport();
      const mod = await loader.loadRuntimeDescriptor(
        umdDescriptor({ importPath: CDN_URL, integrity: goodIntegrity })
      );
      expect(mod).toBe(extModule);
      expect(lastRecord().status).toBe('loaded');
      expect(lastRecord().resolvedUrl).toBe(CDN_URL);
      expect(global.fetch).toHaveBeenCalledWith(CDN_URL, { mode: 'cors' });
      expect(window.browserImportFunction).toHaveBeenCalledWith('blob:http://localhost/mock-blob');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/mock-blob');
    });

    test('wrong hash: integrity-failed, module never evaluated', async () => {
      allowCdn();
      mockFetchScript();
      mockUmdImport();
      const mod = await loader.loadRuntimeDescriptor(
        umdDescriptor({
          importPath: CDN_URL,
          integrity: 'sha384-' + Buffer.alloc(48).toString('base64'),
        })
      );
      expect(mod).toBeNull();
      expect(lastRecord().status).toBe('integrity-failed');
      expect(window.browserImportFunction).not.toHaveBeenCalled();
    });
  });

  describe('coreVersionRange gate', () => {
    test("'^3.0.0' with prerelease host 3.13.0-beta.89 loads (includePrerelease)", async () => {
      mockUmdImport();
      const mod = await loader.loadRuntimeDescriptor(umdDescriptor({ coreVersionRange: '^3.0.0' }));
      expect(mod).toBe(extModule);
      expect(lastRecord().status).toBe('loaded');
      expect(lastRecord().requiredRange).toBe('^3.0.0');
    });

    test("'>=4.0.0' is version-mismatch, fail-closed BEFORE import", async () => {
      mockUmdImport();
      const mod = await loader.loadRuntimeDescriptor(
        umdDescriptor({ coreVersionRange: '>=4.0.0' })
      );
      expect(mod).toBeNull();
      const record = lastRecord();
      expect(record.status).toBe('version-mismatch');
      expect(record.hostVersion).toBe('3.13.0-beta.89');
      expect(record.requiredRange).toBe('>=4.0.0');
      expect(window.browserImportFunction).not.toHaveBeenCalled();
    });
  });

  describe('id contract', () => {
    test("the module's id must equal packageName", async () => {
      window.browserImportFunction.mockImplementation(async () => {
        window[PKG] = { id: '@wrong/id' };
        return {};
      });
      const mod = await loader.loadRuntimeDescriptor(umdDescriptor());
      expect(mod).toBeNull();
      expect(lastRecord().status).toBe('import-error');
      expect(lastRecord().error).toMatch(/"@wrong\/id" must equal packageName/);
    });
  });

  describe('styles', () => {
    test('descriptor styles are appended as stylesheet links and never duplicated', async () => {
      mockUmdImport();
      await loader.loadRuntimeDescriptor(umdDescriptor({ styles: ['/plugins/t.css'] }));
      const selector = 'link[rel="stylesheet"][href="http://localhost/plugins/t.css"]';
      expect(document.head.querySelectorAll(selector).length).toBe(1);

      // Second load through a FRESH module instance (empty cache, so injectStyles
      // runs again against the same document): still exactly one link.
      jest.resetModules();
      const freshLoader = require('./runtimeExtensionLoader');
      mockUmdImport();
      await freshLoader.loadRuntimeDescriptor(umdDescriptor({ styles: ['/plugins/t.css'] }));
      expect(document.head.querySelectorAll(selector).length).toBe(1);
    });
  });

  describe('loadExternalModule audit + failure surfacing', () => {
    test('cross-origin non-allowlisted URL rejects AND pushes a refused-origin audit record', async () => {
      await expect(
        loader.loadExternalModule('https://evil.example.com/x.js')
      ).rejects.toThrow(/not allowlisted/);
      const record = lastRecord();
      expect(record.status).toBe('refused-origin');
      expect(record.packageName).toBe('https://evil.example.com/x.js');
      expect(record.resolvedUrl).toBe('https://evil.example.com/x.js');
    });

    test("recordRegistrationError flips the latest 'loaded' record", async () => {
      mockUmdImport();
      await loader.loadRuntimeDescriptor(umdDescriptor());
      expect(lastRecord().status).toBe('loaded');
      loader.recordRegistrationError(PKG, new Error('modeFactory blew up'));
      expect(lastRecord().status).toBe('registration-error');
      expect(lastRecord().error).toBe('modeFactory blew up');
    });

    test('reconcileRuntimeRegistrations flips a loaded-but-unregistered descriptor to registration-error', async () => {
      mockUmdImport();
      await loader.loadRuntimeDescriptor(umdDescriptor());
      expect(lastRecord().status).toBe('loaded');
      // Descriptor is in the config yet absent from the registered ids.
      loader.reconcileRuntimeRegistrations(
        { getRegisteredExtensionIds: () => [] },
        [umdDescriptor()]
      );
      expect(lastRecord().status).toBe('registration-error');
    });

    test('reconcileRuntimeRegistrations unwraps [descriptor, config] tuple entries', async () => {
      mockUmdImport();
      await loader.loadRuntimeDescriptor(umdDescriptor());
      expect(lastRecord().status).toBe('loaded');
      // Tuple form: descriptor is entry[0]. Before the unwrap fix this record
      // stayed 'loaded' and its failure was never surfaced.
      loader.reconcileRuntimeRegistrations(
        { getRegisteredExtensionIds: () => [] },
        [[umdDescriptor(), { some: 'config' }]]
      );
      expect(lastRecord().status).toBe('registration-error');
    });

    test('reconcileRuntimeRegistrations leaves a registered descriptor as loaded', async () => {
      mockUmdImport();
      await loader.loadRuntimeDescriptor(umdDescriptor());
      loader.reconcileRuntimeRegistrations(
        { getRegisteredExtensionIds: () => [PKG] },
        [[umdDescriptor(), { some: 'config' }]]
      );
      expect(lastRecord().status).toBe('loaded');
    });

    test('surfaceRuntimeExtensionFailures shows one error toast per failure, exactly once', async () => {
      await loader.loadRuntimeDescriptor(
        umdDescriptor({ importPath: 'https://evil.example.com/x.js' })
      );
      mockUmdImport();
      await loader.loadRuntimeDescriptor(umdDescriptor()); // loaded: must NOT surface
      const show = jest.fn();
      loader.surfaceRuntimeExtensionFailures({ show });
      expect(show).toHaveBeenCalledTimes(1);
      expect(show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('refused-origin'),
        })
      );
      expect(audit()[0].surfaced).toBe(true);

      // Safe to call repeatedly: already-surfaced failures produce 0 new toasts.
      loader.surfaceRuntimeExtensionFailures({ show });
      expect(show).toHaveBeenCalledTimes(1);
    });
  });
});
