import getLabelFromDCMJSImportedToolData from './getLabelFromDCMJSImportedToolData';

/**
 * Single display label for SR preview annotations, matching the label of the hydrated annotation:
 * the comment first (as in the SR adapter), then the free-text finding site, then the finding
 * (see getLabelFromDCMJSImportedToolData).
 */
export default function getLabelForSRMeasurement(measurement) {
  if (!measurement) {
    return undefined;
  }
  const { srComment, srFinding, srFindingSites, labels } = measurement;
  if (srComment) {
    return srComment;
  }
  if (srFinding || (srFindingSites && srFindingSites.length)) {
    const fromConcepts = getLabelFromDCMJSImportedToolData({
      annotation: { data: {} },
      finding: srFinding,
      findingSites: srFindingSites || [],
    });
    if (fromConcepts) {
      return fromConcepts;
    }
  }
  return _labelFromFindingSiteLine(labels);
}

function _labelFromFindingSiteLine(labels) {
  const siteLine = labels?.find(
    e => typeof e?.label === 'string' && /finding site/i.test(e.label) && e.value
  );
  return siteLine ? String(siteLine.value) : undefined;
}
