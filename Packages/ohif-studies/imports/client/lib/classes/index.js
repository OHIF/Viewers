import { OHIF } from 'meteor/ohif:core';
import { OHIFStudyMetadataSource } from './OHIFStudyMetadataSource';
import { OHIFStudySummary } from './OHIFStudySummary';

OHIF.studies = {};
OHIF.studies.classes = {
    OHIFStudyMetadataSource,
    OHIFStudySummary
};
