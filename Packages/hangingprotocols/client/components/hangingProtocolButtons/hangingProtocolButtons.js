Template.hangingProtocolButtons.helpers({
    /**
     * Check if a later stage exists for the user to switch to
     *
     * @returns {boolean} Whether or not a later stage exists
     */
    isNextAvailable: function() {
        // Run this helper whenever the ProtocolEngine / LayoutManager has changed
        Session.get('LayoutManagerUpdated');

        // If no ProtocolEngine has been defined yet, stop here
        if (!ProtocolEngine) {
            return;
        }

        // Return whether or not the current stage is the last stage
        return ProtocolEngine.stage < ProtocolEngine.getNumProtocolStages() - 1;
    },
    /**
     * Check if an earlier stage exists for the user to switch to
     *
     * @returns {boolean} Whether or not an earlier stage exists
     */
    isPreviousAvailable: function() {
        // Run this helper whenever the ProtocolEngine / LayoutManager has changed
        Session.get('LayoutManagerUpdated');

        // If no ProtocolEngine has been defined yet, stop here
        if (!ProtocolEngine) {
            return;
        }

        // Return whether or not the current stage is the first stage
        return ProtocolEngine.stage > 0;
    }
});

Template.hangingProtocolButtons.events({
    /**
     * Switch to the previous Presentation group
     *
     * @param event The click event on the button
     */
    'click #previousPresentationGroup': function(event) {
        // If no ProtocolEngine has been defined yet, do nothing
        if (!ProtocolEngine) {
            return;
        }

        // Hide the button's Bootstrap tooltip in case it was shown
        $(event.currentTarget).tooltip('hide');

        // Instruct the ProtocolEngine to switch to the next stage
        ProtocolEngine.previousProtocolStage();
    },
    /**
     * Switch to the next Presentation group
     *
     * @param event The click event on the button
     */
    'click #nextPresentationGroup': function(event) {
        // If no ProtocolEngine has been defined yet, do nothing
        if (!ProtocolEngine) {
            return;
        }

        // Hide the button's Bootstrap tooltip in case it was shown
        $(event.currentTarget).tooltip('hide');

        // Instruct the ProtocolEngine to switch to the next stage
        ProtocolEngine.nextProtocolStage();
    }
}); 
