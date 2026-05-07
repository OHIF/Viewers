/**
 * Default policy for the URL `customization` query parameter.
 *
 * Effective policy is merged from extension default/global customization
 * registrations (`ohif.customizationUrl`). These values apply when nothing
 * has been registered yet.
 *
 * Shape:
 *   - prefixes: map of prefix -> base URL used to resolve a `/prefix/name`
 *     URL value to a runtime-imported JS module path.
 *   - strict: when true, invalid customization query entries abort the load;
 *     failed imports, resolve errors, or modules with no customization payload
 *     also abort (throw). When false (default), invalid entries and missing
 *     modules are skipped with a warning.
 */
export interface CustomizationUrlPolicy {
  prefixes: Record<string, string>;
  strict?: boolean;
}

export const CUSTOMIZATION_URL_KEY = 'ohif.customizationUrl';

export const DEFAULT_PREFIX = 'default';

export const customizationUrlDefaults: CustomizationUrlPolicy = {
  prefixes: {
    [DEFAULT_PREFIX]: './customizations/',
  },
  strict: false,
};

export default customizationUrlDefaults;
