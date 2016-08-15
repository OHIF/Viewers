/*DICOMTags = new Meteor.Collection(null);

Object.keys(HP.tagDescriptions).forEach(function(key) {
    var value = HP.tagDescriptions[key];
    DICOMTags.insert({
        id: key,
        name: '(' + key + ') ' + value
    });
});

Meteor.methods({
    dicomTagSearch: function(partialName) {
        check(partialName, String);

        var results = DICOMTags.find({
            name: {
                $regex: partialName,
                $options: 'i'
            }
        }, {
            limit: 20,
            fields: {
                id: 1,
                name: 1
            }
        }).fetch();

        return {
            results: results
        };
    }
}); */

Meteor.methods({
    removeHangingProtocol: function(id) {
        HangingProtocols.remove(id);
    },
    removeHangingProtocolByID: function(id) {
        HangingProtocols.remove({
            id: id
        });
    }
});
