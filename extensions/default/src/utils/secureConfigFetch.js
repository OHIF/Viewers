// @ts-nocheck

function normalizeAllowedOrigins(allowedOrigins = []) {
  if (!Array.isArray(allowedOrigins)) {
    return [];
  }

  const configuredOrigins = allowedOrigins
    .filter(origin => typeof origin === 'string')
    .map(origin => origin.trim())
    .filter(Boolean);

  return configuredOrigins
    .map(origin => {
      try {
        const parsedOrigin = new URL(origin);
        if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
          console.error(
            `[secureConfigFetch] Ignoring misconfigured allowed origin "${origin}". ` +
              'Entries must use http:// or https://.'
          );
          return null;
        }
        if (
          parsedOrigin.username ||
          parsedOrigin.password ||
          parsedOrigin.pathname !== '/' ||
          parsedOrigin.search ||
          parsedOrigin.hash
        ) {
          console.error(
            `[secureConfigFetch] Ignoring misconfigured allowed origin "${origin}". ` +
              'Entries must be bare origins only (scheme + host + optional port), with no username/password, path, query, or hash.'
          );
          return null;
        }
        return parsedOrigin.origin;
      } catch {
        console.error(
          `[secureConfigFetch] Ignoring misconfigured allowed origin "${origin}". Entry is not a valid URL.`
        );
        return null;
      }
    })
    .filter(Boolean);
}

function resolveConfigUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Missing required "url" query parameter');
  }

  try {
    return new URL(rawUrl, window.location.href);
  } catch {
    throw new Error('Invalid URL in "url" query parameter');
  }
}

function resolveConfigFetchPolicy(rawUrl, policy = {}) {
  const { allowedOrigins = [], userAuthenticationService } = policy;
  const parsedUrl = resolveConfigUrl(rawUrl);
  const protocol = parsedUrl.protocol.toLowerCase();

  if (!['http:', 'https:'].includes(protocol)) {
    throw new Error('Only HTTP(S) URLs are allowed for dynamic datasource configuration');
  }

  if (parsedUrl.hash) {
    throw new Error('URL fragments are not allowed for dynamic datasource configuration');
  }

  const isAuthenticated = Boolean(
    userAuthenticationService?.getAuthorizationHeader?.()?.Authorization
  );

  if (isAuthenticated) {
    const normalizedAllowedOrigins = normalizeAllowedOrigins(allowedOrigins);
    if (!normalizedAllowedOrigins.length || !normalizedAllowedOrigins.includes(parsedUrl.origin)) {
      throw new Error(
        `Blocked remote configuration origin "${parsedUrl.origin}" in authenticated environment`
      );
    }
  }

  return {
    parsedUrl,
    normalizedUrl: parsedUrl.toString(),
    isAuthenticated,
  };
}

async function fetchConfigJson(normalizedPolicy) {
  const { normalizedUrl, isAuthenticated } = normalizedPolicy;
  const response = isAuthenticated
    ? await fetch(normalizedUrl)
    : await fetch(normalizedUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
      });

  if (!response.ok) {
    throw new Error(`Failed to fetch dynamic datasource configuration (${response.status})`);
  }

  return response.json();
}
export {
  resolveConfigFetchPolicy,
  fetchConfigJson,
};
