export default function getModalities(modality, modalitiesInStudy) {
    var modalities = {};
    if (modality) {
        modalities = modality;
    }

    if (modalitiesInStudy) {
        // Find vr in modalities
        if (modalities.vr && modalities.vr === modalitiesInStudy.vr) {
            for (var i = 0; i < modalitiesInStudy.Value.length; i++) {
                var value = modalitiesInStudy.Value[i];
                if (modalities.Value.indexOf(value) === -1) {
                    modalities.Value.push(value);
                }
            }
        } else {
            modalities = modalitiesInStudy;
        }
    }
    return modalities;
};
