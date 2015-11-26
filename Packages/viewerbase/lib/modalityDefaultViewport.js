var modalityViewportSettingsFunctions = {};
getModalityDefaultViewport = function(series, enabledElement, imageId) {
    var modality = series.modality;

    if (!modalityViewportSettingsFunctions[modality]) {
        return;
    }

    return modalityViewportSettingsFunctions[modality](series, enabledElement, imageId);
};

setModalityDefaultViewportFunction = function(modality, fn) {
    modalityViewportSettingsFunctions[modality] = fn;
};