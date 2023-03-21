function isPrimitive(v: any) {
  return !(typeof v == 'object' || Array.isArray(v) || typeof v === 'function');
}

/**
 * Specialized for DICOM JSON format dataset cleaning.
 * @param obj
 * @returns
 */
export default function deepCopyAndClean(obj: any): any {
  if (Array.isArray(obj)) {
    const newAry = obj.map(o => (isPrimitive(o) ? o : deepCopyAndClean(o)));
    return newAry;
  } else {
    const newObj = {} as any;
    Object.keys(obj).forEach(key => {
      if (obj[key] === null) {
        // use empty array instead of null, especially the dicom-microscopy-viewer's
        // metadata handler has some bug around null value
        newObj[key] = [];
      } else if (isPrimitive(obj[key])) {
        newObj[key] = obj[key];
      } else {
        newObj[key] = deepCopyAndClean(obj[key]);
      }
    });
    return newObj;
  }
}
