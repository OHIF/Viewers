import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

Meteor.startup(() => {
    // This checking is necessary because cornerstoneTools may not have some tools available.
    // Example: when an app defines its own cornerstone's lib versions, so it 
    // uses only ohif-viewerbase and not ohif-cornerstone and those libs are added later.
    if (cornerstoneTools.loadHandlerManager) {
        cornerstoneTools.loadHandlerManager.setStartLoadHandler(startLoadingHandler);
        cornerstoneTools.loadHandlerManager.setEndLoadHandler(doneLoadingHandler);
        cornerstoneTools.loadHandlerManager.setErrorLoadingHandler(errorLoadingHandler);
    }
});

let loadHandlerTimeout;

const startLoadingHandler = element => {
    clearTimeout(loadHandlerTimeout);
    loadHandlerTimeout = setTimeout(() => {
        console.log('startLoading');
        const elem = $(element);
        elem.siblings('.imageViewerErrorLoadingIndicator').css('display', 'none');
        elem.find('canvas').not('.magnifyTool').addClass('faded');
        elem.siblings('.imageViewerLoadingIndicator').css('display', 'block');
    }, OHIF.viewer.loadIndicatorDelay);
};

const doneLoadingHandler = element => {
    clearTimeout(loadHandlerTimeout);
    const elem = $(element);
    elem.siblings('.imageViewerErrorLoadingIndicator').css('display', 'none');
    elem.find('canvas').not('.magnifyTool').removeClass('faded');
    elem.siblings('.imageViewerLoadingIndicator').css('display', 'none');
};

const errorLoadingHandler = (element, imageId, error, source) => {
    clearTimeout(loadHandlerTimeout);
    const elem = $(element);

    // Could probably chain all of these, but this is more readable
    elem.find('canvas').not('.magnifyTool').removeClass('faded');
    elem.siblings('.imageViewerLoadingIndicator').css('display', 'none');

    // Don't display errors from the stackPrefetch tool
    if (source === 'stackPrefetch') {
        return;
    }

    const errorLoadingIndicator = elem.siblings('.imageViewerErrorLoadingIndicator');
    errorLoadingIndicator.css('display', 'block');

    // This is just used to expand upon some error messages that are sent
    // when things fail. An example is a network error throwing the error
    // which is only described as "network".
    const errorDetails = {
        network: 'A network error has occurred'
        // We need to expand this further when we see more obscure error messages
    };

    if (errorDetails.hasOwnProperty(error)) {
        error = errorDetails[error];
    }

    errorLoadingIndicator.find('.description').text(`An error has occurred while loading image: ${imageId}`);
    if (error) {
        errorLoadingIndicator.find('.details').text(`Details: ${error}`);
    }
};

Template.loadingIndicator.helpers({
    'percentComplete'() {
        const percentComplete = Session.get('CornerstoneLoadProgress' + this.viewportIndex);
        if (percentComplete && percentComplete !== 100) {
            return `${percentComplete}%`;
        }
    }
});
