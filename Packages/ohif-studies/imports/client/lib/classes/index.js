import { OHIF } from 'meteor/ohif:core';
import { OHIFStudyMetadataSource } from './OHIFStudyMetadataSource';
import { OHIFStudySummary } from './OHIFStudySummary';

OHIF.studies.classes = {
    OHIFStudyMetadataSource,
    OHIFStudySummary
};
