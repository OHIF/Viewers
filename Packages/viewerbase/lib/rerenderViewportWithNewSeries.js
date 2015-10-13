/**
 * This function destroys and rerenders the imageViewerViewport template.
 * It uses the data provided (object containing seriesIndex and studyIndex) to
 * load a new series into the produced viewport.
 *
 * @param element
 * @param data An object containing a seriesIndex and studyIndex for a study to load into this viewport
 */
rerenderViewportWithNewSeries = function(element, data) {
    var container = $(element).parents('.viewportContainer').get(0);
    var viewportIndex = $(container).index();
    data.viewportIndex = viewportIndex;

    // Update the dictionary of loaded series for the specified viewport
    OHIF.viewer.imageViewerLoadedSeriesDictionary[viewportIndex] = {
        seriesInstanceUid: data.seriesInstanceUid,
        studyInstanceUid: data.studyInstanceUid
    };

    // Remove the hover styling
    $(element).find('canvas').not('.magnifyTool').removeClass("faded");

    // Reset the current image index for this viewport
    delete OHIF.viewer.imageViewerCurrentImageIdIndexDictionary[viewportIndex];

    // Remove the whole template, add in the new one
    var viewportContainer = $(element).parents('.removable');
    
    var newViewportContainer = document.createElement('div');
    newViewportContainer.className = 'removable';

    // Remove the parent element of the template
    // This is a workaround since otherwise Blaze UI onDestroyed doesn't fire
    viewportContainer.remove();

    container.appendChild(newViewportContainer);

    // Render and insert the template
    UI.renderWithData(Template.imageViewerViewport, data, newViewportContainer);

    Session.set('loadedSeriesDictionary', OHIF.viewer.imageViewerLoadedSeriesDictionary);
};