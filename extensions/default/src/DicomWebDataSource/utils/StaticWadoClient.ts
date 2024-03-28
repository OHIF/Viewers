import { api } from 'dicomweb-client';
import fixMultipart from './fixMultipart';

const { DICOMwebClient } = api;

const anyDicomwebClient = DICOMwebClient as any;

// Ugly over-ride, but the internals aren't otherwise accessible.
if (!anyDicomwebClient._orig_buildMultipartAcceptHeaderFieldValue) {
  anyDicomwebClient._orig_buildMultipartAcceptHeaderFieldValue =
    anyDicomwebClient._buildMultipartAcceptHeaderFieldValue;
  anyDicomwebClient._buildMultipartAcceptHeaderFieldValue = function (mediaTypes, acceptableTypes) {
    if (mediaTypes.length === 1 && mediaTypes[0].mediaType.endsWith('/*')) {
      return '*/*';
    } else {
      return anyDicomwebClient._orig_buildMultipartAcceptHeaderFieldValue(
        mediaTypes,
        acceptableTypes
      );
    }
  };
}

/**
 * An implementation of the static wado client, that fetches data from
 * a static response rather than actually doing real queries.  This allows
 * fast encoding of test data, but because it is static, anything actually
 * performing searches doesn't work.  This version fixes the query issue
 * by manually implementing a query option.
 */

export default class StaticWadoClient extends api.DICOMwebClient {
  static studyFilterKeys = {
    studyinstanceuid: '0020000D',
    patientname: '00100010',
    '00100020': 'mrn',
    studydescription: '00081030',
    studydate: '00080020',
    modalitiesinstudy: '00080061',
    accessionnumber: '00080050',
  };

  static seriesFilterKeys = {
    seriesinstanceuid: '0020000E',
    seriesnumber: '00200011',
    modality: '00080060',
  };

  protected config;
  protected staticWado;

  constructor(config) {
    super(config);
    this.staticWado = config.staticWado;
    this.config = config;
  }

  /**
   * Handle improperly specified multipart/related return type.
   * Note if the response is SUPPOSED to be multipart encoded already, then this
   * will double-decode it.
   *
   * @param options
   * @returns De-multiparted response data.
   *
   */
  public retrieveBulkData(options): Promise<any[]> {
    const shouldFixMultipart = this.config.fixBulkdataMultipart !== false;
    const useOptions = {
      ...options,
    };
    if (this.staticWado) {
      useOptions.mediaTypes = [{ mediaType: 'application/*' }];
    }
    return super
      .retrieveBulkData(useOptions)
      .then(result => (shouldFixMultipart ? fixMultipart(result) : result));
  }

  /**
   * Retrieves instance frames using the image/* media type when configured
   * to do so (static wado back end).
   */
  public retrieveInstanceFrames(options) {
    if (this.staticWado) {
      return super.retrieveInstanceFrames({
        ...options,
        mediaTypes: [{ mediaType: 'image/*' }],
      });
    } else {
      return super.retrieveInstanceFrames(options);
    }
  }

  /**
   * Replace the search for studies remote query with a local version which
   * retrieves a complete query list and then sub-selects from it locally.
   * @param {*} options
   * @returns
   */
  async searchForStudies(options) {
    if (!this.staticWado) {
      return super.searchForStudies(options);
    }

    const searchResult = await super.searchForStudies(options);
    const { queryParams } = options;

    if (!queryParams) {
      return searchResult;
    }

    const lowerParams = this.toLowerParams(queryParams);
    const filtered = searchResult.filter(study => {
      for (const key of Object.keys(StaticWadoClient.studyFilterKeys)) {
        if (!this.filterItem(key, lowerParams, study, StaticWadoClient.studyFilterKeys)) {
          return false;
        }
      }
      return true;
    });
    return filtered;
  }

  async searchForSeries(options) {
    if (!this.staticWado) {
      return super.searchForSeries(options);
    }

    const searchResult = await super.searchForSeries(options);
    const { queryParams } = options;
    if (!queryParams) {
      return searchResult;
    }
    const lowerParams = this.toLowerParams(queryParams);

    const filtered = searchResult.filter(series => {
      for (const key of Object.keys(StaticWadoClient.seriesFilterKeys)) {
        if (!this.filterItem(key, lowerParams, series, StaticWadoClient.seriesFilterKeys)) {
          return false;
        }
      }
      return true;
    });

    return filtered;
  }

  /**
   * Compares values, matching any instance of desired to any instance of
   * actual by recursively go through the paired set of values.  That is,
   * this is O(m*n) where m is how many items in desired and n is the length of actual
   * Then, at the individual item node, compares the Alphabetic name if present,
   * and does a sub-string matching on string values, and otherwise does an
   * exact match comparison.
   *
   * @param {*} desired
   * @param {*} actual
   * @returns true if the values match
   */
  compareValues(desired, actual) {
    if (Array.isArray(desired)) {
      return desired.find(item => this.compareValues(item, actual));
    }
    if (Array.isArray(actual)) {
      return actual.find(actualItem => this.compareValues(desired, actualItem));
    }
    if (actual?.Alphabetic) {
      actual = actual.Alphabetic;
    }
    if (typeof actual == 'string') {
      if (actual.length === 0) {
        return true;
      }
      if (desired.length === 0 || desired === '*') {
        return true;
      }
      if (desired[0] === '*' && desired[desired.length - 1] === '*') {
        // console.log(`Comparing ${actual} to ${desired.substring(1, desired.length - 1)}`)
        return actual.indexOf(desired.substring(1, desired.length - 1)) != -1;
      } else if (desired[desired.length - 1] === '*') {
        return actual.indexOf(desired.substring(0, desired.length - 1)) != -1;
      } else if (desired[0] === '*') {
        return actual.indexOf(desired.substring(1)) === actual.length - desired.length + 1;
      }
    }
    return desired === actual;
  }

  /** Compares a pair of dates to see if the value is within the range */
  compareDateRange(range, value) {
    if (!value) {
      return true;
    }
    const dash = range.indexOf('-');
    if (dash === -1) {
      return this.compareValues(range, value);
    }
    const start = range.substring(0, dash);
    const end = range.substring(dash + 1);
    return (!start || value >= start) && (!end || value <= end);
  }

  /**
   * Filters the return list by the query parameters.
   *
   * @param anyCaseKey - a possible search key
   * @param queryParams -
   * @param {*} study
   * @param {*} sourceFilterMap
   * @returns
   */
  filterItem(key: string, queryParams, study, sourceFilterMap) {
    const altKey = sourceFilterMap[key] || key;
    if (!queryParams) {
      return true;
    }
    const testValue = queryParams[key] || queryParams[altKey];
    if (!testValue) {
      return true;
    }
    const valueElem = study[key] || study[altKey];
    if (!valueElem) {
      return false;
    }
    if (valueElem.vr === 'DA' && valueElem.Value?.[0]) {
      return this.compareDateRange(testValue, valueElem.Value[0]);
    }
    const value = valueElem.Value;
    return this.compareValues(testValue, value);
  }

  /** Converts the query parameters to lower case query parameters */
  toLowerParams(queryParams: Record<string, unknown>): Record<string, unknown> {
    const lowerParams = {};
    Object.entries(queryParams).forEach(([key, value]) => {
      lowerParams[key.toLowerCase()] = value;
    });
    return lowerParams;
  }
}
