import type { CustomizationUrlPolicy } from './customizationUrlDefaults';
import type { ValidatedCustomization } from './validate';

const ABSOLUTE_URL_REGEX = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

function getViewerPublicUrl(): string {
  if (typeof window === 'undefined') {
    return '/';
  }
  return (window as any).PUBLIC_URL || '/';
}

export function resolveCustomizationUrl(
  request: ValidatedCustomization,
  policy: CustomizationUrlPolicy
): string {
  const prefixes = policy.prefixes || {};
  const base = prefixes[request.prefix];
  if (!base) {
    throw new Error(`Unknown customization prefix: ${request.prefix}`);
  }
  if (request.name.includes('..')) {
    throw new Error(`Customization name contains traversal: ${request.name}`);
  }

  const fileName = request.name.endsWith('.js') ? request.name : `${request.name}.js`;
  const baseWithSlash = base.endsWith('/') ? base : `${base}/`;
  const joined = `${baseWithSlash}${fileName}`;

  if (ABSOLUTE_URL_REGEX.test(base)) {
    return joined;
  }

  const origin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const publicUrl = getViewerPublicUrl();
  const root = publicUrl?.startsWith('/') ? publicUrl : `/${publicUrl || ''}`;
  const relative = joined.startsWith('./') ? joined.slice(2) : joined;
  const rootWithSlash = root.endsWith('/') ? root : `${root}/`;
  const path = `${rootWithSlash}${relative}`;
  return origin ? `${origin}${path}` : path;
}
