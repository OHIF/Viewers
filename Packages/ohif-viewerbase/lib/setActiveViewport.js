setActiveViewport = element => {
    if (!element) {
        return;
    }

    const viewportIndex = $('.imageViewerViewport').index(element);
    const jQueryElement = $(element);

    // When an ActivateViewport event is fired, update the Meteor Session
    // with the viewport index that it was fired from.
    Session.set('activeViewport', viewportIndex);

    // Update the Session variable to the UI re-renders
    Session.set('LayoutManagerUpdated', Random.id());

    // Add the 'active' class to the parent container to highlight the active viewport
    $('#imageViewerViewports .viewportContainer').removeClass('active');
    jQueryElement.parents('.viewportContainer').addClass('active');

    // Finally, enable stack prefetching and hide the reference lines from
    // the newly activated viewport that has a canvas

    if (jQueryElement.find('canvas').length) {
        // Cornerstone Tools compare DOM elements (check getEnabledElement cornerstone function)
        // so we can't pass a jQuery object as an argument, otherwise it throws an excepetion
        const domElement = jQueryElement.get(0);
        enablePrefetchOnElement(domElement);
        displayReferenceLines(domElement);
    }

    // Set the div to focused, so keypress events are handled
    //$(element).focus();
    //.focus() event breaks in FF&IE
    jQueryElement.triggerHandler('focus');
};
