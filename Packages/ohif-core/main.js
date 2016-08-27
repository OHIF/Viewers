/*
 * Defines the base OHIF object
 */

const OHIF = {};

// Expose the OHIF object to the client if it is on development mode
if (Meteor.isDevelopment && Meteor.isClient) {
    window.OHIF = OHIF;
}

export { OHIF };
