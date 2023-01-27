export default function getModalities(Modality, ModalitiesInStudy) {
  if (!Modality && !ModalitiesInStudy) {
    return {};
  }

  const modalities = Modality || {
    vr: 'CS',
    Value: [],
  };

  // Rare case, depending on the DICOM server we are using, but sometimes,
  // modalities.Value is undefined or null.
  modalities.Value = modalities.Value || [];

  if (ModalitiesInStudy) {
    if (modalities.vr && modalities.vr === ModalitiesInStudy.vr) {
      for (let i = 0; i < ModalitiesInStudy.Value.length; i++) {
        const value = ModalitiesInStudy.Value[i];
        if (modalities.Value.indexOf(value) === -1) {
          modalities.Value.push(value);
        }
      }
    } else {
      return ModalitiesInStudy;
    }
  }

  return modalities;
}
