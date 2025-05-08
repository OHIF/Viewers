function handler(event) {
    var request = event.request;
    request.uri = '/';
    return request
}