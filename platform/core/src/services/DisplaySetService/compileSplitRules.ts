import { createDisplaySetSplitRules, materializeSplitRules } from '@cornerstonejs/metadata';
import type {
  CreateDisplaySetSplitRulesOptions,
  RawSplitRule,
  SplitRule,
  SplitRuleSet,
} from '@cornerstonejs/metadata';

/**
 * A `useMetadataDisplaySet.displaySetRules` entry: a `@cornerstonejs/metadata` raw
 * rule. A raw field can hold a function at a function place (a whole
 * `matches`, a `groupBy` entry, a `sortBy` entry, `attributes`, ...).
 *
 * A rule that `createDisplaySetSplitRules` has already compiled is not a valid
 * entry: its `series`, `compareInstances` and `customAttributes` fields are
 * not raw fields, so it does not compile again.
 */
export type SplitRuleCustomizationEntry = RawSplitRule;

/** A rule that did not compile, or a registry or an order that is not valid. */
export type SplitRuleCompileError = {
  /** The rule id; undefined when the registry or the order itself is invalid. */
  ruleId?: string;
  /** Why the compiler rejected the entry. */
  message: string;
};

/** What {@link compileSplitRules} returns. */
export type CompiledSplitRules = {
  /**
   * The compiled rules, in rule order. Every function field is wrapped so
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
  'series',
  'compareInstances',
  'customAttributes',
] as const;

/**
 * The error a split rule function throws at run time, with the rule and the
 * field that failed. The display set service adds the series.
 *
 * `field` is a rule field name (`matches`, `series`,
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
function wrapRuleFunctions(ruleId: string, entry: SplitRule): SplitRule {
  const wrapped: SplitRule = { ...entry };
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
 * Compiles the `useMetadataDisplaySet` registry (`displaySetRules`) in the
 * order of `displaySetRuleOrder` into the `SplitRuleSet` the split engine
 * takes. A registry rule that the order does not name is not compiled.
 *
 * Every rule is compiled by the `@cornerstonejs/metadata`
 * `createDisplaySetSplitRules` - there is no OHIF rule language. `options`
 * supplies the context (the `metadataContext` customization) and the named
 * functions the rules reference. The compiler keeps a function at a function
 * place as is, so an entry that mixes functions with data goes through the
 * same compiler as raw data.
 *
 * Each rule is compiled on its own (SP-PIPE-3), so that `errors` names every
 * rule that fails - an unknown name, an invalid expression, an id of the order
 * that is not in the registry, an id that differs from the key, an unsafe id
 * such as `__proto__`. An id that occurs again in the order is the same rule:
 * it keeps its first place, with one warning, as in `materializeSplitRules`. No rule is dropped: a rule set
 * with an error must stop display set creation (SP-SAFE-7), because the rule
 * that failed can be the rule a clinician depends on. The display set service
 * does that stop.
 *
 * Every function field of a compiled rule is wrapped, so that an error at run
 * time is a {@link SplitRuleRunError} that names the rule and the field.
 */
export function compileSplitRules(
  registry: Record<string, SplitRuleCustomizationEntry>,
  order: readonly string[],
  options: CreateDisplaySetSplitRulesOptions = {}
): CompiledSplitRules {
  const rules: SplitRuleSet = [];
  const errors: SplitRuleCompileError[] = [];
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)) {
    errors.push({
      message: 'the displaySetRules customization must be an object keyed by rule id',
    });
  }
  if (!Array.isArray(order)) {
    errors.push({
      message: 'the displaySetRuleOrder customization must be an array of rule ids',
    });
  }
  if (errors.length) {
    return { rules, errors };
  }

  const unique = [...new Set(order)];
  if (unique.length < order.length) {
    const repeated = [...new Set(order.filter((id, index) => order.indexOf(id) !== index))];
    console.warn(
      `displaySetRuleOrder: ${repeated.join(', ')} occurs more than once; the first place is used.`
    );
  }
  for (const id of unique) {
    try {
      // Checks the id against the registry: present, safe, equal to the key.
      const [rule] = materializeSplitRules(registry as Record<string, RawSplitRule>, [id]);
      rules.push(wrapRuleFunctions(id, createDisplaySetSplitRules([rule], options)[0]));
    } catch (error) {
      errors.push({ ruleId: String(id), message: (error as Error).message });
    }
  }
  return { rules, errors };
}
