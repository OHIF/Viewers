import { OHIF } from 'meteor/ohif:core';
import { Meteor } from 'meteor/meteor';

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

        // Build the query to update only the current user's data
        var query = {
            _id: Meteor.userId()
        };

        // Build the path to the persistent data with the given key
        const persistentPath = `profile.persistent.${key}`;

        // Build the data to be updated
        var data = {
            $set: {
                [persistentPath]: value
            }
        };

        // Update the user's profile data with the persistent information
        Accounts.users.update(query, data, OHIF.MongoUtils.writeCallback);
    }

}

// Register the methods
Meteor.methods({
    userDataGet: key => UserData.get(key),
    userDataSet: (key, value) => UserData.set(key, value)
});

// Expose the class in the OHIF object
OHIF.UserData = UserData;
