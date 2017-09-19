/**
 * Import main dependency
 */

import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

/**
 * Append Cornerstone namespace
 */

const Cornerstone = {
  ...OHIF.cornerstone
};

/**
 * Append Cornerstone namespace to OHIF namespace
 */

OHIF.cornerstone = Cornerstone;

/**
 * Export relevant objects
 */

export { Meteor, OHIF };
