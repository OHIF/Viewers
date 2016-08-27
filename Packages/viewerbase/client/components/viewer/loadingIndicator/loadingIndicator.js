import { OHIF } from 'meteor/ohif:core';

Meteor.startup(function() {
    cornerstoneTools.loadHandlerManager.setStartLoadHandler(startLoadingHandler);
    cornerstoneTools.loadHandlerManager.setEndLoadHandler(doneLoadingHandler);
    cornerstoneTools.loadHandlerManager.setErrorLoadingHandler(errorLoadingHandler);
});

var loadHandlerTimeout;

startLoadingHandler = function(element) {
    clearTimeout(loadHandlerTimeout);
    loadHandlerTimeout = setTimeout(function() {
        var elem = $(element);
        elem.siblings('.imageViewerErrorLoadingIndicator').css('display', 'none');
        elem.find('canvas').not('.magnifyTool').addClass("faded");
        elem.siblings('.imageViewerLoadingIndicator').css('display', 'block');
    }, OHIF.viewer.loadIndicatorDelay);
};

doneLoadingHandler = function(element) {
    clearTimeout(loadHandlerTimeout);
    var elem = $(element);
    elem.siblings('.imageViewerErrorLoadingIndicator').css('display', 'none');
    elem.find('canvas').not('.magnifyTool').removeClass("faded");
    elem.siblings('.imageViewerLoadingIndicator').css('display', 'none');
};

errorLoadingHandler = function(element, imageId, error, source) {
    clearTimeout(loadHandlerTimeout);
    var elem = $(element);

    // Could probably chain all of these, but this is more readable
    elem.find('canvas').not('.magnifyTool').removeClass("faded");
    elem.siblings('.imageViewerLoadingIndicator').css('display', 'none');

    // Don't display errors from the stackPrefetch tool
    if (source === "stackPrefetch") {
        return;
    }

    var errorLoadingIndicator = elem.siblings('.imageViewerErrorLoadingIndicator');
    errorLoadingIndicator.css('display', 'block');

    var cleanedImageId = imageId;

    // This is just used to expand upon some error messages that are sent
    // when things fail. An example is a network error throwing the error
    // which is only described as "network".
    var errorDetails = {
        network: "A network error has occurred"
        // We need to expand this further when we see more obscure error messages
    };

    if (errorDetails.hasOwnProperty(error)) {
        error = errorDetails[error];
    }

    errorLoadingIndicator.find('.description').text("An error has occurred while loading image: " + cleanedImageId);
    if (error) {
        errorLoadingIndicator.find('.details').text("Details: " + error);
    }
};

Template.loadingIndicator.helpers({
    'percentComplete'() {
        var percentComplete = Session.get('CornerstoneLoadProgress' + this.viewportIndex);
        if (percentComplete && percentComplete !== 100) {
            return percentComplete + '%';
        }
    }
});
