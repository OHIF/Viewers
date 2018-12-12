import { OHIF } from 'meteor/ohif:core';
import { Meteor } from 'meteor/meteor';

// Mongo data manipulation utilities
class MongoUtils {

    // Check if there is an user logged in
    static validateUser() {
        // Throw error if there is no user logged in
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }
    }

    // Generic callback to MongoDB write operations
    static writeCallback(error, affected) {
        // Throw error if it was not possible to complete the write operation
        if (error) {
            throw new Meteor.Error('data-write', error);
        }
    }

}

// Expose the class in the OHIF object
OHIF.MongoUtils = MongoUtils;
