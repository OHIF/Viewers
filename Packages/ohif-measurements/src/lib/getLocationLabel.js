import { OHIF } from 'meteor/ohif:core';

/**
 * Extensible method to translate the location and return a string containing its label
 *
 * @param location
 * @returns string - label for the given location
 */
OHIF.measurements.getLocationLabel = location => {
    return location;
};
