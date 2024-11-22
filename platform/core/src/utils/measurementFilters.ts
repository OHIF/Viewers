/**
 * Returns a filter function which filters for measurements belonging to both
 * the study and series.
 */
export function filterTracked(trackedStudy: string, trackedSeries) {
  return measurement => {
    const result =
      trackedStudy === measurement.referenceStudyUID &&
      trackedSeries.includes(measurement.referenceSeriesUID);
    return result;
  };
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
 *  Filters the measurements which are found in any of the filters in the provided
 * object.  This can be used to query for any matching of a set.
 * This passes the this argument to the child function(s)
 */
export function filterOr(measurementFilters) {
  return function (item) {
    for (const filter of Object.values(measurementFilters)) {
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
export function filterAdditionalFinding(measurementService) {
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
