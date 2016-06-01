getActiveViewportModel = function() {
    // If no ProtocolEngine has been defined yet, or there is
    // no currently displayed Protocol or Stage, stop here
    if (!ProtocolEngine ||
        !ProtocolEngine.protocol ||
        ProtocolEngine.stage === undefined) {
        return;
    }

    // Retrieve the model of the currently displayed stage
    var stage = ProtocolEngine.getCurrentStageModel();

    // Retrieve the index of the active viewport
    var activeViewport = Session.get('activeViewport');

    // If the active viewport index is outside the bounds of the
    // number of Viewports defined for this Stage, stop here
    if (activeViewport >= stage.viewports.length) {
        return;
    }

    // Return the Viewport model for this viewport index in the
    // current stage
    return stage.viewports[activeViewport];
};

Template.stageDetails.helpers({
    /**
     * Retrieves the ViewportModel for the active viewport from the
     * currently displayed Protocol and display sequence Stage
     *
     * @returns {*} The Viewport model for the active viewport
     */
    activeViewport: function() {
        // Run this function anytime the layout manager has changed
        Session.get('LayoutManagerUpdated');

        return getActiveViewportModel();
    }
});
