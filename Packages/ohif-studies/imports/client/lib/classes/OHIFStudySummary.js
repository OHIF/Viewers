import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

/**
 * Constants
 */

const STRING = 'string';
const propertyReplacementMap = {
    modalities: 'ModalitiesInStudy',
    patientBirthdate: 'PatientBirthDate'
};

/**
 * OHIF Viewers specialized version of StudySummary class
 */
export class OHIFStudySummary extends OHIF.viewerbase.metadata.StudySummary {

    // @Override
    addTags(tagMap) {
        const _hasOwn = Object.prototype.hasOwnProperty;
        const _tagMap = Object.create(null);
        for (let property in tagMap) {
            if (_hasOwn.call(tagMap, property)) {
                let standardProperty = OHIFStudySummary.getStandardPropertyName(property);
                if (standardProperty) {
                    _tagMap[standardProperty] = tagMap[property];
                }
            }
        }
        super.addTags(_tagMap);
    }

    /**
     * Turns a non-standard, OHIF specific, DICOM property name into a standard one.
     * @param {string} property A string representing a non-conforming keyword.
     * @returns {string|undefined} Returns a standard-conforming property name.
     */
    static getStandardPropertyName(property) {
        let standardProperty;
        if (typeof property === STRING && property.charAt(0) !== '_') {
            if (property in propertyReplacementMap) {
                standardProperty = propertyReplacementMap[propertyReplacementMap];
            } else {
                standardProperty = property.replace(/^sop/, 'SOP').replace(/Uid$/, 'UID').replace(/Id$/, 'ID');
                standardProperty = standardProperty.charAt(0).toUpperCase() + standardProperty.substr(1);
            }
        }
        return standardProperty;
    }

}
