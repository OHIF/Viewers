/**
 * This function destroys and re-renders the imageViewerViewport template.
 * It uses the data provided (object containing seriesIndex and studyIndex) to
 * load a new series into the produced viewport.
 *
 * @param element
 * @param data An object containing a seriesIndex and studyIndex for a study to load into this viewport
 * @function renderedCallback An optional callback to be executed after the new template is rendered
 */
rerenderViewportWithNewSeries = function(element, data, renderedCallback) {
    // Get the container and index of the current viewport.
    // The parent container is identified because it is later removed from the DOM
    var container = $(element).parents('.viewportContainer').get(0);
    var viewportIndex = $(container).index();

    // Record the current viewportIndex so this can be passed into the re-rendering call
    data.viewportIndex = viewportIndex;

    // Update the dictionary of loaded series for the specified viewport
    OHIF.viewer.loadedSeriesData[viewportIndex] = {
        seriesInstanceUid: data.seriesInstanceUid,
        studyInstanceUid: data.studyInstanceUid,
        currentImageIdIndex: 0
    };

    // Remove the hover styling
    $(element).find('canvas').not('.magnifyTool').removeClass("faded");

    // Remove the whole template, add in the new one
    var viewportContainer = $(element).parents('.removable');
    
    var newViewportContainer = document.createElement('div');
    newViewportContainer.className = 'removable';

    // Remove the parent element of the template
    // This is a workaround since otherwise Blaze UI onDestroyed doesn't fire
    viewportContainer.remove();

    container.appendChild(newViewportContainer);

    // Pass the renderedCallback to the imageViewerViewport template
    if (renderedCallback && typeof renderedCallback === "function") {
        data.renderedCallback = renderedCallback;
    }

    // Render and insert the template
    UI.renderWithData(Template.imageViewerViewport, data, newViewportContainer);
};