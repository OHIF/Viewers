setActiveViewport = function(element) {
    if (!element) {
        return;
    }

    var viewportIndex = $('.imageViewerViewport').index(element);

    // When an ActivateViewport event is fired, update the Meteor Session
    // with the viewport index that it was fired from.
    Session.set("activeViewport", viewportIndex);

    // Add the 'active' class to the parent container to highlight the active viewport
    $('#imageViewerViewports .viewportContainer').removeClass('active');
    $(element).parents('.viewportContainer').addClass('active');

    // Finally, enable stack prefetching and hide the reference lines from
    // the newly activated viewport
    enablePrefetchOnElement(element);
    displayReferenceLines(element);

    // Set the div to focused, so keypress events are handled
    //$(element).focus();
    //.focus() event breaks in FF&IE
    $(element).triggerHandler("focus");
};