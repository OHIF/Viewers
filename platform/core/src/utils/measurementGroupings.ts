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

export const groupByStudyDeprecated =
  ({ servicesManager }) =>
  (groupedMeasurements, item) => {
    const { displaySetService } = servicesManager.services;
    const displaySet = displaySetService.getDisplaySetByUID(item.displaySetInstanceUID);
    const key = displaySet.instances[0].StudyInstanceUID;

    if (!groupedMeasurements.has(key)) {
      groupedMeasurements.set(key, [item]);
      return groupedMeasurements;
    }

    const oldValues = groupedMeasurements.get(key);
    oldValues.push(item);
    return groupedMeasurements;
  };
