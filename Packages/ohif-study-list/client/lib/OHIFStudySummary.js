import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

export class OHIFStudySummary extends OHIF.viewerbase.metadata.StudySummary {

    // @Override
    addTags(tagMap) {
        // @TODO: Map OHIF tag names to standard DICOM tag names
        super.addTags(tagMap);
    }

}
