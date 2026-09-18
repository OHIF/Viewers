import type { CustomizationUrlPolicy } from './customizationUrlDefaults';
import { DEFAULT_PREFIX } from './customizationUrlDefaults';

export interface ValidatedCustomization {
  raw: string;
  normalized: string;
  prefix: string;
  name: string;
}

export interface ValidationResult {
  valid: ValidatedCustomization[];
  rejected: { raw: string; reason: string }[];
}

const FULL_URL_REGEX = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * Fully percent-decode a customization value so validation runs against the
 * string the URL parser (used by `import()`) ultimately resolves — not the
 * escaped form. This is what blocks encoded traversal such as `%2e%2e`
 * (decodes to `..`) or `%2f` (decodes to `/`): the WHATWG URL parser treats
 * `%2e%2e` as a `..` path segment and would otherwise let a value escape the
 * configured prefix directory.
 *
 * Returns the stable decoded string, or `null` when the value is malformed
 * (invalid escape), still contains a literal `%` after decoding, or nests
 * encoding too deeply to settle. Legitimate customization names are plain
 * identifiers/paths and never need percent-encoding, so rejecting these is safe.
 */
export function fullyDecodeValue(value: string): string | null {
  let current = value;
  for (let i = 0; i < 5; i++) {
    if (!current.includes('%')) {
      return current;
    }
    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      return null;
    }
    if (decoded === current) {
      // Stable but still contains a literal `%`; treat as unsafe.
      return null;
    }
    current = decoded;
  }
  return null;
}

export function parseCustomizationParams(
  params: URLSearchParams,
  paramKey = 'customization'
): string[] {
  const out: string[] = [];
  const keys = Array.from(new Set(params.keys()));
  for (const key of keys) {
    if (key.toLowerCase() !== paramKey.toLowerCase()) {
      continue;
    }
    for (const raw of params.getAll(key)) {
      if (!raw) continue;
      for (const piece of raw.split(',')) {
        const trimmed = piece.trim();
        if (trimmed) {
          out.push(trimmed);
        }
      }
    }
  }
  return out;
}

/**
 * Splits a customization value into its prefix and name.
 *
 * - A value with **no leading slash** uses the special `default` prefix and the
 *   whole value is the name (e.g. `abc/def` -> prefix `default`, name `abc/def`).
 * - A value with a **leading slash** is matched against its first `/segment/`,
 *   which becomes the prefix (slashes included), and the remainder is the name
 *   (e.g. `/remote/def` -> prefix `/remote/`, name `def`). This is why every
 *   prefix other than `default` must start and end with a slash.
 *
 * Returns `null` when there is no usable name part.
 */
export function splitPrefixAndName(
  value: string
): { prefix: string; name: string } | null {
  if (!value) {
    return null;
  }
  if (!value.startsWith('/')) {
    return { prefix: DEFAULT_PREFIX, name: value };
  }
  const rest = value.slice(1);
  const slashIdx = rest.indexOf('/');
  if (slashIdx <= 0) {
    return null;
  }
  const segment = rest.slice(0, slashIdx);
  const name = rest.slice(slashIdx + 1);
  if (!segment || !name) {
    return null;
  }
  return { prefix: `/${segment}/`, name };
}

function buildNormalized(prefix: string, name: string): string {
  return prefix === DEFAULT_PREFIX ? `/${DEFAULT_PREFIX}/${name}` : `${prefix}${name}`;
}

export function normalizeCustomizationValue(value: string): string | null {
  if (!value) {
    return null;
  }
  const split = splitPrefixAndName(value.trim());
  if (!split) {
    return null;
  }
  return buildNormalized(split.prefix, split.name);
}

function hasUnsafeNameSegments(name: string): boolean {
  if (!name.trim()) {
    return true;
  }
  return name.split('/').some(seg => !seg || seg === '.' || seg === '..' || seg.includes('..'));
}

export function validateCustomizationRequests(
  raws: string[],
  policy: CustomizationUrlPolicy
): ValidationResult {
  const result: ValidationResult = { valid: [], rejected: [] };
  const prefixes = policy.prefixes || {};

  for (const raw of raws) {
    // Validate against the fully decoded value so percent-encoded traversal
    // (e.g. `%2e%2e`, `%2f`) cannot slip past the checks below and escape the
    // configured prefix once the URL parser normalizes the import path.
    const decoded = fullyDecodeValue(raw);
    if (decoded === null) {
      result.rejected.push({ raw, reason: 'contains malformed or unsupported percent-encoding' });
      continue;
    }
    if (decoded.includes('..')) {
      result.rejected.push({ raw, reason: 'contains ".." traversal segment' });
      continue;
    }
    if (FULL_URL_REGEX.test(decoded)) {
      result.rejected.push({ raw, reason: 'full URLs are not permitted' });
      continue;
    }

    const split = splitPrefixAndName(decoded.trim());
    if (!split) {
      result.rejected.push({ raw, reason: 'could not be split into a prefix and name' });
      continue;
    }
    const { prefix, name } = split;

    if (!Object.prototype.hasOwnProperty.call(prefixes, prefix)) {
      result.rejected.push({ raw, reason: `unknown prefix "${prefix}"` });
      continue;
    }

    if (hasUnsafeNameSegments(name)) {
      result.rejected.push({ raw, reason: 'invalid or unsafe customization name' });
      continue;
    }

    result.valid.push({ raw, normalized: buildNormalized(prefix, name), prefix, name });
  }

  return result;
}
