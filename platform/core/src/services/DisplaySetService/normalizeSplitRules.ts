import type { SplitRule } from '@cornerstonejs/metadata';
import { compileExpression } from '../CustomizationService/expression';

/**
 * Normalizes declaratively-authored split rules (e.g. JSONC URL
 * customizations using `$function` expressions) into the
 * `@cornerstonejs/metadata` `SplitRule` shape.
 *
 * By the time rules arrive here, `{ $function: ... }` markers have already
 * been compiled into closures by the CustomizationService read-time
 * resolution.  This normalization handles the remaining structural
 * differences a data-authored rule may carry:
 *
 * - `matches`: a closure `(instance, context)` (or an expression string,
 *   compiled here as a convenience) — used as-is.
 * - `series`: the engine expects `(context) => SeriesFacts`.  A declarative
 *   rule provides an object map of `factName -> closure | literal`; each
 *   closure is invoked with the series context (`{ instances }`), so bare
 *   `instances` resolves in expressions (e.g.
 *   `minOf(instances, InstanceNumber)`).
 * - `groupBy`: strings (tag names) and closures are both engine-native.
 * - `customAttributes`: the engine expects
 *   `(attributesContext, options) => Record`.  A declarative rule provides an
 *   object map of `attribute -> closure | literal`; each closure is invoked
 *   with `(instance, context)` where `instance` is the group's first instance
 *   (bare DICOM tags resolve) and `context` carries
 *   `{ instances, splitNumber, sopClassUids, viewportTypes }`.
 *
 * Engine-native rules (all-function fields) pass through unchanged.
 *
 * Rules whose `matches` or `groupBy` was authored but did not resolve to
 * something the engine can call are DROPPED — see {@link isUsableRule} for
 * why silently keeping them is the dangerous option.
 */
export function normalizeSplitRules(rules: SplitRule[]): SplitRule[] {
  if (!Array.isArray(rules)) {
    return [];
  }
  return rules.filter(isUsableRule).map(normalizeSplitRule);
}

/** Was `key` written by the rule author (as opposed to simply absent)? */
const isAuthored = (rule: SplitRule, key: string) =>
  Object.prototype.hasOwnProperty.call(rule, key);

/**
 * Rejects rules the split engine would misinterpret.
 *
 * A `{ $function: ... }` marker that fails to compile resolves to `undefined`
 * (CustomizationService warns and keeps reading the rest of the
 * customization).  For most fields that fails closed, but `matches` and
 * `groupBy` fail catastrophically OPEN:
 *
 * - `groupInstancesBySplitRules` treats a rule with no `matches` as matching
 *   EVERY instance, so one typo in a `$unshift`-ed rule would silently claim
 *   the whole study instead of doing nothing.
 * - a `groupBy` entry that is neither a tag name nor a function reads
 *   `instance[undefined]` for every instance, collapsing them into one group.
 *
 * Dropping the rule keeps the remaining (usually default) rules intact, which
 * degrades to "my custom rule did nothing" — diagnosable — rather than
 * "every series is grouped wrong".
 */
function isUsableRule(rule: SplitRule): boolean {
  if (!rule || typeof rule !== 'object') {
    return false;
  }
  const ruleId = (rule as { id?: string }).id ?? '<unnamed>';

  const { matches, groupBy } = rule as Record<string, unknown> & SplitRule;

  if (isAuthored(rule, 'matches') && typeof matches !== 'function' && typeof matches !== 'string') {
    console.warn(
      `normalizeSplitRules: dropping split rule '${ruleId}' - its 'matches' did not resolve to a function ` +
        `(a $function expression that failed to compile?). Keeping it would make the rule match every instance.`,
      matches
    );
    return false;
  }

  if (isAuthored(rule, 'groupBy')) {
    const invalid =
      !Array.isArray(groupBy) ||
      groupBy.some(key => typeof key !== 'string' && typeof key !== 'function');
    if (invalid) {
      console.warn(
        `normalizeSplitRules: dropping split rule '${ruleId}' - its 'groupBy' must be an array of tag names ` +
          `or functions. Keeping it would collapse every instance into one group.`,
        groupBy
      );
      return false;
    }
  }

  return true;
}

function normalizeSplitRule(rule: SplitRule): SplitRule {
  if (!rule || typeof rule !== 'object') {
    return rule;
  }

  let normalized = rule;
  const assign = (key: string, value: unknown) => {
    if (normalized === rule) {
      normalized = { ...rule };
    }
    normalized[key] = value;
  };

  const { matches, series, customAttributes } = rule as Record<string, unknown> & SplitRule;

  if (typeof matches === 'string') {
    assign('matches', compileExpression(matches));
  }

  if (series && typeof series === 'object') {
    const factEntries = Object.entries(series as Record<string, unknown>);
    // An undefined fact is almost always a $function that failed to compile.
    // This one fails closed (`matches` reads the fact and the comparison is
    // false, so the rule simply never fires), so warn rather than drop - but
    // do warn, because "my rule never matches" is otherwise a silent mystery.
    for (const [factName, factValue] of factEntries) {
      if (factValue === undefined) {
        console.warn(
          `normalizeSplitRules: split rule '${(rule as { id?: string }).id ?? '<unnamed>'}' has an undefined ` +
            `series fact '${factName}' - the rule will never match. Check its $function expression.`
        );
      }
    }
    assign('series', (context: { instances: unknown[] }) => {
      const facts: Record<string, unknown> = {};
      for (const [factName, factValue] of factEntries) {
        facts[factName] = typeof factValue === 'function' ? factValue(context) : factValue;
      }
      return facts;
    });
  }

  if (customAttributes && typeof customAttributes === 'object') {
    const attributeEntries = Object.entries(customAttributes as Record<string, unknown>);
    assign(
      'customAttributes',
      (attributesContext: Record<string, unknown>, options: Record<string, unknown>) => {
        const context = { ...attributesContext, ...options };
        const instance =
          (options?.instances as unknown[])?.[0] ?? (attributesContext?.instance as unknown);
        const attributes: Record<string, unknown> = {};
        for (const [attributeName, attributeValue] of attributeEntries) {
          attributes[attributeName] =
            typeof attributeValue === 'function'
              ? attributeValue(instance, context)
              : attributeValue;
        }
        return attributes;
      }
    );
  }

  return normalized;
}
