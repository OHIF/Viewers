// Temporary fix to drop all Collections on server restart
// http://stackoverflow.com/questions/23891631/meteor-how-can-i-drop-all-mongo-collections-and-clear-all-data-on-startup
Meteor.startup(function() {
    console.warn('Dropping all Collections!');
    for (var property in global) {
        var object = global[property];
        if (object instanceof Meteor.Collection) {
        	console.warn('Dropping: ' + object._debugName);
            object.remove({});
        }
    }
});