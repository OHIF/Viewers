import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';

import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

/**
 * Boolean helper to identify if a series instance is active in some viewport
 */
Template.registerHelper('isDisplaySetActive', (displaySetInstanceUid, viewportIndex) => {
    // Run this computation every time the viewports are updated
    Session.get('LayoutManagerUpdated');

    // Stop here if layoutManager is not defined yet
    if (!OHIF.viewerbase.layoutManager) {
        return;
    }

    // Check if the display set is current visible in any of the layout
    // manager's displayed viewports. Note that we have to check the 
    // onscreen number of viewports here, since the layout manager will
    // keep the viewport data of old viewports, even after the layout is changed.
    //
    // This behaviour is intentional. If the user displays four viewports, then assigns
    // display sets to them, and then switches to / from another layout configuration,
    // we don't want them to lose their specified viewports.
    let result = false;
    if (_.isUndefined(viewportIndex)) {
        // Get the number of viewports that are currently displayed
        // (Note, viewportData may have more entries!)
        const currentNumberOfViewports = OHIF.viewerbase.layoutManager.getNumberOfViewports();

        // Loop through the viewport data up until the currently displayed
        // number of viewports
        const viewportData = OHIF.viewerbase.layoutManager.viewportData;
        for (let i = 0; i < currentNumberOfViewports; i++) {
            const data = viewportData[i];

            // If the display set is displayed in this viewport and is active, stop here
            if (data && data.displaySetInstanceUid === displaySetInstanceUid) {
                result = true;
                break;
            }
        }
    } else {
        const data = OHIF.viewerbase.layoutManager.viewportData[viewportIndex];

        // If the display set is displayed in this viewport, stop here
        if (data && data.displaySetInstanceUid === displaySetInstanceUid) {
            result = true;
        }
    }

    return result;
});
