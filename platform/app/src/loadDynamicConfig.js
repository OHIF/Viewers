export default async config => {
  const useDynamicConfig = config.dangerouslyUseDynamicConfig;

  // Check if dangerouslyUseDynamicConfig enabled
  if (useDynamicConfig?.enabled) {
    // If enabled then get configUrl query-string
    let query = new URLSearchParams(window.location.search);
    let configUrl = query.get('configUrl');

    if (configUrl) {
      const { regex } = useDynamicConfig;

      // An explicit regex is REQUIRED. String.prototype.match coerces
      // undefined to the empty pattern /(?:)/ which matches EVERY string,
      // so the old code silently accepted any ?configUrl= value.
      const hasExplicitRegex =
        regex instanceof RegExp || (typeof regex === 'string' && regex.length > 0);

      if (!hasExplicitRegex) {
        console.error(
          `dangerouslyUseDynamicConfig.enabled is true but no "regex" is configured. ` +
            `Refusing to load ?configUrl=${configUrl}. Set an explicit ` +
            `dangerouslyUseDynamicConfig.regex (e.g. /^https:\\/\\/config\\.example\\.com\\//) ` +
            `to allow specific configuration sources.`
        );
        return null;
      }

      if (configUrl.match(regex)) {
        const response = await fetch(configUrl);
        return response.json();
      }
      return null;
    }
  }
  return null;
};
