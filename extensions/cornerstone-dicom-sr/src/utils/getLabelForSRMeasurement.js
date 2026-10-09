import getLabelFromDCMJSImportedToolData from './getLabelFromDCMJSImportedToolData';

/**
 * Single display label for SR preview annotations, matching hydrate + measurement panel:
 * free-text finding site before free-text finding before coded finding (see getLabelFromDCMJSImportedToolData).
 */
export default function getLabelForSRMeasurement(measurement) {
  if (!measurement) {
    return undefined;
  }
  const { srFinding, srFindingSites, labels } = measurement;
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
