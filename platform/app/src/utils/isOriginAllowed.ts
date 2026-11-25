/**
 * Whether url's origin is in origins. Each entry goes through the URL parser,
 * resolved against the page, so a full-URL entry ('https://cdn.example.com/a/')
 * allows that URL's origin, the port is part of the origin, and a malformed
 * entry is skipped rather than fatal.
 *
 * The two allowlists that decide which code the viewer loads both use it:
 * runtime plugin origins (runtimeExtensionLoader.ts) and dynamic config origins
 * (loadDynamicConfig.js).
 */
export function isOriginAllowed(url: URL, origins: readonly string[]): boolean {
  return origins.some(entry => {
    try {
      return new URL(entry, window.location.href).origin === url.origin;
    } catch {
      return false;
    }
  });
}
