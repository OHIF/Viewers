Router.route(Settings.uri, function () {
    let response = this.response;
    if (!this.params.query.url) {
        response.writeHead(500);
        response.end('No wado url provided');
        return;
    }

    let proxyRequest,
        wadoUrl = url.parse(this.params.query.url, false);

    var options = {
        headers: {}
    };
    //options.headers = this.request.headers;
    if (this.request.headers['referer']) {
        options.headers.referer = this.request.headers['referer'];
    }
    if (this.request.headers['user-agent']) {
        options.headers['user-agent'] = this.request.headers['user-agent'];
    }

    options.method = this.request.method;
    options.host = wadoUrl.hostname;
    options.port = wadoUrl.port ? wadoUrl.port : 80;
    options.path = wadoUrl.path;

    proxyRequest = http.request(options, function (proxyResponse) {
        proxyResponse.pipe(response, {end: true});
    });
    //proxyRequest.end();
    this.request.pipe(proxyRequest, {end: true});
}, {where: 'server'});