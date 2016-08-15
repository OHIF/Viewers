HangingProtocols = new Meteor.Collection('hangingprotocols');
HangingProtocols._debugName = 'HangingProtocols';

HangingProtocols.allow({
    insert: function() {
        return true;
    },
    update: function() {
        return true;
    }
});
