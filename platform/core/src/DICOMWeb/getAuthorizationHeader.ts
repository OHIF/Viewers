import 'isomorphic-base64';
import user from '../user';
import { HeadersInterface, RequestOptions, UserCredentials } from '../types/RequestHeaders';

/**
 * Returns the Authorization header as part of an Object.
 *
 * @export
 * @param {Object} [server={}]
 * @param {Object} [requestOptions]
 * @param {string|function} [requestOptions.auth]
 * @param {Object} [user]
 * @param {function} [user.getAccessToken]
 * @returns {Object} { Authorization }
 */
export default function getAuthorizationHeader(
  requestOptions: RequestOptions,
  user: UserCredentials): HeadersInterface
{
  const headers: HeadersInterface = {};

  // Check for OHIF.user since this can also be run on the server
  const accessToken = user && user.getAccessToken && user.getAccessToken();

  // Auth for a specific server
  if (requestOptions && requestOptions.auth) {
    if (typeof requestOptions.auth === 'function') {
      // Custom Auth Header
      headers.Authorization = requestOptions.auth(requestOptions);
    } else {
      // HTTP Basic Auth (user:password)
      headers.Authorization = `Basic ${btoa(requestOptions.auth)}`;
    }
  }
  // Auth for the user's default
  else if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}
