/**
 * Groups measurements by study in order to allow display and saving by study
 * @param {Object} servicesManager
 */
export const groupByStudy =
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
