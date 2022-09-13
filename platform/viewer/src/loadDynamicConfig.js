export default async config => {
  const useDynamicConfig = config.dangerouslyUseDynamicConfig;

  // Check if dangerouslyUseDynamicConfig enabled
  if (useDynamicConfig.enabled) {
    // If enabled then get configUrl param
    let query = new URLSearchParams(window.location.search);
    let configUrl = query.get('configUrl');

    if (!configUrl) {
      // Handle OIDC redirects
      const obj = JSON.parse(sessionStorage.getItem('ohif-redirect-to'));
      if (obj) {
        const query = new URLSearchParams(obj.search);
        configUrl = query.get('configUrl');
      }
    } else {
      // validate regex
      const regex = useDynamicConfig.regex;

      if (regex.test(configUrl)) {
        const response = await fetch(configUrl);
        return response.json();
      } else {
        return null;
      }
    }
  }

  return null;
};
