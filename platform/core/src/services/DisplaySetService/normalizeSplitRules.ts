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
 */
export function normalizeSplitRules(rules: SplitRule[]): SplitRule[] {
  if (!Array.isArray(rules)) {
    return [];
  }
  return rules.map(normalizeSplitRule);
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
