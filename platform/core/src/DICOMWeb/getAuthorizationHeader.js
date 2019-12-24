// Commenting this out for now since it looks like Rollup is pulling in the
// Node.js version instead of the Browser version of this package
//import { btoa } from 'isomorphic-base64';
import user from '../user';

/**
 * Returns the Authorization header as part of an Object.
 *
 * @export
 * @param {Object} [server={}]
 * @param {Object} [server.requestOptions]
 * @param {string|function} [server.requestOptions.auth]
 * @returns {Object} { Authorization }
 */
export default function getAuthorizationHeader({ requestOptions } = {}) {
  const headers = {};

  // Check for OHIF.user since this can also be run on the server
  const accessToken = user && user.getAccessToken && user.getAccessToken();

  if (requestOptions && requestOptions.auth) {
    if (typeof requestOptions.auth === 'function') {
      // Custom Auth Header
      headers.Authorization = requestOptions.auth(requestOptions);
    } else {
      // HTTP Basic Auth (user:password)
      headers.Authorization = `Basic ${btoa(requestOptions.auth)}`;
    }
  } else if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}
