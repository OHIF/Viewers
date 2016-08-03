import { OHIF } from 'meteor/ohif:core';

OHIF.user = {};

// Throw error if there is no user logged in
OHIF.user.validate = () => {
    if (!Meteor.userId()) {
        throw new Meteor.Error('not-authorized');
    }
};

// Get the persistent data by key
OHIF.user.getData = key => {
    // Check if there is an user logged in
    OHIF.user.validate();

    // Get user profile data
    const profile = Meteor.user().profile;

    // Get the user persistent data
    const data = profile && profile.persistent;

    if (data) {
        return data[key];
    }
};

// Store the persistent data by giving a key and a value to store
OHIF.user.setData = (key, value) => {
    // Check if there is an user logged in
    OHIF.user.validate();

    // Call the update method on server-side
    Meteor.call('userDataSet', key, value);
};
