import { DicomMetadataStore, Types } from '@ohif/core';

type StudyMetadata = Types.StudyMetadata;

/**
 * Compare function for sorting
 *
 * @param a - some simple value (string, number, timestamp)
 * @param b - some simple value
 * @param defaultCompare - default return value as a fallback when a===b
 * @returns - compare a and b, returning 1 if a<b -1 if a>b and defaultCompare otherwise
 */
const compare = (a, b, defaultCompare = 0): number => {
  if (a === b) {
    return defaultCompare;
  }
  if (a < b) {
    return 1;
  }
  return -1;
};

/**
 * The studies from display sets gets the studies in study date
 * order or in study instance UID order - not very useful, but
 * if not specifically specified then at least making it consistent is useful.
 */
const getStudiesfromDisplaySets = (displaysets): StudyMetadata[] => {
  const studyMap = {};

  const ret = displaySets.reduce((prev, curr) => {
    const { StudyInstanceUID } = curr;
    if (!studyMap[StudyInstanceUID]) {
      const study = DicomMetadataStore.getStudy(StudyInstanceUID);
      studyMap[StudyInstanceUID] = study;
      prev.push(study);
    }
    return prev;
  }, []);
  // Return the sorted studies, first on study date and second on study instance UID
  ret.sort((a, b) => {
    return compare(a.StudyDate, b.StudyDate, compare(a.StudyInstanceUID, b.StudyInstanceUID));
  });
  return ret;
};

/**
 * The studies retrieve from the Uids is faster and gets the studies
 * in the original order, as specified.
 */
const getStudiesFromUIDs = (studyUids: string[]): StudyMetadata[] => {
  if (!studyUids?.length) {
    return;
  }
  return studyUids.map(uid => DicomMetadataStore.getStudy(uid));
};

/** Gets the array of studies */
const getStudies = (studyUids?: string[], displaySets): StudyMetadata[] => {
  return getStudiesFromUIDs(studyUids) || getStudiesfromDisplaySets(displaySets);
};

export default getStudies;

export { getStudies, getStudiesFromUIDs, getStudiesfromDisplaySets, compare };
