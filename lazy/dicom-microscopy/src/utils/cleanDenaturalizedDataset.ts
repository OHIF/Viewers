function isPrimitive(v: any) {
  return !(typeof v == 'object' || Array.isArray(v));
}

const vrNumerics = [
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
];

/**
 * Specialized for DICOM JSON format dataset cleaning.
 * @param obj
 * @returns
 */
export default function cleanDenaturalizedDataset(obj: any): any {
  if (Array.isArray(obj)) {
    const newAry = obj.map(o =>
      isPrimitive(o) ? o : cleanDenaturalizedDataset(o)
    );
    return newAry;
  } else if (isPrimitive(obj)) {
    return obj;
  } else {
    Object.keys(obj).forEach(key => {
      if (obj[key].Value === null && obj[key].vr) {
        delete obj[key].Value;
      } else if (Array.isArray(obj[key].Value) && obj[key].vr) {
        if (obj[key].Value.length === 1 && obj[key].Value[0].BulkDataURI) {
          obj[key].BulkDataURI = obj[key].Value[0].BulkDataURI;

          // prevent mixed-content blockage
          if (
            window.location.protocol === 'https:' &&
            obj[key].BulkDataURI.startsWith('http:')
          ) {
            obj[key].BulkDataURI = obj[key].BulkDataURI.replace(
              'http:',
              'https:'
            );
          }
          delete obj[key].Value;
        } else if (vrNumerics.includes(obj[key].vr)) {
          obj[key].Value = obj[key].Value.map(v => +v);
        } else {
          obj[key].Value = obj[key].Value.map(cleanDenaturalizedDataset);
        }
      }
    });
    return obj;
  }
}
