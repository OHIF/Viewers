import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { OHIF } from 'meteor/ohif:core';

// Manipulate user's persistent data
class UserData {

    // Get the persistent data by key
    static get(key) {
        // Check if there is an user logged in
        OHIF.MongoUtils.validateUser();

        // Get the user's profile data
        const profileData = Meteor.user().profile;

        // Return the data if it is set
        if (profileData.persistent) {
            return profileData.persistent[key];
        }
    }

    // Store the persistent data by giving a key and a value to store
    static set(key, value) {
        // Check if there is an user logged in
        OHIF.MongoUtils.validateUser();

        // Get the user data
        const user = Meteor.user();

        // Build the path to the persistent data with the given key
        const persistentPath = `profile.persistent.${key}`;

        // Build the query to update the user's data
        let query;
        if (!user.profile.persistent) {
            const persistentData = OHIF.object.getNestedObject({ [key]: value });
            query = { $set: { 'profile.persistent': persistentData } };
        } else {
            query = { $set: { [persistentPath]: value } };
        }

        // Update the user's profile data with the persistent information
        Accounts.users.update(user._id, query, OHIF.MongoUtils.writeCallback);
    }

}

// Register the methods
Meteor.methods({
    'ohif.user.data.get': key => UserData.get(key),
    'ohif.user.data.set': (key, value) => UserData.set(key, value)
});
