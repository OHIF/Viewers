import { fixBulkDataURI } from './fixBulkDataURI';

function isPrimitive(v: any) {
  return !(typeof v == 'object' || Array.isArray(v));
}

const vrNumerics = new Set([
  'DS',
  'FL',
  'FD',
  'IS',
  'OD',
  'OF',
  'OL',
  'OV',
  'SL',
  'SS',
  'SV',
  'UL',
  'US',
  'UV',
]);

/**
 * Specialized for DICOM JSON format dataset cleaning.
 * @param obj
 * @returns
 */
export function cleanDenaturalizedDataset(
  obj: any,
  options?: {
    StudyInstanceUID: string;
    SeriesInstanceUID: string;
    dataSourceConfig: unknown;
  }
): any {
  if (Array.isArray(obj)) {
    const newAry = obj.map(o => (isPrimitive(o) ? o : cleanDenaturalizedDataset(o, options)));
    return newAry;
  }
  if (isPrimitive(obj)) {
    return obj;
  }
  Object.keys(obj).forEach(key => {
    if (obj[key].Value === null && obj[key].vr) {
      delete obj[key].Value;
    } else if (Array.isArray(obj[key].Value) && obj[key].vr) {
      if (obj[key].Value.length === 1 && obj[key].Value[0].BulkDataURI) {
        if (options?.dataSourceConfig) {
          // Not needed unless data source is directly used for loading data.
          fixBulkDataURI(obj[key].Value[0], options, options.dataSourceConfig);
        }

        obj[key].BulkDataURI = obj[key].Value[0].BulkDataURI;

        // prevent mixed-content blockage
        if (window.location.protocol === 'https:' && obj[key].BulkDataURI.startsWith('http:')) {
          obj[key].BulkDataURI = obj[key].BulkDataURI.replace('http:', 'https:');
        }
        delete obj[key].Value;
      } else if (vrNumerics.has(obj[key].vr)) {
        obj[key].Value = obj[key].Value.map(v => +v);
      } else {
        obj[key].Value = obj[key].Value.map(entry => cleanDenaturalizedDataset(entry, options));
      }
    }
  });
  return obj;
}

/**
 * This is required to make the denaturalized data transferrable when it has
 * added proxy values.
 */
export function transferDenaturalizedDataset(dataset) {
  const noNull = cleanDenaturalizedDataset(dataset);
  return JSON.parse(JSON.stringify(noNull));
}
