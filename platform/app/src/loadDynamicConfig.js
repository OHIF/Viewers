export default async config => {
  const useDynamicConfig = config.dangerouslyUseDynamicConfig;

  // Check if dangerouslyUseDynamicConfig enabled
  if (useDynamicConfig?.enabled) {
    // If enabled then get configUrl query-string
    let query = new URLSearchParams(window.location.search);
    let configUrl = query.get('configUrl');

    if (configUrl) {
      // validate regex
      const regex = useDynamicConfig.regex;

      if (configUrl.match(regex)) {
        const response = await fetch(configUrl);
        return response.json();
      } else {
        return null;
      }
    }
  }
  return null;
};
