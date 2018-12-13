import { OHIF } from 'meteor/ohif:core';
import metadata from './classes/metadata/';

/**
 * Append Metadata namespace to OHIF namespace...
 */

OHIF.metadata = metadata;

export { metadata };

