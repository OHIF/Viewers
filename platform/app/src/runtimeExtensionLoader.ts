// Runtime plugin loading helpers, imported by the generated pluginImports.js
// (codegen in platform/app/.rspack/writePluginImportsFile.js — both build
// pipelines regenerate that file from the same codegen, so they share this
// module). All descriptor/cache/allowlist/audit logic lives here, testable
// under jest; the codegen only emits per-package static branches. This module
// is the single gate for the loadModule URL fallthrough AND the runtime
// descriptor loader for window.config.extensions / window.config.modes.

import satisfies from 'semver/functions/satisfies';

export interface RuntimeExtensionDescriptor {
  /** MUST equal the extension/mode id exported by the package (settled contract). */
  packageName: string;
  /** Absolute URL, '/rooted' path, or path relative to PUBLIC_URL. */
  importPath: string;
  /**
   * Format discriminator (strict, per the loader behavior matrix in
   * platform/app/.rspack/CONTRACT.md): UMD builds MUST set globalName (normally equal to
   * packageName, matching the plugin build's output.library name) and the
   * loader returns window[globalName]; ESM builds MUST omit it and the loader
   * returns the import() namespace's default export. There is no fallback
   * chain and the loader never defaults globalName to packageName.
   */
  globalName?: string;
  /** semver range checked against process.env.VERSION_NUMBER (fail-closed). */
  coreVersionRange?: string;
  /** 'sha256-…'|'sha384-…'|'sha512-…'; REQUIRED when importPath is cross-origin. */
  integrity?: string;
  /** Stylesheet URLs appended as <link rel="stylesheet">; same allowlist rules. */
  styles?: string[];
}

export type RuntimeExtensionStatus =
  | 'loaded'
  | 'refused-origin'
  | 'integrity-failed'
  | 'version-mismatch'
  | 'import-error'
  | 'registration-error';

export interface RuntimeExtensionAuditRecord {
  packageName: string;
  importPath: string;
  resolvedUrl?: string;
  status: RuntimeExtensionStatus;
  hostVersion: string; // trimmed process.env.VERSION_NUMBER
  requiredRange?: string; // descriptor.coreVersionRange
  /** Derived from the descriptor discriminator: globalName present = 'umd', absent = 'esm'. */
  format?: 'umd' | 'esm';
  error?: string;
  durationMs?: number;
  timestamp: string; // ISO 8601
  surfaced?: boolean; // internal: notification already shown
}

/**
 * Loaded runtime modules keyed by packageName. LOAD-BEARING for Mode.tsx:
 * a bundled mode listing a runtime-loaded extension in extensionDependencies
 * re-resolves it by BARE package name through the generated loadModule, whose
 * string branch consults this cache via resolveRuntimeModule.
 */
const runtimeModules = new Map<string, unknown>();

function getAudit(): RuntimeExtensionAuditRecord[] {
  const w = window as any;
  w.__ohif = w.__ohif || {};
  w.__ohif.runtimeExtensions = w.__ohif.runtimeExtensions || [];
  return w.__ohif.runtimeExtensions;
}

export function isRuntimeDescriptor(x: unknown): x is RuntimeExtensionDescriptor {
  return (
    !!x &&
    typeof x === 'object' &&
    !Array.isArray(x) &&
    typeof (x as any).packageName === 'string' &&
    typeof (x as any).importPath === 'string'
  );
}

/** String-branch cache consulted by generated loadModule (see runtimeModules above). */
export function resolveRuntimeModule(name: string): unknown | undefined {
  return runtimeModules.get(name);
}

/**
 * URL-shaped module specifiers: absolute http(s) URLs or explicit paths.
 * Anything else is treated as a bare package name.
 */
export function isUrlLike(name: string): boolean {
  return (
    name.startsWith('http://') ||
    name.startsWith('https://') ||
    name.startsWith('/') ||
    name.startsWith('./') ||
    name.startsWith('../')
  );
}

/**
 * Origins allowed to serve runtime-loaded plugin code. Same-origin is always
 * allowed; every other origin must be listed in
 * window.config.runtimeExtensionOrigins (array of origin strings).
 * Function-style app configs cannot carry the array on window.config, so the
 * canonical stash window.__ohif.runtimeExtensionOrigins takes precedence.
 */
