/**
 * jwtBridge.ts
 *
 * Handles the JWT handoff from blackvoxel.ai to the MIMPS viewer.
 *
 * Flow:
 *   1. blackvoxel.ai opens viewer.blackvoxel.ai?token=<jwt>
 *   2. extractAndStoreToken() reads ?token=, persists to sessionStorage, strips from URL bar
 *   3. On subsequent navigation within the same tab the token is read from sessionStorage
 *   4. If no token is found anywhere the user is redirected back to the platform login
 *
 * No framework dependencies — this file must remain a pure TS utility so it
 * can be called before React mounts.
 */

const SESSION_KEY = 'blackvoxel_jwt';
const COOKIE_KEY = 'blackvoxel_jwt';
const PLATFORM_LOGIN_URL = 'https://blackvoxel.ai/login';

/**
 * Mirror the JWT into a session cookie so the browser attaches it to
 * same-origin requests nginx gates with `auth_request` (the /pacs/ DICOMweb
 * proxy). XHR/fetch image loads can't carry an Authorization header through
 * cornerstone, so the cookie is the credential nginx's auth subrequest sees.
 *
 * Session-scoped (no Max-Age) to match sessionStorage semantics; not HttpOnly
 * by necessity since it is set from JS. Hardened (SEC-17):
 *   - SameSite=Strict: the /pacs/ image requests are same-origin, so the cookie
 *     is never needed on cross-site navigations — Strict blocks it from riding
 *     along on requests initiated by other sites (CSRF / token-leak surface).
 *   - Secure on HTTPS so the token never traverses a plaintext origin hop.
 */
function syncAuthCookie(token: string): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_KEY}=${token}; Path=/; SameSite=Strict${secure}`;
}

function clearAuthCookie(): void {
  document.cookie = `${COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Strict`;
}

/**
 * Call once at app startup (before appInit).
 *
 * - If `?token=` is in the URL: store in sessionStorage + cookie, strip from URL bar.
 * - If sessionStorage already holds a token: re-sync the cookie (covers tabs
 *   that stored a token before the cookie carry existed) and continue.
 * - Otherwise: redirect to PLATFORM_LOGIN_URL with a `?redirect=` param so
 *   the platform can send the user back after login.
 */
export function extractAndStoreToken(): void {
  const params = new URLSearchParams(window.location.search);
  // Prefer the token from the URL *fragment* (#token=). Unlike the query string,
  // the fragment is never sent to the server, so the JWT can't leak into nginx /
  // proxy access logs or a Referer header on the first hop. The query-string form
  // (?token=) is still accepted for backward compatibility during rollout.
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = hashParams.get('token') || params.get('token');

  if (token) {
    sessionStorage.setItem(SESSION_KEY, token);
    syncAuthCookie(token);
    // Strip the token from BOTH the query and the fragment in the URL bar,
    // without adding a browser history entry — keeps the raw JWT out of history
    // and prevents accidental copy from the address bar.
    params.delete('token');
    hashParams.delete('token');
    const newSearch = params.toString();
    const newHash = hashParams.toString();
    const newUrl =
      window.location.pathname +
      (newSearch ? `?${newSearch}` : '') +
      (newHash ? `#${newHash}` : '');
    window.history.replaceState({}, '', newUrl);
    return;
  }

  // No token in URL — check whether we already have one from this session.
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    syncAuthCookie(stored);
    return; // Already authenticated in this tab session.
  }

  // No token anywhere — send the user back to the platform to log in.
  clearAuthCookie();
  const redirectParam = encodeURIComponent(window.location.origin);
  window.location.href = `${PLATFORM_LOGIN_URL}?redirect=${redirectParam}`;
}

/**
 * Returns the JWT stored for this session, or null if not present.
 *
 * Use this to attach `Authorization: Bearer <token>` to outbound requests.
 */
export function getStoredToken(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}
