import { Meteor } from 'meteor/meteor';
import log from './log.js';

/*
 * Defines the base OHIF object
 */

const OHIF = {
    log,
    ui: {},
    utils: {},
    viewer: {},
    cornerstone: {},
    user: {},
    DICOMWeb: {}, // Temporarily added
};

export { OHIF };
