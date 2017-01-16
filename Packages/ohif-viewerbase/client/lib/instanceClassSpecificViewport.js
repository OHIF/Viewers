
const  instanceClassViewportSettingsFunctions = {};

const getInstanceClassDefaultViewport = (series, enabledElement, imageId) => {
    let instanceClass = series.sopClassUid;

    if (!instanceClassViewportSettingsFunctions[instanceClass]) {
        return;
    }

    return instanceClassViewportSettingsFunctions[instanceClass](series, enabledElement, imageId);
};

const setInstanceClassDefaultViewportFunction = (instanceClass, fn) => {
    instanceClassViewportSettingsFunctions[instanceClass] = fn;
};

export { getInstanceClassDefaultViewport, setInstanceClassDefaultViewportFunction };
