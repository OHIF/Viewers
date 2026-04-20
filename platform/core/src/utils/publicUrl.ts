/**
 * Normalizes a public URL prefix for static assets (trailing slash, leading slash, slashes).
 * Used for subpath deployments where the app is not served from `/`.
 */
export function normalizePublicUrl(value?: string): string {
  const rawValue = typeof value === 'string' ? value.trim() : '';

  if (!rawValue || rawValue === '.') {
    return '/';
  }

  let normalized = rawValue.replace(/\\/g, '/');

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/{2,}/g, '/');

  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }

  return normalized;
}

export function toRouterBasename(value?: string): string {
  const normalized = normalizePublicUrl(value);
  return normalized === '/' ? '/' : normalized.replace(/\/+$/, '');
}

/**
 * Infers the app base path from `location.pathname` when the app is mounted under a subpath
 * (for example by stripping `/viewer` routes or an `index.html` suffix).
 */
export function getLocationBasePathFromPathname(pathname: string): string {
  const locationPath = typeof pathname === 'string' && pathname.length > 0 ? pathname : '/';
  const lowerPath = locationPath.toLowerCase();
  const viewerIndex = lowerPath.indexOf('/viewer');

  if (viewerIndex >= 0) {
    return normalizePublicUrl(locationPath.substring(0, viewerIndex));
  }

  if (lowerPath.endsWith('/index.html')) {
    return normalizePublicUrl(
      locationPath.substring(0, locationPath.length - '/index.html'.length)
    );
  }

  if (locationPath === '/') {
    return '/';
  }

  const lastSegment = locationPath.substring(locationPath.lastIndexOf('/') + 1);
  if (lastSegment.includes('.')) {
    return normalizePublicUrl(locationPath.substring(0, locationPath.lastIndexOf('/')));
  }

  return normalizePublicUrl(locationPath);
}

/**
 * Runtime public URL used for webpack public path and `window.__OHIF_BASE_PATH__`.
 * Prefer explicit values on `window`; otherwise derive from `location.pathname`.
 */
export function resolveRuntimeBasePathFromWindow(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  const explicitBasePath =
    (window as any).__OHIF_BASE_PATH__ ||
    (window as any).PUBLIC_URL ||
    (window as any).config?.routerBasename;

  if (typeof explicitBasePath === 'string' && explicitBasePath.trim().length > 0) {
    return normalizePublicUrl(explicitBasePath);
  }

  return getLocationBasePathFromPathname(window.location.pathname || '/');
}

/**
 * Resolves a path relative to the runtime public URL (for example `theme` -> `/my-app/theme`).
 */
export function getPublicSubPath(subPath: string): string {
  if (typeof window === 'undefined') {
    const normalizedSubPath = subPath.replace(/^\/+/, '');
    return `/${normalizedSubPath}`;
  }

  const basePath = (window as any).__OHIF_BASE_PATH__ || (window as any).PUBLIC_URL || '/';
  const normalizedBasePath = normalizePublicUrl(basePath);
  const normalizedSubPath = subPath.replace(/^\/+/, '');

  return `${normalizedBasePath}${normalizedSubPath}`;
}
