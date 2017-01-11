import { Meteor } from 'meteor/meteor';

/*
 * Defines the base OHIF object
 */

const OHIF = {
    log: {},
    ui: {},
    utils: {},
    viewer: {}
};

// Expose the OHIF object to the client if it is on development mode
if (Meteor.isDevelopment && Meteor.isClient) {
    window.OHIF = OHIF;
}

export { OHIF };
