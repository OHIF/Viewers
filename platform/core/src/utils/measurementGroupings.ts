export const groupByStudy = displaySetService => (groupedMeasurements, item) => {
  const displaySet = displaySetService.getDisplaySetByUID(item.displaySetInstanceUID);
  const key = displaySet.instances[0].StudyDescription;

  if (!groupedMeasurements.has(key)) {
    groupedMeasurements.set(key, [item]);
    return groupedMeasurements;
  }

  const oldValues = groupedMeasurements.get(key);
  oldValues.push(item);
  return groupedMeasurements;
};
