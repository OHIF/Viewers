export function filterTracked(trackedStudy: string, trackedSeries) {
  return measurement => {
    const result =
      trackedStudy === measurement.referenceStudyUID &&
      trackedSeries.includes(measurement.referenceSeriesUID);
    return result;
  };
}

export function filterAny(_measurement) {
  return true;
}

export function filterNone(_measurement) {
  return false;
}

export function filterOthers(...filters) {
  return item => !filters.find(filter => filter(item));
}

export function filterOr(measurementFilters) {
  return item => {
    for (const filter of Object.values(measurementFilters)) {
      if (typeof filter !== 'function') {
        continue;
      }
      if (filter(item)) {
        return true;
      }
    }
    return false;
  };
}

export function filterAdditionalFinding(measurementService) {
  const { POINT } = measurementService.VALUE_TYPES;
  return dm => dm.type === POINT && dm.referencedImageId;
}

export function filterUnless(filterUnless, filterThen) {
  return item => (filterUnless(item) ? false : filterThen(item));
}

const isString = s => typeof s === 'string' || s instanceof String;

export function filterNot(filter) {
  if (isString(filter)) {
    return function (item) {
      return !this[filter](item);
    };
  }
  return item => !filter(item);
}
