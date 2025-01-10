/**
 * Returns a filter function which filters for measurements belonging to both
 * the study and series.
 */
export function filterMeasurementsBySeriesUID(selectedSeries: string[]) {
  return measurement => selectedSeries.includes(measurement.referenceSeriesUID);
}

/**
 * @returns true for measurements include referencedImageId (coplanar with an image)
 */
export function filterPlanarMeasurement(measurement) {
  return measurement?.referencedImageId;
}

/** A filter that always returns true */
export function filterAny(_measurement) {
  return true;
}

/** A filter that excludes everything */
export function filterNone(_measurement) {
  return false;
}

/**
 *  Filters the measurements which are found in any of the specified
 * filters.  Strings will be looked up by name.
 */
export function filterOr(...filters) {
  return function (item) {
    for (let filter of filters) {
      if (typeof filter === 'string') {
        filter = this[filter];
      }
      if (typeof filter !== 'function') {
        continue;
      }
      if (filter.call(this, item)) {
        return true;
      }
    }
    return false;
  };
}

/**
 * Filters for additional findings, that is, measurements with
 * a value of type point, and having a referenced image
 */
export function filterAdditionalFindings(measurementService) {
  const { POINT } = measurementService.VALUE_TYPES;
  return dm => dm.type === POINT && dm.referencedImageId;
}

/**
 * Returns a filter that applies the second filter unless the first filter would
 * include the given measurement.
 * That is, (!filterUnless) && filterThen
 */
export function filterUnless(filterUnless, filterThen) {
  return item => (filterUnless(item) ? false : filterThen(item));
}

const isString = s => typeof s === 'string' || s instanceof String;

/**
 * Returns true if all the filters return true.
 * Any filter can be a string name of a filter on the "this" object
 * called on the final filter call.
 */
export function filterAnd(...filters) {
  return function (item) {
    for (const filter of filters) {
      if (isString(filter)) {
        if (!this[filter](item)) {
          return false;
        }
      } else if (!filter.call(this, item)) {
        return false;
      }
    }
    return true;
  };
}

/**
 * Returns a filter that returns true if none of the filters supplied return true.
 * Any filter supplied can be a name, in which case hte filter will be retrieved
 * from "this" object on the call.
 *
 * For example, for filterNot("otherFilterName"), if that is called on
 * `{ otherFilterName: filterNone }`
 * then otherFilterName will be called, returning false in this case and
 * filterNot will return true.
 *
 *
 */
export function filterNot(...filters) {
  if (filters.length !== 1) {
    return filterAnd.apply(null, filters.map(filterNot));
  }
  const [filter] = filters;
  if (isString(filter)) {
    return function (item) {
      return !this[filter](item);
    };
  }
  return item => !filter(item);
}
