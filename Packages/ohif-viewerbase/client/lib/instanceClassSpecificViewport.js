var instanceClassViewportSettingsFunctions = {};
getInstanceClassDefaultViewport = function(series, enabledElement, imageId) {
    var instanceClass = series.sopClassUid;

    if (!instanceClassViewportSettingsFunctions[instanceClass]) {
        return;
    }

    return instanceClassViewportSettingsFunctions[instanceClass](series, enabledElement, imageId);
};

setInstanceClassDefaultViewportFunction = function(instanceClass, fn) {
    instanceClassViewportSettingsFunctions[instanceClass] = fn;
};