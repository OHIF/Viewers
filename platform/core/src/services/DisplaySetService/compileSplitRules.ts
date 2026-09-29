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
 * `{ expression }`, series facts, custom attribute recipes), or a rule that
 * code has already compiled.
 */
export type SplitRuleCustomizationEntry = RawSplitRule | SplitRuleSetEntry;

/** The rule fields that hold behaviour, and so tell raw data from a compiled rule. */
const BEHAVIOUR_FIELDS = [
  'matches',
  'groupBy',
  'runBy',
  'series',
  'compareInstances',
  'customAttributes',
];

/**
 * Is this entry a rule that code has already compiled? A mode or an extension
 * written in TypeScript can supply plain functions; the compiler only accepts
 * data, so such an entry is passed through as it is.
 */
function isCompiledRule(entry: object): boolean {
  return BEHAVIOUR_FIELDS.some(field => {
    const value = entry[field];
    return (
      typeof value === 'function' ||
      (Array.isArray(value) && value.some(part => typeof part === 'function'))
    );
  });
}

/**
 * Compiles the `useMetadataDisplaySet.splitRules` customization into the
 * `SplitRuleSet` the split engine takes.
 *
 * Raw entries are compiled by the `@cornerstonejs/metadata`
 * `createDisplaySetSplitRules` - there is no OHIF rule language. `options`
 * supplies the named extension points the rules reference, for example the
 * `stackImage` classifier of `@ohif/extension-default`.
 *
 * Each entry is compiled on its own. An entry that the compiler rejects - an
 * unknown classifier, an invalid expression, a missing or non-numeric priority
 * - is dropped with a warning, and the other rules stay in charge. One bad
 * customization layer therefore degrades to "my rule did nothing" rather than
 * stopping display set creation for every series.
 *
 * @returns a rule set with the same keys and priorities, without the dropped
 *   entries.
 */
export function compileSplitRules(
  ruleSet: Record<string, SplitRuleCustomizationEntry>,
  options: CreateDisplaySetSplitRulesOptions = {}
): SplitRuleSet {
  const compiled: SplitRuleSet = {};
  if (!ruleSet || typeof ruleSet !== 'object' || Array.isArray(ruleSet)) {
    console.warn(
      'compileSplitRules: the splitRules customization must be an object keyed by rule id.',
      ruleSet
    );
    return compiled;
  }

  for (const [id, entry] of Object.entries(ruleSet)) {
    if (!entry || typeof entry !== 'object') {
      console.warn(`compileSplitRules: dropping split rule '${id}' - the entry is not an object.`);
      continue;
    }
    try {
      if (isCompiledRule(entry)) {
        // Validates the priority and the id the same way the compiler does.
        createDisplaySetSplitRules({ [id]: { priority: entry.priority, id: entry.id } });
        compiled[id] = entry as SplitRuleSetEntry;
      } else {
        compiled[id] = createDisplaySetSplitRules({ [id]: entry as RawSplitRule }, options)[id];
      }
    } catch (error) {
      console.warn(
        `compileSplitRules: dropping split rule '${id}' - ${(error as Error).message}. ` +
          `The default rules use the priorities 1..n: use a priority below 0 to run before ` +
          `them, above 10000 to run after them, or null to turn a rule off.`
      );
    }
  }
  return compiled;
}
