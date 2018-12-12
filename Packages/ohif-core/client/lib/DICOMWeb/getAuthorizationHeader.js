import { OHIF } from 'meteor/ohif:core';
import { btoa } from 'isomorphic-base64';

/**
 * Returns the Authorization header as part of an Object.
 *
 * @returns {Object}
 */
export default function getAuthorizationHeader() {
    const headers = {};

    // Check for OHIF.user since this can also be run on the server
    const accessToken = OHIF.user && OHIF.user.getAccessToken && OHIF.user.getAccessToken();
    const server = OHIF.servers.getCurrentServer();

    if (server &&
        server.requestOptions &&
        server.requestOptions.auth) {
        // HTTP Basic Auth (user:password)
        headers.Authorization = `Basic ${btoa(server.requestOptions.auth)}`;
    } else if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    return headers;
}
