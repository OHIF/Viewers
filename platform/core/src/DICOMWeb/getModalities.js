export default function getModalities(modality, modalitiesInStudy) {
  if (!modality && !modalitiesInStudy) {
    return {};
  }

  const modalities = modality || {
    vr: 'CS',
    Value: [],
  };

  if (modalitiesInStudy) {
    if (modalities.vr && modalities.vr === modalitiesInStudy.vr) {
      for (let i = 0; i < modalitiesInStudy.Value.length; i++) {
        const value = modalitiesInStudy.Value[i];
        if (modalities.Value.indexOf(value) === -1) {
          modalities.Value.push(value);
        }
      }
    } else {
      return modalitiesInStudy;
    }
  }

  return modalities;
}
