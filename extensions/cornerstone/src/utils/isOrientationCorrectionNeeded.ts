const DEFAULT_AUTO_FLIP_MODALITIES: string[] = ['MG'];

export default function isOrientationCorrectionNeeded(instance) {
  const { Modality } = instance;

  // Check Modality
  const isModalityIncluded = DEFAULT_AUTO_FLIP_MODALITIES.includes(Modality);

  return isModalityIncluded;
}
