Meteor.publish('hangingprotocols', function() {
    // TODO: filter by availableTo user
    return HangingProtocols.find();
});

Meteor.startup(function() {
	// Uncomment this next line to reset all your Protocols on every server reset
    // HangingProtocols.remove({});
    
    if (HangingProtocols.find().count() === 0) {
        console.log('Inserting default protocols');
        HangingProtocols.insert(HP.defaultProtocol);
        HangingProtocols.insert(HP.testProtocol);
    }
});
