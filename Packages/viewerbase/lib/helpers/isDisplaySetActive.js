/**
 * Boolean helper to identify if a series instance is active in some viewport
 */
Template.registerHelper('isDisplaySetActive', (displaySetInstanceUid, viewportIndex) => {
    // Run this computation every time the viewports are updated
    Session.get('LayoutManagerUpdated');

    // Stop here if layoutManager is not defined yet
    if (!layoutManager) {
        return;
    }

    console.warn('>>>>test');
    let viewportData;
    if (_.isUndefined(viewportIndex)) {
        viewportData = layoutManager.viewportData;
    } else {
        viewportData = [layoutManager.viewportData[viewportIndex]];
    }

    let result = false;
    _.each(viewportData, data => {
        if (data && data.displaySetInstanceUid === displaySetInstanceUid) {
            result = true;
        }
    });

    return result;
});
