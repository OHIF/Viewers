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
const PLATFORM_LOGIN_URL = 'https://blackvoxel.ai/login';

/**
 * Call once at app startup (before appInit).
 *
 * - If `?token=` is in the URL: store in sessionStorage, strip from URL bar.
 * - If sessionStorage already holds a token: no-op (already authenticated).
 * - Otherwise: redirect to PLATFORM_LOGIN_URL with a `?redirect=` param so
 *   the platform can send the user back after login.
 */
export function extractAndStoreToken(): void {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token) {
    sessionStorage.setItem(SESSION_KEY, token);
    // Strip ?token= from the URL bar without adding a browser history entry.
    // This prevents the raw JWT from appearing in the user's history or being
    // copied accidentally from the address bar.
    params.delete('token');
    const newSearch = params.toString();
    const newUrl =
      window.location.pathname +
      (newSearch ? `?${newSearch}` : '') +
      window.location.hash;
    window.history.replaceState({}, '', newUrl);
    return;
  }

  // No token in URL — check whether we already have one from this session.
  if (sessionStorage.getItem(SESSION_KEY)) {
    return; // Already authenticated in this tab session.
  }

  // No token anywhere — send the user back to the platform to log in.
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
