import i18n from 'i18next';

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
 * @param {string} studyDisplayList.date
 * @param {string} studyDisplayList.description
 * @param {string} studyDisplayList.modalities
 * @param {number} studyDisplayList.numInstances
 * @param {object[]} displaySets
 * @param {number} recentTimeframe - The number of milliseconds to consider a study recent
 * @param {object} displaySetService - Gives the display sets and the thumbnail tray order.
 * @returns {TabsProps} tabs - The prop object expected by the StudyBrowser component
 */

export function createStudyBrowserTabs(
  primaryStudyInstanceUIDs,
  studyDisplayList,
  displaySets,
  recentTimeframeMS = 31536000000,
  displaySetService
): TabsProps {
  const primaryStudies = [];
  const allStudies = [];
  // The thumbnail tray order: the sort picked in the study browser, or the default order.
  const sortCriteria = displaySetService.getSortCriteria('thumbnailTray');

  studyDisplayList.forEach(study => {
    const displaySetsForStudy = displaySets.filter(
      ds => ds.StudyInstanceUID === study.studyInstanceUid
    );

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
    .map(study => new Date(study.date).getTime());

  const recentStudies =
    primaryStudiesTimestamps.length > 0
      ? allStudies.filter(study => {
          const oldestPrimaryTimeStamp = Math.min(...primaryStudiesTimestamps);

          if (!study.date) {
            return false;
          }
          const studyTimeStamp = new Date(study.date).getTime();
          return oldestPrimaryTimeStamp - studyTimeStamp < recentTimeframeMS;
        })
      : [];

  // Newest first
  const _byDate = (a, b) => {
    const dateA = Date.parse(a);
    const dateB = Date.parse(b);

    return dateB - dateA;
  };

  const tabs = [
    {
      name: 'primary',
      label: i18n.t('StudyBrowser:Primary'),
      studies: primaryStudies.sort((studyA, studyB) => _byDate(studyA.date, studyB.date)),
    },
    {
      name: 'recent',
      label: i18n.t('StudyBrowser:Recent'),
      studies: recentStudies.sort((studyA, studyB) => _byDate(studyA.date, studyB.date)),
    },
    {
      name: 'all',
      label: i18n.t('StudyBrowser:All'),
      studies: allStudies.sort((studyA, studyB) => _byDate(studyA.date, studyB.date)),
    },
  ];

  return tabs;
}
