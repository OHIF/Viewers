import { OHIF } from 'meteor/ohif:core';

/**
 * Overridable namespace to allow getting study boxes data externally.
 *
 * The function must handle the first parameter as a studyInformation object containing at least the
 * studyInstanceUid attribute.
 *
 * Shall return a promise that will be resolved with an object containing those attributes:
 * - studyInstanceUid {String}: copy of studyInformation.studyInstanceUid
 * - modalities {String}: 2 uppercase letters for each modality split by any non-alphabetical char(s)
 * - studyDate {String}: date formatted as YYYYMMDD
 * - studyDescription {String}: study description string
 */
OHIF.studies.getStudyBoxData = false;