export function getAllowedRuntimeOrigins(): string[] {
  const w = window as any;
  const configured = w.__ohif?.runtimeExtensionOrigins ?? w.config?.runtimeExtensionOrigins ?? [];
  const extra = Array.isArray(configured) ? configured : [];
  return [window.location.origin, ...extra]; // same-origin implicit, deny-by-default
}

/**
 * Deny-by-default origin allowlist check for runtime-loaded plugin code.
 * Allowlist entries are normalized through new URL(...) so a full URL entry
 * (e.g. 'https://cdn.example.com/some/path') allowlists that origin; ports
 * are part of the origin; malformed entries are skipped, never fatal.
 */
export function isAllowedRuntimeOrigin(url: URL): boolean {
  return getAllowedRuntimeOrigins().some(entry => {
    try {
      return new URL(entry, window.location.href).origin === url.origin;
    } catch {
      return false;
    }
  });
}

function resolveImportUrl(importPath: string): URL {
  // Matches the codegen's importPath semantics: absolute http(s) and '/rooted'
  // paths pass through; relative paths resolve against PUBLIC_URL
  // (window.PUBLIC_URL is set by the index.html bootstrap). Resolving through
  // an absolute base also makes protocol-relative specifiers
  // ('//evil.example.com/x.js', which pass the startsWith('/') check) resolve
  // to their real cross-origin so the allowlist can deny them.
  const base = new URL((window as any).PUBLIC_URL || '/', window.location.href);
  return new URL(importPath, base);
}

/** Cross-origin path: fetch -> SubtleCrypto digest -> blob URL for import().
 *  CSP caveat: importing the blob URL requires `script-src blob:`; the baseline
 *  deployment CSP does NOT include it — deployments using cross-origin runtime
 *  extensions must extend CSP_HEADER (documented in WS7.8). Server must send CORS. */
async function fetchWithIntegrity(url: URL, integrity: string): Promise<string> {
  const m = /^(sha256|sha384|sha512)-(.+)$/.exec(integrity);
  if (!m) {
    throw Object.assign(new Error(`malformed integrity "${integrity}"`), {
      name: 'IntegrityError',
    });
  }
  const algo = { sha256: 'SHA-256', sha384: 'SHA-384', sha512: 'SHA-512' }[m[1]];
  const response = await fetch(url.href, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`fetch ${url.href} failed: HTTP ${response.status}`);
  }
  const buf = await response.arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest(algo, buf));
  let bin = '';
  for (let i = 0; i < digest.length; i += 0x8000) {
    // chunked: avoid arg-spread stack limits
    bin += String.fromCharCode.apply(null, digest.subarray(i, i + 0x8000) as any);
  }
  if (btoa(bin) !== m[2]) {
    throw Object.assign(new Error('integrity mismatch'), { name: 'IntegrityError' });
  }
  return URL.createObjectURL(new Blob([buf], { type: 'text/javascript' }));
}

function injectStyles(styles: string[] | undefined): void {
  for (const s of styles || []) {
    try {
      const url = resolveImportUrl(s);
      if (!isAllowedRuntimeOrigin(url)) {
        console.error(`OHIF: refusing stylesheet from non-allowlisted origin: ${s}`);
        continue;
      }
      if (document.querySelector(`link[href="${url.href}"]`)) {
        continue;
      }
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url.href;
      document.head.appendChild(link);
    } catch (e) {
      console.error(`OHIF: bad stylesheet URL "${s}"`, e);
    }
  }
}

/** Loads one app-config descriptor. Returns the module or null (never throws):
 *  appInit's registerExtensions catches per-extension and appInit skips null
 *  modes, so a bad plugin cannot take down the app. */
