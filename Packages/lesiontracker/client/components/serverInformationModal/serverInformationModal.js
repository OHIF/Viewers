function parseUrl(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return parser;
}

Template.serverInformationModal.helpers({
    serverInformation: function() {
        // TODO: change for Collections
        var defaultServiceType = Meteor.settings && Meteor.settings.defaultServiceType || 'dicomWeb';
        var serviceInfo = Meteor.settings.servers[defaultServiceType];
        if (defaultServiceType === 'dicomWeb') {
            var serverInformationDicom = [];
            serviceInfo.forEach(function(endpoint) {
                var parsedUrl = parseUrl(endpoint.qidoRoot);
                serverInformationDicom.push({
                    host: parsedUrl.hostname,
                    port: parsedUrl.port,
                    aeTitle: endpoint.name
                });
            });

            return serverInformationDicom;
        }

        return serviceInfo;
    }
});
