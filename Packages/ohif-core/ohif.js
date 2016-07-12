/*
 * Defines the base OHIF object
 */

const OHIF = {};

if (Meteor.isDevelopment) {
    window.OHIF = OHIF;
}

export { OHIF };
