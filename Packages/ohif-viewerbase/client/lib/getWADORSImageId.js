import { OHIF } from 'meteor/ohif:core';

import { getWADORSImageUrl } from './getWADORSImageUrl';

/**
 * Obtain an imageId for Cornerstone based on the WADO-RS scheme
 *
 * @param {object} instanceMetada metadata object (InstanceMetadata)
 * @returns {string} The imageId to be used by Cornerstone
 */
export function getWADORSImageId(instance, frame) {
    const uri = getWADORSImageUrl(instance, frame);

    if (!uri) {
        return;
    }

    return `wadors:${uri}`;
};
