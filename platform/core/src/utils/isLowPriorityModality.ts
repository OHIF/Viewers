const LOW_PRIORITY_MODALITIES = Object.freeze([
  'SEG',
  'KO',
  'PR',
  'SR',
  'RTSTRUCT',
  'RTDOSE',
  'RTPLAN',
  'RTRECORD',
  'REG',
]);

export default function isLowPriorityModality(Modality) {
  return LOW_PRIORITY_MODALITIES.includes(Modality);
}
