/**
 * Overridable namespace to allow getting study boxes data externally.
 *
 * The function must handle the first parameter as a studyInformation object containing at least the
 * StudyInstanceUID attribute.
 *
 * Shall return a promise that will be resolved with an object containing those attributes:
 * - StudyInstanceUID {String}: copy of studyInformation.StudyInstanceUID
 * - modalities {String}: 2 uppercase letters for each Modality split by any non-alphabetical char(s)
 * - StudyDate {String}: date formatted as YYYYMMDD
 * - StudyDescription {String}: study description string
 */
// TODO: What is this for?
const getStudyBoxData = false;

export default getStudyBoxData;
