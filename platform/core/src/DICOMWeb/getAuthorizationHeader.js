// Commenting this out for now since it looks like Rollup is pulling in the
// Node.js version instead of the Browser version of this package
//import { btoa } from 'isomorphic-base64';
import user from '../user';

/**
 * Returns the Authorization header as part of an Object.
 *
 * @returns {Object}
 */
export default function getAuthorizationHeader(server) {
  const headers = {};

  // Check for OHIF.user since this can also be run on the server
  const accessToken = user && user.getAccessToken && user.getAccessToken();

  if (server && server.requestOptions && server.requestOptions.auth) {
    // HTTP Basic Auth (user:password)
    headers.Authorization = `Basic ${btoa(server.requestOptions.auth)}`;
  } else if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}
