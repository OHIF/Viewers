import { compileExpression } from '@cornerstonejs/metadata';
import type { SplitRuleSet, SplitRuleSetEntry } from '@cornerstonejs/metadata';

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
 *
 * The rules are a keyed {@link SplitRuleSet}: the key is the rule id, and
 * `priority` sets the evaluation order (`null` turns the rule off). An entry
 * with an invalid priority is dropped with a warning here, rather than left for
 * the engine, which throws on it - one bad customization layer must not stop
 * display set creation for every series.
 *
 * @returns a rule set the engine accepts, with the same keys and priorities.
 */
export function normalizeSplitRules(ruleSet: SplitRuleSet): SplitRuleSet {
  const normalized: SplitRuleSet = {};
  if (!ruleSet || typeof ruleSet !== 'object' || Array.isArray(ruleSet)) {
    console.warn(
      'normalizeSplitRules: the splitRules customization must be an object keyed by rule id.',
      ruleSet
    );
    return normalized;
  }
  for (const [id, entry] of Object.entries(ruleSet)) {
    const valid = validEntry(id, entry);
    if (valid && isUsableRule(id, valid)) {
      normalized[id] = normalizeSplitRule(id, valid);
    }
  }
  return normalized;
}

/**
 * The entry as the engine accepts it, or undefined (with a warning) when the
 * engine would reject it.
 */
function validEntry(id: string, entry: SplitRuleSetEntry): SplitRuleSetEntry | undefined {
  if (!entry || typeof entry !== 'object') {
    console.warn(`normalizeSplitRules: dropping split rule '${id}' - the entry is not an object.`);
    return undefined;
  }
  const { priority } = entry;
  if (priority !== null && (typeof priority !== 'number' || !Number.isFinite(priority))) {
    console.warn(
      `normalizeSplitRules: dropping split rule '${id}' - its priority must be a number, or ` +
        `null to turn the rule off. The default rules use the priorities 1..n: use a priority ` +
        `below 0 to run before them, or above 10000 to run after them.`,
      priority
    );
    return undefined;
  }
  if (entry.id !== undefined && entry.id !== id) {
    // The key is the id. Keep the rule under its key rather than drop it: a
    // copied rule that kept its old `id` is still a rule the author wants.
    console.warn(
      `normalizeSplitRules: split rule '${id}' states the id '${entry.id}'. The key is the ` +
        `id, so the rule uses '${id}'. Remove the id from the rule.`
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _statedId, ...rest } = entry;
    return rest;
  }
  return entry;
}

/** Was `key` written by the rule author (as opposed to simply absent)? */
const isAuthored = (rule: SplitRuleSetEntry, key: string) =>
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
 *   EVERY instance, so one typo in a high-priority rule would silently claim
 *   the whole study instead of doing nothing.
 * - a `groupBy` entry that is neither a tag name nor a function reads
 *   `instance[undefined]` for every instance, collapsing them into one group.
 *
 * Dropping the rule keeps the remaining (usually default) rules intact, which
 * degrades to "my custom rule did nothing" — diagnosable — rather than
 * "every series is grouped wrong".
 */
function isUsableRule(ruleId: string, rule: SplitRuleSetEntry): boolean {
  const { matches, groupBy } = rule as Record<string, unknown> & SplitRuleSetEntry;

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

function normalizeSplitRule(id: string, rule: SplitRuleSetEntry): SplitRuleSetEntry {
  let normalized = rule;
  const assign = (key: string, value: unknown) => {
    if (normalized === rule) {
      normalized = { ...rule };
    }
    normalized[key] = value;
  };

  const { matches, series, customAttributes } = rule as Record<string, unknown> & SplitRuleSetEntry;

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
          `normalizeSplitRules: split rule '${id}' has an undefined ` +
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
