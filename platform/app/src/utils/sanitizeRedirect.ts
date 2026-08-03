/**
 * Returns the given redirect target only when it resolves to the provided
 * origin; otherwise returns undefined so callers fall back to the configured
 * post-logout destination.
 */
export function sanitizeSameOriginRedirect(
  value: string | null,
  origin: string
): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) {
      return undefined;
    }
    return url.href;
  } catch {
    return undefined;
  }
}
