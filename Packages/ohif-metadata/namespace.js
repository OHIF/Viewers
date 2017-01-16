/**
 * Import main dependency...
 */

import { OHIF } from 'meteor/ohif:core';

/**
 * Create Metadata namespace...
 */

const Metadata = {};

/**
 * Append Metadata namespace to OHIF namespace...
 */

OHIF.metadata = Metadata;

/**
 * Export relevant objects...
 */

export { OHIF, Metadata };
