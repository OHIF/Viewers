/**
 * Policy for the `$function` customization marker.
 *
 * `$function` compiles a safe expression into a callable closure at read time,
 * which is what lets a data-only customization (a JSONC URL module, a JSON app
 * config) declare *behaviour* rather than only values. The expression language
 * is a closed vocabulary with no `eval` — see `@cornerstonejs/metadata`'s
 * `compileExpression` — so a `$function` cannot run arbitrary code.
 *
 * This policy is not about that. It is a **deny list** of attribute paths where
 * a deployment does not want data computing the value, for whatever reason it
 * has. Nothing is denied by default: `$function` is permitted wherever a
 * customization puts it, and a deployment that wants to withhold a particular
 * attribute names it here.
 *
 * Why a deny list rather than an allow list. An allow list has to enumerate
 * every attribute a rule may legitimately compute, and that set is neither
 * closed nor knowable from here — a rule's `customAttributes` keys are chosen
 * by its author, and a deployment's own customizations can put a marker
 * anywhere. An allow list would therefore refuse working configurations by
 * default, which is a worse failure than the one it prevents.
 *
 * Like {@link CustomizationUrlPolicy}, the effective policy comes from the
 * **app config** property `customizationFunctionPolicy` and is deliberately NOT
 * a customization — customizations can be loaded from the URL, so letting one
 * define this policy would let it lift its own restrictions.
 *
 * Example app config:
 *   window.config = {
 *     customizationFunctionPolicy: {
 *       denyAttributes: [
 *         // this deployment composes labels centrally, not per split rule
 *         'useMetadataDisplaySet.splitRules.customAttributes.SeriesDescription',
 *       ],
 *     },
 *   };
 */

export interface CustomizationFunctionPolicy {
  /**
   * Attribute paths where a `$function` is refused, as dotted patterns.
   *
   * A path is the chain of object keys from the customization id down to the
   * key holding the marker. **Array indices are not segments**, so a rule at
   * `splitRules[2]` and one at `splitRules[7]` share the path
   * `useMetadataDisplaySet.splitRules.matches` — patterns describe shape, not
   * position, and stay valid when a rule list is reordered.
   *
   * Two wildcards:
   *   - `*` matches exactly one segment, for keys the author names (a series
   *     fact is `series.<factName>`, so `series.*` reaches all of them);
   *   - a trailing `**` matches any number of remaining segments, including
   *     none, for denying a whole subtree.
   *
   * Empty (the default) denies nothing. `['**']` disables `$function`
   * completely.
   */
  denyAttributes: string[];
}

/**
 * App config property name holding the policy. Read directly off `appConfig` —
 * deliberately not a customization key.
 */
export const CUSTOMIZATION_FUNCTION_POLICY_KEY = 'customizationFunctionPolicy';

/**
 * Deny nothing.
 *
 * There is no default entry because there is no attribute we can currently show
 * a concrete harm for. Overwriting a display set's identity and content is
 * already prevented on the consuming side by `RESERVED_ATTRIBUTES` in
 * `makeDisplaySetFromInstanceGroup`, which is where that belongs — it applies
 * to a literal custom attribute as much as a computed one.
 */
export const customizationFunctionPolicyDefaults: CustomizationFunctionPolicy = {
  denyAttributes: [],
};

/**
 * Builds the `$function` policy from the app config, falling back to
 * {@link customizationFunctionPolicyDefaults}.
 *
 * A configured policy must supply `denyAttributes` as an array; anything else
 * warns and falls back, rather than being read as "deny everything" and taking
 * a working deployment's rules out over a typo.
 */
export function getCustomizationFunctionPolicy(
  customizationService: any
): CustomizationFunctionPolicy {
  const configured =
    customizationService?.extensionManager?.appConfig?.[CUSTOMIZATION_FUNCTION_POLICY_KEY];
  if (!configured || typeof configured !== 'object') {
    return customizationFunctionPolicyDefaults;
  }
  if (!Array.isArray(configured.denyAttributes)) {
    console.warn(
      `CustomizationService: ${CUSTOMIZATION_FUNCTION_POLICY_KEY}.denyAttributes must be an ` +
        `array of dotted patterns; ignoring the configured policy.`,
      configured
    );
    return customizationFunctionPolicyDefaults;
  }
  return { denyAttributes: configured.denyAttributes };
}

/** Does one dotted pattern match this attribute path? */
function patternMatches(pattern: string, path: string[]): boolean {
  const segments = pattern.split('.');
  const trailingWildcard = segments[segments.length - 1] === '**';
  const fixed = trailingWildcard ? segments.slice(0, -1) : segments;

  if (trailingWildcard ? path.length < fixed.length : path.length !== fixed.length) {
    return false;
  }
  return fixed.every((segment, index) => segment === '*' || segment === path[index]);
}

/**
 * Is a `$function` refused at this attribute path?
 *
 * @param path - object keys from the customization id to the key holding the
 *   marker, array indices excluded.
 * @param patterns - the policy's `denyAttributes`.
 */
export function isFunctionAttributeDenied(path: string[], patterns: string[]): boolean {
  if (!path.length || !Array.isArray(patterns) || !patterns.length) {
    return false;
  }
  return patterns.some(pattern => typeof pattern === 'string' && patternMatches(pattern, path));
}

export default customizationFunctionPolicyDefaults;
