import { createDisplaySetSplitRules } from '@cornerstonejs/metadata';
import type {
  CreateDisplaySetSplitRulesOptions,
  RawSplitRule,
  SplitRuleSet,
  SplitRuleSetEntry,
} from '@cornerstonejs/metadata';

/**
 * A `useMetadataDisplaySet.splitRules` entry: raw selector data (the
 * `@cornerstonejs/metadata` safe-function vocabulary - conditions, values,
 * `{ expression }`, series facts, custom attribute recipes), a rule that code
 * has already compiled, or a mix of the two: a function at any function place
 * next to data at the others.
 */
export type SplitRuleCustomizationEntry = RawSplitRule | SplitRuleSetEntry;

/** A rule that did not compile, or a rule set that is not a keyed object. */
export type SplitRuleCompileError = {
  /** The key of the rule in `splitRules`; undefined when the rule set itself is invalid. */
  ruleId?: string;
  /** Why the compiler rejected the entry. */
  message: string;
};

/** What {@link compileSplitRules} returns. */
export type CompiledSplitRules = {
  /**
   * The compiled rules, keyed by rule id. Every function field is wrapped so
   * that a run-time error is a {@link SplitRuleRunError}. When `errors` is not
   * empty, the rule set is incomplete and must not be used (SP-SAFE-7).
   */
  rules: SplitRuleSet;
  /** One entry for each rule that did not compile. Empty when every rule compiled. */
  errors: SplitRuleCompileError[];
};

/** The rule fields that hold behaviour; each is a function once compiled. */
const BEHAVIOUR_FIELDS = [
  'matches',
  'groupBy',
  'runBy',
  'series',
  'compareInstances',
  'customAttributes',
] as const;

/**
 * The error a split rule function throws at run time, with the rule and the
 * field that failed. The display set service adds the series.
 *
 * `field` is a rule field name (`matches`, `runBy`, `series`,
 * `compareInstances`, `customAttributes`), or `groupBy[<index>]` for one part
 * of `groupBy`. `cause` holds the original error.
 */
export class SplitRuleRunError extends Error {
  readonly ruleId: string;
  readonly field: string;
  readonly cause: unknown;

  constructor(ruleId: string, field: string, cause: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    super(`Split rule '${ruleId}' failed in '${field}': ${reason}`);
    this.name = 'SplitRuleRunError';
    this.ruleId = ruleId;
    this.field = field;
    this.cause = cause;
  }
}

/** Wraps one rule function so that an error it throws names the rule and the field. */
function wrapRuleFunction<F extends (...args: unknown[]) => unknown>(
  ruleId: string,
  field: string,
  fn: F
): F {
  return function (this: unknown, ...args: unknown[]) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      if (error instanceof SplitRuleRunError) {
        throw error;
      }
      throw new SplitRuleRunError(ruleId, field, error);
    }
  } as F;
}

/**
 * Returns a copy of a compiled entry with every function field wrapped by
 * {@link wrapRuleFunction}. The engine and the display set factory call the
 * wrapped functions, so an error from any of them - `customAttributes`
 * included, which the factory calls - names the rule and the field.
 */
function wrapRuleFunctions(ruleId: string, entry: SplitRuleSetEntry): SplitRuleSetEntry {
  const wrapped: SplitRuleSetEntry = { ...entry };
  for (const field of BEHAVIOUR_FIELDS) {
    const value = entry[field];
    if (typeof value === 'function') {
      (wrapped as Record<string, unknown>)[field] = wrapRuleFunction(
        ruleId,
        field,
        value as (...args: unknown[]) => unknown
      );
    } else if (field === 'groupBy' && Array.isArray(value)) {
      wrapped.groupBy = value.map((part, index) =>
        typeof part === 'function' ? wrapRuleFunction(ruleId, `groupBy[${index}]`, part) : part
      );
    }
  }
  return wrapped;
}

/**
 * Compiles the `useMetadataDisplaySet.splitRules` customization into the
 * `SplitRuleSet` the split engine takes.
 *
 * Every entry is compiled by the `@cornerstonejs/metadata`
 * `createDisplaySetSplitRules` - there is no OHIF rule language. `options`
 * supplies the named extension points the rules reference, for example the
 * `stackImage` classifier of `@ohif/extension-default`. The compiler keeps a
 * function at a function place as is, so an entry that code has compiled, and
 * an entry that mixes functions with data, go through the same compiler as raw
 * data. No field is left uncompiled because another field is a function.
 *
 * Each entry is compiled on its own (SP-PIPE-3), so that `errors` names every
 * rule that fails - an unknown classifier, an invalid expression, a missing or
 * non-numeric priority, an id that differs from the key, an unsafe id such as
 * `__proto__`. No rule is dropped:
 * a rule set with an error must stop display set creation (SP-SAFE-7), because
 * the rule that failed can be the rule a clinician depends on. The display set
 * service does that stop.
 *
 * Every function field of a compiled rule - from raw data or from code - is
 * wrapped, so that an error at run time is a {@link SplitRuleRunError} that
 * names the rule and the field.
 *
 * @returns the compiled rules with the same keys and priorities, and one error
 *   for each entry that did not compile.
 */
export function compileSplitRules(
  ruleSet: Record<string, SplitRuleCustomizationEntry>,
  options: CreateDisplaySetSplitRulesOptions = {}
): CompiledSplitRules {
  const rules: SplitRuleSet = {};
  const errors: SplitRuleCompileError[] = [];
  if (!ruleSet || typeof ruleSet !== 'object' || Array.isArray(ruleSet)) {
    errors.push({
      message: 'the splitRules customization must be an object keyed by rule id',
    });
    return { rules, errors };
  }

  for (const [id, entry] of Object.entries(ruleSet)) {
    // `rules['__proto__'] = rule` replaces the prototype of `rules` instead of
    // adding the rule, and `JSON.parse` makes `__proto__` a real own key.
    if (id === '__proto__') {
      errors.push({ ruleId: id, message: 'the rule id is not allowed; give the rule another id' });
      continue;
    }
    if (!entry || typeof entry !== 'object') {
      errors.push({ ruleId: id, message: 'the entry is not an object' });
      continue;
    }
    try {
      const compiled = createDisplaySetSplitRules({ [id]: entry as RawSplitRule }, options)[id];
      rules[id] = wrapRuleFunctions(id, compiled);
    } catch (error) {
      errors.push({ ruleId: id, message: (error as Error).message });
    }
  }
  return { rules, errors };
}
