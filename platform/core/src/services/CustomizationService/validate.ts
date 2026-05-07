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

export function normalizeCustomizationValue(value: string): string | null {
  if (!value) return null;
  let v = value.trim();
  if (!v) return null;
  if (!v.startsWith('/')) {
    v = `/${DEFAULT_PREFIX}/${v}`;
  }
  const parts = v.split('/').filter(Boolean);
  if (parts.length < 2) {
    return null;
  }
  return `/${parts.join('/')}`;
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
    if (raw.includes('..')) {
      result.rejected.push({ raw, reason: 'contains ".." traversal segment' });
      continue;
    }
    if (FULL_URL_REGEX.test(raw)) {
      result.rejected.push({ raw, reason: 'full URLs are not permitted' });
      continue;
    }

    const normalized = normalizeCustomizationValue(raw);
    if (!normalized) {
      result.rejected.push({ raw, reason: 'could not be normalized to /prefix/name form' });
      continue;
    }

    const parts = normalized.split('/').filter(Boolean);
    const prefix = parts[0];
    const name = parts.slice(1).join('/');

    if (!Object.prototype.hasOwnProperty.call(prefixes, prefix)) {
      result.rejected.push({ raw, reason: `unknown prefix "${prefix}"` });
      continue;
    }

    if (hasUnsafeNameSegments(name)) {
      result.rejected.push({ raw, reason: 'invalid or unsafe customization name' });
      continue;
    }

    result.valid.push({ raw, normalized, prefix, name });
  }

  return result;
}
