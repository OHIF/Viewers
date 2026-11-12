const MIN_SR_SERIES_NUMBER = 4700;

export function getNextSeriesNumber({ displaySetService, modality, minSeriesNumber }) {
  const activeDisplaySets = displaySetService.getActiveDisplaySets();
  const modalityDisplaySets = activeDisplaySets.filter(ds => ds.Modality === modality);
  const modalitySeriesNumbers = modalityDisplaySets.map(ds => ds.SeriesNumber);
  const maxSeriesNumber = Math.max(...modalitySeriesNumbers, minSeriesNumber);

  const allSeriesNumbers = activeDisplaySets.map(ds => ds.SeriesNumber);

  let finalSeriesNumber = maxSeriesNumber + 1;
  while (allSeriesNumbers.includes(finalSeriesNumber)) {
    finalSeriesNumber++;
  }

  return { SeriesNumber: finalSeriesNumber, InstanceNumber: 1 };
}

export function getSRSeriesAndInstanceNumber({ displaySetService, SeriesInstanceUid }) {
  if (!SeriesInstanceUid) {
    return getNextSeriesNumber({
      displaySetService,
      modality: 'SR',
      minSeriesNumber: MIN_SR_SERIES_NUMBER,
    });
  }

  const displaySetsMap = displaySetService.getDisplaySetCache();
  const displaySets = Array.from(displaySetsMap.values());
  const srDisplaySet = displaySets.find(
    ds => ds.Modality === 'SR' && ds.SeriesInstanceUID === SeriesInstanceUid
  );
  const InstanceNumber = srDisplaySet.instances?.length + 1;

  if (!srDisplaySet?.SeriesNumber || !InstanceNumber) {
    return getNextSeriesNumber({
      displaySetService,
      modality: 'SR',
      minSeriesNumber: MIN_SR_SERIES_NUMBER,
    });
  }

  return {
    SeriesNumber: srDisplaySet.SeriesNumber,
    InstanceNumber,
    referenceDisplaySet: srDisplaySet,
  };
}
