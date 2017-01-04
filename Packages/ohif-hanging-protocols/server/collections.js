Meteor.publish('hangingprotocols', function() {
    // TODO: filter by availableTo user
    return HangingProtocols.find();
});
