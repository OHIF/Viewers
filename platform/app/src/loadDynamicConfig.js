// Deployment-gated `?configUrl=` loading.
//
// This is the highest-value target in the whole configuration surface: the
// fetched document controls `dataSources`, `runtimeExtensionOrigins`, and the
// `extensions`/`modes` descriptors, so whoever controls it controls which code
// the viewer loads. Every check below is therefore fail-closed and loud — a
// misconfiguration refuses the load and says why, rather than silently
// widening what a `?configUrl=` may point at.

/**
 * Origin comparison, normalized through the URL parser so a full-URL entry
 * ('https://config.example.com/configs/') allowlists that URL's origin, ports
 * are part of the origin, and a malformed entry is skipped rather than fatal.
 * Mirrors isAllowedRuntimeOrigin in runtimeExtensionLoader.ts.
 */
function originAllowed(url, origins) {
  return origins.some(entry => {
    try {
      return new URL(entry, window.location.href).origin === url.origin;
    } catch {
      return false;
    }
  });
}

export default async config => {
  const useDynamicConfig = config.dangerouslyUseDynamicConfig;

  if (!useDynamicConfig?.enabled) {
    return null;
  }

  const configUrl = new URLSearchParams(window.location.search).get('configUrl');
  if (!configUrl) {
    return null;
  }

  const { regex, origins } = useDynamicConfig;
  const refuse = reason => {
    console.error(
      `dangerouslyUseDynamicConfig: Refusing to load ?configUrl=${configUrl} — ${reason}`
    );
    return null;
  };

  // Resolve BEFORE matching, and match/fetch the RESOLVED absolute URL. The raw
  // query-string value is attacker-shaped and can dodge a pattern that reads
  // correctly: a relative path, a protocol-relative '//host/x', or embedded
  // tab/CR/LF characters that the URL parser strips. The pattern must only ever
  // see the URL the browser would actually fetch.
  let url;
  try {
    url = new URL(configUrl, window.location.href);
  } catch (_e) {
    // note: babel's regenerator transform (jest pipeline) crashes on an
    // optional catch binding inside async functions, so keep the parameter
    return refuse('it is not a valid URL');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return refuse(`the "${url.protocol}" scheme is not allowed (http/https only)`);
  }

  // `regex.length > 0` used to accept '  ', which then matched nearly any URL
  // containing a space, so trim before deciding a pattern was configured.
  const patternSource =
    regex instanceof RegExp ? regex.source : typeof regex === 'string' ? regex.trim() : '';
  const hasRegex = patternSource.length > 0;
  const hasOrigins = Array.isArray(origins) && origins.length > 0;

  // At least one gate is REQUIRED. String.prototype.match coerces undefined to
  // the empty pattern /(?:)/ which matches EVERY string, so the original code
  // silently accepted any ?configUrl= value.
  if (!hasOrigins && !hasRegex) {
    return refuse(
      'dangerouslyUseDynamicConfig.enabled is true but neither "origins" nor "regex" is ' +
        'configured. Set origins: ["https://config.example.com"] (preferred — an exact ' +
        'origin comparison) and/or an anchored regex, e.g. ' +
        '/^https:\\/\\/config\\.example\\.com\\//.'
    );
  }

  // The origin allowlist is the strong gate: it compares url.origin for
  // equality, so no pattern subtlety applies. When both are configured both
  // must pass.
  if (hasOrigins && !originAllowed(url, origins)) {
    return refuse(
      `origin "${url.origin}" is not listed in dangerouslyUseDynamicConfig.origins ` +
        `(${origins.join(', ')})`
    );
  }

  if (hasRegex) {
    // Anchor REQUIRED. A natural-looking `regex: 'config\\.example\\.com'`
    // reads like a host allowlist, but matching is unanchored, so it also
    // accepts https://evil.example/?x=config.example.com — and a hostile
    // config document is arbitrary code execution via extensions[]. Refuse
    // loudly rather than honor a pattern that does not mean what it looks like.
    if (!patternSource.startsWith('^')) {
      return refuse(
        `dangerouslyUseDynamicConfig.regex "${patternSource}" is not anchored — it can match ` +
          'ANYWHERE in the URL, so a hostile URL satisfies it from its own path or query ' +
          'string. Start the pattern with "^" (use /^/ to knowingly match every URL), or ' +
          'switch to "origins".'
      );
    }
    // With the "m" flag "^" matches after any newline, which would defeat the
    // anchor requirement. The URL parser already strips CR/LF, so this is
    // belt-and-braces — but an "m" flag is never intentional for a URL test.
    if (regex instanceof RegExp && regex.multiline) {
      return refuse(
        'dangerouslyUseDynamicConfig.regex must not use the "m" flag: it makes "^" match ' +
          'after a newline instead of anchoring to the start of the URL'
      );
    }
    let pattern;
    try {
      // Rebuilt without g/y so a shared RegExp instance cannot carry lastIndex
      // state across calls to .test().
      const flags = (regex instanceof RegExp ? regex.flags : '').replace(/[gy]/g, '');
      pattern = new RegExp(patternSource, flags);
    } catch (e) {
      return refuse(`dangerouslyUseDynamicConfig.regex is not a valid pattern — ${e.message}`);
    }
    if (!pattern.test(url.href)) {
      // A user-supplied URL that the deployment simply does not allow: not a
      // misconfiguration, so no console noise.
      return null;
    }
  }

  const response = await fetch(url.href);
  return response.json();
};
