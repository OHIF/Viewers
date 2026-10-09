import { useSystem } from '../contextProviders/SystemProvider';
import i18n from 'i18next';
import moment from 'moment';

/**
 * Tab properties that drive which tab group is used for thumbnail display.
 */
export type TabProp = {
  name: string;
  label: string;
  studies: any[];
};

/**
 * Collection of tab properties with studies presorted depending on tab mod.
 * This is used in deciding what thumbnails to show.
 */
export type TabsProps = TabProp[];

/**
 *
 * @param {string[]} primaryStudyInstanceUIDs
 * @param {object[]} studyDisplayList
 * @param {string} studyDisplayList.studyInstanceUid
 * @param {string} studyDisplayList.date - The study date, formatted for display
 * @param {string} [studyDisplayList.studyDate] - The DICOM StudyDate (YYYYMMDD), used to sort
 * @param {string} studyDisplayList.description
 * @param {string} studyDisplayList.modalities
 * @param {number} studyDisplayList.numInstances
 * @param {object[]} displaySets
 * @param {number} recentTimeframe - The number of milliseconds to consider a study recent
 * @returns {TabsProps} tabs - The prop object expected by the StudyBrowser component
 */

export function createStudyBrowserTabs(
  primaryStudyInstanceUIDs,
  studyDisplayList,
  displaySets,
  recentTimeframeMS = 31536000000
): TabsProps {
  const { servicesManager } = useSystem();
  const { displaySetService, customizationService } = servicesManager.services;

  const primaryStudies = [];
  const allStudies = [];

  studyDisplayList.forEach(study => {
    const displaySetsForStudy = displaySets.filter(
      ds => ds.StudyInstanceUID === study.studyInstanceUid
    );

    const sortCriteria = customizationService.getCustomization('sortingCriteria');
    const sortedDisplaySets = displaySetsForStudy.sort((a, b) => {
      const displaySetA = displaySetService.getDisplaySetByUID(a.displaySetInstanceUID);
      const displaySetB = displaySetService.getDisplaySetByUID(b.displaySetInstanceUID);
      return sortCriteria(displaySetA, displaySetB);
    });

    // return displaySetA.SeriesInstanceUID.localeCompare(displaySetB.SeriesInstanceUID);

    const tabStudy = Object.assign({}, study, {
      displaySets: sortedDisplaySets,
    });

    if (primaryStudyInstanceUIDs.includes(study.studyInstanceUid)) {
      primaryStudies.push(tabStudy);
    }
    allStudies.push(tabStudy);
  });

  const primaryStudiesTimestamps = primaryStudies
    .filter(study => study.date)
    .map(study => getStudyTime(study));

  const recentStudies =
    primaryStudiesTimestamps.length > 0
      ? allStudies.filter(study => {
          const oldestPrimaryTimeStamp = Math.min(...primaryStudiesTimestamps);

          if (!study.date) {
            return false;
          }
          const studyTimeStamp = getStudyTime(study);
          return oldestPrimaryTimeStamp - studyTimeStamp < recentTimeframeMS;
        })
      : [];

  // Newest first
  const _byDate = (a, b) => getStudyTime(b) - getStudyTime(a);

  const tabs = [
    {
      name: 'primary',
      label: i18n.t('StudyBrowser:Primary'),
      studies: primaryStudies.sort(_byDate),
    },
    {
      name: 'recent',
      label: i18n.t('StudyBrowser:Recent'),
      studies: recentStudies.sort(_byDate),
    },
    {
      name: 'all',
      label: i18n.t('StudyBrowser:All'),
      studies: allStudies.sort(_byDate),
    },
  ];

  return tabs;
}

/**
 * Returns the time of a study, to sort the studies and to find the recent ones.
 * The `date` of a study is formatted in the language of the interface, and the
 * Date parser cannot read every language (for example "12 juin 2016"). So the
 * DICOM `studyDate` is used when the caller gives it, and `date` otherwise.
 */
function getStudyTime(study): number {
  const dicomDate = moment(study.studyDate, ['YYYYMMDD', 'YYYY.MM.DD'], true);

  return dicomDate.isValid() ? dicomDate.valueOf() : Date.parse(study.date);
}
