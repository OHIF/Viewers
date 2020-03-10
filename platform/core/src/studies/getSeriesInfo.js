import DICOMWeb from '../DICOMWeb/';
import isLowPriorityModality from '../utils/isLowPriorityModality';

const INFO = Symbol('INFO');

/**
 * Creates an object with processed series information and saves its reference
 * inside the series object itself.
 * @param {Object} series The raw series object
 * @returns {Object} object containing some useful info from given series
 */
export default function getSeriesInfo(series) {
  let info = series[INFO];
  if (!info) {
    const Modality = DICOMWeb.getString(series['00080060'], '').toUpperCase();
    info = Object.freeze({
      Modality,
      isLowPriority: isLowPriorityModality(Modality),
      SeriesInstanceUID: DICOMWeb.getString(series['0020000E']),
      SeriesNumber: DICOMWeb.getNumber(series['00200011'], 0) || 0,
    });
    series[INFO] = info;
  }
  return info;
}
