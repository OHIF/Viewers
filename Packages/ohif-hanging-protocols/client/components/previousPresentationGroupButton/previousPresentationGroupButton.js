Template.previousPresentationGroupButton.helpers({
    /**
     * Check if an earlier stage exists for the user to switch to
     *
     * @returns {boolean} Whether or not an earlier stage exists
     */
    previousNotAvailable() {
        // Run this helper whenever the ProtocolEngine / LayoutManager has changed
        Session.get('LayoutManagerUpdated');

        // If no ProtocolEngine has been defined yet, stop here
        if (!ProtocolEngine) {
            return;
        }

        // Return whether or not the current stage is the first stage
        return ProtocolEngine.stage === 0;
    }
});

Template.previousPresentationGroupButton.events({
    /**
     * Switch to the previous Presentation group
     *
     * @param event The click event on the button
     */
    'click #previousPresentationGroup'(event) {
        // If no ProtocolEngine has been defined yet, do nothing
        if (!ProtocolEngine) {
            return;
        }

        // Stop here if the tool is disabled
        if ($(event.currentTarget).hasClass('disabled')) {
            return;
        }

        // Hide the button's Bootstrap tooltip in case it was shown
        $(event.currentTarget).tooltip('hide');

        // Instruct the ProtocolEngine to switch to the next stage
        ProtocolEngine.previousProtocolStage();
    }
});
