Router.route('/protocol-export/:_id', function() {
    var protocolId = this.params._id;
    var protocol = HangingProtocols.findOne({
        id: protocolId
    });

    if (!protocol) {
        this.response.writeHead(404);

        // This will not actually respond with a 404 because of https://github.com/iron-meteor/iron-router/issues/1055
        this.response.end();
        return;
    }

    // Remove the MongoDB _id
    delete protocol._id;

    var protocolJSON = JSON.stringify(protocol, null, 2),
        currentDate = new Date(),
        filename = protocol.name + '-' + (currentDate.getTime().toString()) + '.json';

    this.response.writeHead(200, {
        'Content-Type': 'application/x-download',
        'Content-Disposition': 'attachment; filename=' + filename,
        'Content-Length': protocolJSON.length
    });

    this.response.end(protocolJSON);
}, {
    where: 'server'
});

Router.route('/protocol-import', {
    where: 'server'
}).post(function() {
    try {
        var toImport = JSON.parse(this.request.body.protocol);
        HangingProtocols.insert(toImport);

        this.response.writeHead(200);
        this.response.end(toImport.id);
    } catch(e) {
        this.response.writeHead(500);
        this.response.end('Failed to parse protocol JSON.');
    }
});
