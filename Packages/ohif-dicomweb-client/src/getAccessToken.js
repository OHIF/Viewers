export default function getAccessToken() {
    if (!global.window || !window.sessionStorage || !sessionStorage) {
        return;
    }

    return sessionStorage.token;
}
