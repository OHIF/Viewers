import { OHIF } from 'meteor/ohif:core';

/**
 * Render the viewer with the given routing context and parameters
 *
 * @param {Context} context Context of the router
 * @param {Object} params Parameters that will be used to prepare the viewer data
 */
export const renderViewer = (context, params, layoutTemplate='app') => {
    // Wait until the viewer data is ready to render it
    const promise = OHIF.viewerbase.prepareViewerData(params);

    // Show loading state while preparing the viewer data
    OHIF.ui.showDialog('dialogLoading', { promise });

    // Render the viewer when the data is ready
    promise.then(({ studies, viewerData }) => {
        OHIF.viewer.data = viewerData;
        context.render(layoutTemplate, {
            data: {
                template: 'viewer',
                studies
            }
        });
    }).catch(error => {
        context.render(layoutTemplate, {
            data: {
                template: 'errorText',
                error
            }
        });
    });
};
