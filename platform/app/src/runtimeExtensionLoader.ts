// Runtime plugin loading helpers, imported by the generated pluginImports.js
// (codegen in platform/app/.rspack/writePluginImportsFile.js — both build
// pipelines regenerate that file from the same codegen, so they share this
// module). This module is the single gate for the loadModule URL fallthrough;
// the runtime-descriptor loader extends this file later.

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
  return [window.location.origin, ...extra];
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

/**
 * Fallthrough loader consumed by the generated loadModule for module
 * specifiers that are not declared in pluginConfig.json.
 *
 * Only URL-shaped specifiers pass, and their origin must be allowlisted
 * (same-origin is implicit). Resolving against window.location.href makes
 * protocol-relative specifiers ('//evil.example.com/x.js', which pass the
 * startsWith('/') check) resolve to their real cross-origin and get denied.
 * Unknown bare names fail fast with a descriptive error instead of reaching
 * import('@typo/name') and dying with the browser's cryptic
 * "Failed to resolve module specifier"; data:/blob: URIs are not URL-like
 * here and are refused by the same throw.
 */
export async function loadExternalModule(module: string): Promise<unknown> {
  if (!isUrlLike(module)) {
    throw new Error(
      `OHIF plugin loader: unknown module "${module}". It is not a plugin name ` +
        'declared in pluginConfig.json and it is not a URL. Build-time plugins must be added ' +
        'to pluginConfig.json (then rebuild); runtime plugins must be URL strings or ' +
        'descriptors in window.config.extensions / window.config.modes.'
    );
  }
  const resolved = new URL(module, window.location.href);
  if (!isAllowedRuntimeOrigin(resolved)) {
    throw new Error(
      `OHIF plugin loader: refusing to load plugin code from "${resolved.href}": ` +
        `origin "${resolved.origin}" is not allowlisted. Same-origin is always allowed; ` +
        'to allow this origin add it to window.config.runtimeExtensionOrigins in ' +
        `app-config.js, e.g. runtimeExtensionOrigins: ["${resolved.origin}"].`
    );
  }
  return (await (window as any).browserImportFunction(module)).default;
}
