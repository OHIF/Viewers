function parseUrl(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return parser;
}

Template.serverInformationModal.helpers({
    serverInformation: function() {
        var defaultServiceType = Meteor.settings && Meteor.settings.defaultServiceType || 'dicomWeb';
        var serviceInfo = Meteor.settings[defaultServiceType];
        if (defaultServiceType === 'dicomWeb') {
            var serverInformationDicom = [];
            var endpoints = serviceInfo['endpoints'];
            endpoints.forEach(function(endpoint) {
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
