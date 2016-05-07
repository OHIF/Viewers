HangingProtocols = new Meteor.Collection('hangingprotocols');

HangingProtocols.allow({
    insert: function() {
        return true;
    },
    update: function() {
        return true;
    }
});
