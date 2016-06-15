/**
 * Boolean helper to identify if a series instance is active in some viewport
 */
Template.registerHelper('isSeriesActive', (seriesInstanceUid, viewportIndex) => {
    // Register dependency on Session key that is changed
    // when viewports are updated
    Session.get('LayoutManagerUpdated');

    // Stop here if layoutManager is not defined yet
    if (!layoutManager) {
        return;
    }

    let viewportData;
    if (_.isUndefined(viewportIndex)) {
        viewportData = layoutManager.viewportData;
    } else {
        viewportData = [layoutManager.viewportData[viewportIndex]];
    }

    let result = false;
    _.each(viewportData, data => {
        if (data.seriesInstanceUid === seriesInstanceUid) {
            result = true;
        }
    });

    return result;
});
