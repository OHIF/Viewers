// @ts-nocheck
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

function isLocalhost(hostname = '') {
  return LOCAL_HOSTNAMES.has(hostname);
}

function normalizeTrustedOrigins(trustedOrigins = []) {
  if (!Array.isArray(trustedOrigins)) {
    return [];
  }

  const configuredOrigins = trustedOrigins
    .filter(origin => typeof origin === 'string')
    .map(origin => origin.trim())
    .filter(Boolean);

  const validOrigins = configuredOrigins
    .map(origin => {
    let parsedOrigin;

    try {
      parsedOrigin = new URL(origin);
    } catch {
      console.error(`Invalid trusted origin "${origin}"`);
      return null;
    }

    if (parsedOrigin.protocol !== 'https:') {
      console.error(`trustedOrigins entries must be https URLs: "${origin}"`);
      return null;
    }

    if (
      parsedOrigin.username ||
      parsedOrigin.password ||
      parsedOrigin.pathname !== '/' ||
      parsedOrigin.search ||
      parsedOrigin.hash
    ) {
      console.error(`trustedOrigins entries must be bare origins: "${origin}"`);
      return null;
    }

    return parsedOrigin.origin;
  })
    .filter(Boolean);

  if (configuredOrigins.length > 0 && validOrigins.length === 0) {
    throw new Error('No valid trustedOrigins configured');
  }

  return validOrigins;
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

function stripUrlCredentials(parsedUrl) {
  const strippedUrl = new URL(parsedUrl.toString());
  strippedUrl.username = '';
  strippedUrl.password = '';
  return strippedUrl.toString();
}

function isTrustedConfigOrigin(parsedUrl, policy = {}) {
  const { trustedOrigins = [], trustLocalhostHttp = false } = policy;
  const normalizedTrustedOrigins = normalizeTrustedOrigins(trustedOrigins);

  if (parsedUrl.protocol === 'http:' && isLocalhost(parsedUrl.hostname) && trustLocalhostHttp) {
    return true;
  }

  return normalizedTrustedOrigins.includes(parsedUrl.origin);
}

function resolveDicomWebProxyConfigPolicy(rawUrl, policy = {}) {
  const { configFetchAuthMode = 'include' } = policy;

  const parsedUrl = resolveConfigUrl(rawUrl);
  const protocol = parsedUrl.protocol.toLowerCase();

  if (!['http:', 'https:'].includes(protocol)) {
    throw new Error('Only HTTP(S) URLs are allowed for dynamic datasource configuration');
  }

  if (parsedUrl.hash) {
    throw new Error('URL fragments are not allowed for dynamic datasource configuration');
  }

  const isTrusted = isTrustedConfigOrigin(parsedUrl, policy);

  return {
    parsedUrl,
    normalizedUrl: isTrusted ? parsedUrl.toString() : stripUrlCredentials(parsedUrl),
    isTrusted,
    credentialsMode: isTrusted && configFetchAuthMode === 'omit' ? 'omit' : isTrusted ? 'include' : 'omit',
  };
}

function resolveDicomJsonConfigFetchPolicy(rawUrl, policy = {}) {
  const { configFetchAuthMode = 'include' } = policy;
  const parsedUrl = resolveConfigUrl(rawUrl);
  const protocol = parsedUrl.protocol.toLowerCase();

  if (!['http:', 'https:'].includes(protocol)) {
    throw new Error('Only HTTP(S) URLs are allowed for dynamic datasource configuration');
  }

  if (parsedUrl.hash) {
    throw new Error('URL fragments are not allowed for dynamic datasource configuration');
  }

  const isTrusted = isTrustedConfigOrigin(parsedUrl, policy);
  if (!isTrusted) {
    throw new Error(`Blocked untrusted dicomjson config URL origin: "${parsedUrl.origin}"`);
  }

  return {
    parsedUrl,
    normalizedUrl: parsedUrl.toString(),
    isTrusted: true,
    credentialsMode: configFetchAuthMode === 'omit' ? 'omit' : 'include',
  };
}

async function fetchConfigJson(normalizedPolicy) {
  const { normalizedUrl, credentialsMode } = normalizedPolicy;
  const response = await fetch(normalizedUrl, {
    credentials: credentialsMode,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dynamic datasource configuration (${response.status})`);
  }

  return response.json();
}

function applyConfigUrlTrustToEndpoints(config, isTrusted) {
  if (!config || typeof config !== 'object') {
    return config;
  }

  const clonedConfig = { ...config };
  const endpointFields = ['qidoRoot', 'wadoRoot', 'wadoUriRoot', 'wadoUri'];

  endpointFields.forEach(field => {
    const value = clonedConfig[field];
    if (typeof value !== 'string' || isTrusted === true || !/^https?:\/\//i.test(value)) {
      return;
    }

    try {
      const parsedValue = new URL(value);
      clonedConfig[field] = stripUrlCredentials(parsedValue);
    } catch {
      // Leave malformed endpoint values untouched; datasource will handle them downstream.
    }
  });

  return clonedConfig;
}

export {
  resolveDicomWebProxyConfigPolicy,
  resolveDicomJsonConfigFetchPolicy,
  fetchConfigJson,
  applyConfigUrlTrustToEndpoints,
};