export async function loadRuntimeDescriptor(
  descriptor: RuntimeExtensionDescriptor
): Promise<unknown | null> {
  const { packageName, importPath, globalName, coreVersionRange, integrity, styles } = descriptor;
  if (runtimeModules.has(packageName)) {
    return runtimeModules.get(packageName); // idempotent
  }
  const hostVersion = (process.env.VERSION_NUMBER || '').trim();
  const started = performance.now();
  const record: RuntimeExtensionAuditRecord = {
    packageName,
    importPath,
    status: 'import-error',
    hostVersion,
    requiredRange: coreVersionRange,
    // Strict discriminator (never defaulted): globalName set = UMD, absent = ESM.
    format: globalName ? 'umd' : 'esm',
    timestamp: new Date().toISOString(),
  };
  getAudit().push(record);
  const fail = (status: RuntimeExtensionStatus, message: string): null => {
    record.status = status;
    record.error = message;
    record.durationMs = Math.round(performance.now() - started);
    console.error(`OHIF runtime extension "${packageName}": ${status} — ${message}`);
    return null;
  };
  try {
    let url: URL;
    try {
      url = resolveImportUrl(importPath);
    } catch (_e) {
      // note: babel's regenerator transform (jest pipeline) crashes on an
      // optional catch binding inside async functions, so keep the parameter
      return fail('import-error', `invalid importPath "${importPath}"`);
    }
    record.resolvedUrl = url.href;
    if (!isAllowedRuntimeOrigin(url)) {
      return fail(
        'refused-origin',
        `origin "${url.origin}" is not allowlisted; add it to window.config.runtimeExtensionOrigins`
      );
    }
    if (coreVersionRange && !satisfies(hostVersion, coreVersionRange, { includePrerelease: true })) {
      return fail(
        'version-mismatch',
        `host ${hostVersion} does not satisfy required range ${coreVersionRange}`
      );
    }
    let imported: any;
    const crossOrigin = url.origin !== window.location.origin;
    if (crossOrigin) {
      if (!integrity) {
        return fail('integrity-failed', 'integrity is required for cross-origin runtime extensions');
      }
      const blobUrl = await fetchWithIntegrity(url, integrity);
      try {
        imported = await (window as any).browserImportFunction(blobUrl);
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    } else {
      // same-origin skip: no integrity verification; direct dynamic import
      imported = await (window as any).browserImportFunction(url.href);
    }
    // STRICT format discriminator (loader behavior matrix, platform/app/.rspack/CONTRACT.md):
    // UMD (globalName set): the wrapper sees no exports/define and assigns
    // self[library.name]; with output.library = { name, export: 'default' }
    // the global IS the default export — return window[globalName], nothing else.
    // ESM (globalName absent): return the import() namespace's default export,
    // never a window global. No fallback chain in either direction.
    let mod: any;
    if (globalName) {
      mod = (window as any)[globalName];
      if (mod === undefined) {
        return fail(
          'import-error',
          `script evaluated but window["${globalName}"] was not defined; UMD plugins must ` +
            'set output.library.name to the descriptor globalName (ESM plugins omit globalName)'
        );
      }
    } else {
      mod = imported?.default;
      if (mod === undefined) {
        return fail(
          'import-error',
          'module evaluated but has no default export; ESM plugins must default-export their ' +
            'extension/mode (UMD plugins must set globalName in the descriptor)'
        );
      }
    }
    if (mod && typeof mod === 'object' && mod.default?.id) {
      mod = mod.default;
    }
    if (!mod) {
      return fail(
        'import-error',
        `script evaluated but no usable module was found for "${globalName || packageName}"`
      );
    }
    if (mod.id && mod.id !== packageName) {
      return fail(
        'import-error',
        `extension/mode id "${mod.id}" must equal packageName "${packageName}"`
      );
    }
    injectStyles(styles);
    runtimeModules.set(packageName, mod);
    record.status = 'loaded';
    record.durationMs = Math.round(performance.now() - started);
    return mod;
  } catch (e: any) {
    return fail(
      e?.name === 'IntegrityError' ? 'integrity-failed' : 'import-error',
      e?.message || String(e)
    );
  }
}

/**
 * Gated URL fallthrough consumed by the generated loadModule for module
 * specifiers that are not declared in pluginConfig.json (the WS2 shared
 * helper, replacing the previous ungated browserImportFunction fallthrough).
 * Pushes audit records so failures here also surface. Throws on refusal or
 * failure (preserves the fallthrough failure semantics for peerImport callers).
 *
 * Only URL-shaped specifiers pass, and their origin must be allowlisted
 * (same-origin is implicit). Unknown bare names fail fast with a descriptive
 * error instead of reaching import('@typo/name') and dying with the browser's
 * cryptic "Failed to resolve module specifier"; data:/blob: URIs are not
 * URL-like here and are refused by the same throw.
 */
export async function loadExternalModule(specifier: string): Promise<unknown> {
  const record: RuntimeExtensionAuditRecord = {
    packageName: specifier,
    importPath: specifier,
    status: 'import-error',
    hostVersion: (process.env.VERSION_NUMBER || '').trim(),
    timestamp: new Date().toISOString(),
  };
  if (!isUrlLike(specifier)) {
    record.error =
      `unknown module "${specifier}": not a plugin name declared in pluginConfig.json and not a URL`;
    getAudit().push(record);
    throw new Error(
      `OHIF plugin loader: unknown module "${specifier}". It is not a plugin name ` +
        'declared in pluginConfig.json and it is not a URL. Build-time plugins must be added ' +
        'to pluginConfig.json (then rebuild); runtime plugins must be URL strings or ' +
        'descriptors in window.config.extensions / window.config.modes.'
    );
  }
  const resolved = resolveImportUrl(specifier);
  record.resolvedUrl = resolved.href;
  if (!isAllowedRuntimeOrigin(resolved)) {
    record.status = 'refused-origin';
    record.error = `origin "${resolved.origin}" is not allowlisted`;
    getAudit().push(record);
    throw new Error(
      `OHIF plugin loader: refusing to load plugin code from "${resolved.href}": ` +
        `origin "${resolved.origin}" is not allowlisted. Same-origin is always allowed; ` +
        'to allow this origin add it to window.config.runtimeExtensionOrigins in ' +
        `app-config.js, e.g. runtimeExtensionOrigins: ["${resolved.origin}"].`
    );
  }
  try {
    return (await (window as any).browserImportFunction(specifier)).default;
  } catch (e: any) {
    record.error = e?.message || String(e);
    getAudit().push(record);
    throw e;
  }
}

/** Flip 'loaded' -> 'registration-error' for runtime extensions that never made it
 *  into the ExtensionManager (its registerExtensions swallows per-extension errors
 *  with console.error, so we diff afterwards). */
export function reconcileRuntimeRegistrations(
  extensionManager: { getRegisteredExtensionIds(): string[] },
  configEntries: unknown[]
): void {
  // Runtime descriptors reach appConfig.extensions either bare or as a
  // [descriptor, config] tuple (the generated loadModule handles both), so
  // unwrap the tuple form before matching or a load-ok-but-register-failed
  // tuple never gets flipped to 'registration-error'.
  const descriptorNames = new Set(
    (configEntries || [])
      .map(entry => (Array.isArray(entry) ? entry[0] : entry))
      .filter(isRuntimeDescriptor)
      .map(d => d.packageName)
  );
  const registered = new Set(extensionManager.getRegisteredExtensionIds());
  for (const record of getAudit()) {
    if (
      record.status === 'loaded' &&
      descriptorNames.has(record.packageName) &&
      !registered.has(record.packageName)
    ) {
      record.status = 'registration-error';
      record.error = record.error || 'extension loaded but failed to register (see console)';
    }
  }
}

/** Used by Mode.tsx where registration is per-extension and not swallowed. */
export function recordRegistrationError(packageName: string, error: unknown): void {
  const audit = getAudit() as any;
  const record: RuntimeExtensionAuditRecord | undefined =
    audit.findLast?.((r: RuntimeExtensionAuditRecord) => r.packageName === packageName) ??
    [...getAudit()].reverse().find(r => r.packageName === packageName);
  if (record) {
    record.status = 'registration-error';
    record.error = (error as any)?.message || String(error);
  }
}

/** Show one error toast per unsurfaced failure. Safe to call repeatedly. */
export function surfaceRuntimeExtensionFailures(uiNotificationService?: {
  show(n: object): unknown;
}): void {
  if (!uiNotificationService?.show) {
    return;
  }
  for (const record of getAudit()) {
    if (record.status === 'loaded' || record.surfaced) {
      continue;
    }
    record.surfaced = true;
    uiNotificationService.show({
      title: 'Plugin failed to load',
      message:
        `${record.packageName}: ${record.status}` +
        `${record.error ? ` — ${record.error}` : ''}` +
        ` (host ${record.hostVersion}${record.requiredRange ? `, requires ${record.requiredRange}` : ''})`,
      type: 'error',
      autoClose: false,
    });
  }
}
