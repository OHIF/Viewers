// Temporary fix to drop all Collections on server restart
// http://stackoverflow.com/questions/23891631/meteor-how-can-i-drop-all-mongo-collections-and-clear-all-data-on-startup
Meteor.startup(() => {
    console.warn('Dropping all Collections!');
    Object.keys(global).forEach((key) => {
        const object = global[key];
        if (object instanceof Meteor.Collection) {
            if (!(/^server|currentServer$/).test(object._name)) {
                console.warn(`Dropping: ${object._debugName}`);
                object.remove({});
            }
        }
    });
});
