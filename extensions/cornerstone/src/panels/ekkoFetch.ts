/** Helper pour les appels fetch vers l'API Ekko avec le Bearer JWT. */

export const JWT_TOKEN_KEY = 'ekko_jwt_token';

export function ekkoHeaders(json = false): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (json) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}
