const LOW_PRIORITY_MODALITIES = Object.freeze([
  'SEG',
  'DOC',
  'RTSTRUCT',
  'SR',
  'KO',
  'PR',
]);

export default function isLowPriorityModality(Modality) {
  return LOW_PRIORITY_MODALITIES.includes(Modality);
}
