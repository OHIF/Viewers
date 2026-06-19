import type { CustomizationUrlPolicy } from './customizationUrlDefaults';
import type { ValidatedCustomization } from './validate';

const ABSOLUTE_URL_REGEX = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

// Used only to parse same-origin/relative paths into a comparable URL. Any
// host works since we compare origin + pathname against the base built the
// same way; it is never part of the returned value.
const PARSE_BASE = 'https://ohif.invalid';

function getViewerPublicUrl(): string {
  if (typeof window === 'undefined') {
    return '/';
  }
  return (window as any).PUBLIC_URL || '/';
}

/**
 * Defense-in-depth containment check on the *final* resolved string. We parse
 * both the resolved URL and its configured base directory with the same URL
 * parser that `import()` uses — which collapses `.`/`..`/`%2e%2e` path segments
 * — and require the result to stay within the base directory. Validation should
 * already have rejected traversal, but parsing the final string here guarantees
 * a module can never load outside its allowlisted prefix even if an earlier
 * check is bypassed.
 */
function assertWithinBase(
  finalUrl: string,
  baseDirUrl: string,
  request: ValidatedCustomization
): void {
  let resolved: URL;
  let baseDir: URL;
  try {
    resolved = new URL(finalUrl, PARSE_BASE);
    baseDir = new URL(baseDirUrl, PARSE_BASE);
  } catch {
    throw new Error(`Customization URL could not be parsed for "${request.raw}"`);
  }
  const baseDirPath = baseDir.pathname.endsWith('/') ? baseDir.pathname : `${baseDir.pathname}/`;
  const within = resolved.origin === baseDir.origin && resolved.pathname.startsWith(baseDirPath);
  if (!within) {
    throw new Error(`Customization "${request.raw}" escapes its configured prefix directory`);
  }
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
    assertWithinBase(joined, baseWithSlash, request);
    return joined;
  }

  const origin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const publicUrl = getViewerPublicUrl();
  const root = publicUrl?.startsWith('/') ? publicUrl : `/${publicUrl || ''}`;
  const strip = (value: string): string =>
    value.startsWith('./') ? value.slice(2) : value.startsWith('/') ? value.slice(1) : value;
  const relative = strip(joined);
  const relativeBase = strip(baseWithSlash);
  const rootWithSlash = root.endsWith('/') ? root : `${root}/`;
  const path = `${rootWithSlash}${relative}`;
  const baseDirPath = `${rootWithSlash}${relativeBase}`;

  const finalUrl = origin ? `${origin}${path}` : path;
  assertWithinBase(finalUrl, origin ? `${origin}${baseDirPath}` : baseDirPath, request);
  return finalUrl;
}
