import { OHIF } from 'meteor/ohif:core';

export default function getAccessToken() {
    if (!global.window || !window.sessionStorage || !sessionStorage) {
        return;
    }

    const userAccessToken = OHIF.user.getAccessToken();
    if (userAccessToken) {
        return userAccessToken;
    }

    return sessionStorage.token;
}
