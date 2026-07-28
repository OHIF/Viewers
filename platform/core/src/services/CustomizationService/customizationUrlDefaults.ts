/**
 * Policy for the `?customization=` URL query parameter.
 *
 * The effective policy comes from the **app config** property
 * `customizationUrlPrefixes` (NOT a customization — a customization must never
 * be able to widen its own allowlist). When that property is absent the policy
 * has no prefixes, so the feature is **off by default**: any `?customization=`
 * value is rejected because its prefix is not configured.
 *
 * Shape:
 *   - prefixes: map of prefix -> base URL used to resolve a customization value
 *     to a fetched `.jsonc` data file. The `default` prefix (no slashes) is used
 *     for values with no leading slash; every other prefix must start and end
 *     with a slash (e.g. `/remote/`) and is matched against the leading
 *     `/segment/` of the value.
 *
 * Example app config:
 *   window.config = {
 *     customizationUrlPrefixes: {
 *       default: './customizations/',
 *       '/remote/': 'https://cdn.example.com/ohif-customizations/',
 *     },
 *   };
 */
export interface CustomizationUrlPolicy {
  prefixes: Record<string, string>;
}

/**
 * App config property name holding the prefix allowlist. Read directly off
 * `appConfig` — deliberately not a customization key.
 */
export const CUSTOMIZATION_URL_PREFIXES_KEY = 'customizationUrlPrefixes';

export const DEFAULT_PREFIX = 'default';

/** Off by default: no prefixes are allowed until the app config configures them. */
export const customizationUrlDefaults: CustomizationUrlPolicy = {
  prefixes: {},
};

export default customizationUrlDefaults;
