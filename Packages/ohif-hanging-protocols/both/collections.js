HangingProtocols = new Meteor.Collection('hangingprotocols');
HangingProtocols._debugName = 'HangingProtocols';

HangingProtocols.allow({
    insert: function() {
        return true;
    },
    update: function() {
        return true;
    },
    remove: function() {
        return true;
    }
});

// @TODO: Remove this after stabilizing ProtocolEngine
if (Meteor.isDevelopment && Meteor.isServer) {
    Meteor.startup(() => {
        HangingProtocols.remove({});
    });
}
