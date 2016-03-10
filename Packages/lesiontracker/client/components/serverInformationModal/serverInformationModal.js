Template.serverInformationModal.helpers({
    serverInformation: function() {
        var defaultServiceType = Meteor.settings && Meteor.settings.defaultServiceType || 'dicomWeb';
        var serviceInfo = Meteor.settings[defaultServiceType];
        if (defaultServiceType === 'dicomWeb') {
            serviceInfo = serviceInfo["endpoints"];
        }
        return serviceInfo;
    }
});