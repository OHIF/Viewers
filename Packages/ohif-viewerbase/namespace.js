/**
 * Import main dependency
 */

import { OHIF } from 'meteor/ohif:core';

/**
 * Create Viewerbase namespace
 */

const Viewerbase = {};

/**
 * Append Viewerbase namespace to OHIF namespace
 */

OHIF.viewerbase = Viewerbase;

/**
 * Export relevant objects
 */

export { OHIF, Viewerbase };
