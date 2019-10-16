const LOW_PRIORITY_MODALITIES = Object.freeze(['SEG', 'KO', 'PR']);

export default function isLowPriorityModality(modality) {
  return LOW_PRIORITY_MODALITIES.includes(modality);
}
