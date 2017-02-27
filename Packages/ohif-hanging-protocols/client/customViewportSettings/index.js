// Define an empty object to store callbacks that are used to apply custom viewport settings
// after a viewport is rendered.
HP.CustomViewportSettings = {};

/**
 * Adds a custom setting that can be chosen in the HangingProtocol UI and applied to a Viewport
 *
 * @param settingId The ID used to refer to the setting (e.g. 'displayCADMarkers')
 * @param settingName The name of the setting to be displayed (e.g. 'Display CAD Markers')
 * @param options
 * @param callback A function to be run after a viewport is rendered with a series
 */
HP.addCustomViewportSetting = (settingId, settingName, options, callback) => {
    HP.CustomViewportSettings[settingId] = {
        id: settingId,
        text: settingName,
        options: options,
        callback: callback
    };
};