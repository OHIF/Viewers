/**
 * Groups measurements by study in order to allow display and saving by study
 * @param {Object} servicesManager
 */
export const groupByStudy =
  ({ servicesManager }) =>
  items => {
    const { displaySetService } = servicesManager.services;

    const getItemStudyInstanceUID = item => {
      const displaySet = displaySetService.getDisplaySetByUID(item.displaySetInstanceUID);
      return displaySet.instances[0].StudyInstanceUID;
    };

    const studyInstanceUIDsSet = new Set(items.map(getItemStudyInstanceUID));
    const uniqueStudyInstanceUIDs = Array.from(studyInstanceUIDsSet);

    return uniqueStudyInstanceUIDs.map(studyInstanceUID =>
      items.filter(item => {
        const itemStudyInstanceUID = getItemStudyInstanceUID(item);
        return itemStudyInstanceUID === studyInstanceUID;
      })
    );
  };

export const groupIntoSingleGroup = () => items => [items];
