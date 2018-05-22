import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';

import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

/**
 * Add an array index swapping function so we can swap stages more easily
 */
move = function(array, oldIndex, newIndex) {
    var value = array[oldIndex];

    newIndex = Math.max(0, newIndex);
    newIndex = Math.min(array.length, newIndex);

    array.splice(oldIndex, 1);
    array.splice(newIndex, 0, value);
    return array;
};

/**
 * Helper function to obtain the current index of a stage in the
 * current protocol
 *
 * @param protocol The Hanging Protocol to search within
 * @param id The id of the current stage to search for
 * @returns {number} The index of the specified stage within the Protocol,
 *                   or undefined if it is not present.
 */
function getStageIndex(protocol, id) {
    var stageIndex;
    if (!protocol || !protocol.stages) {
        return;
    }

    protocol.stages.forEach(function(stage, index) {
        if (stage.id === id) {
            stageIndex = index;
            return false;
        }
    });

    return stageIndex;
}

Template.stageSortable.helpers({
    /**
     * Checks a specified stage to see if it is currently being displayed
     *
     * @returns {boolean} Whether or not the stage is currently being displayed
     */
    isActiveStage: function() {
        // Rerun this function every time the layout manager has been updated
        Session.get('LayoutManagerUpdated');

        // If no Protocol Engine has been defined yet, stop here to prevent errors
        if (!ProtocolEngine) {
            return;
        }

        var currentStage = ProtocolEngine.getCurrentStageModel();
        if (!currentStage) {
            return false;
        }

        // Return a boolean representing if the active stage and the specified stage index are equal
        return (this.id === currentStage.id);
    },
    /**
     * Retrieves the index of the stage at the point it was last saved
     *
     * @returns {number|*}
     */
    stageLabel: function() {
        var stage = this;

        // If no Protocol Engine has been defined yet, stop here to prevent errors
        if (!ProtocolEngine) {
            return;
        }

        // Retrieve the last saved copy of the current protocol
        var lastSavedCopy = HP.ProtocolStore.getProtocol(ProtocolEngine.protocol.id);

        // Try to find the index of this stage in the previously saved copy
        var stageIndex = getStageIndex(lastSavedCopy, stage.id);

        // If the stage is new, and therefore wasn't present in the last save,
        // retrieve it's index in the array of new stage ids and use that for
        // the label. Also include the time since it was created.
        if (stageIndex === undefined) {
            // Reactively update this helper every minute
            Session.get('timeAgoVariable');

            // Find the index of the stage in the array of newly created stage IDs
            var newStageNumber = ProtocolEngine.newStageIds.indexOf(stage.id) + 1;

            // Use Moment.js to format the createdDate of this stage relative to the
            // current time
            var dateCreatedFromNow = moment(stage.createdDate).fromNow();

            // Return the label for the new stage,
            // e.g. "New Stage 1 (created a few seconds ago)"
            return 'New Stage ' + newStageNumber + ' (created ' + dateCreatedFromNow + ')';
        }

        // If the stage is not new, label it by the index it held in the stages array
        // at the previous saved point
        return 'Stage ' + ++stageIndex;
    },
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

Template.stageSortable.events({
    /**
     * Displays a stage when its title is clicked
     */
    'click .sortable-item span': function() {
        // Retrieve the index of this stage in the display set sequences
        var stageIndex = getStageIndex(ProtocolEngine.protocol, this.id);

        // Display the selected stage
        ProtocolEngine.setCurrentProtocolStage(stageIndex - ProtocolEngine.stage);
    },
    /**
     * Creates a new stage and adds it to the currently loaded Protocol at
     * the end of the display set sequence
     */
    'click #addStage': function() {
        // Retrieve the model describing the current stage
        var stage = ProtocolEngine.getCurrentStageModel();

        // Clone this stage to create a new stage
        var newStage = stage.createClone();

        // Remove the stage's name if it has one
        delete newStage.name;

        // Append this new stage to the end of the display set sequence
        ProtocolEngine.protocol.stages.push(newStage);

        // Append the new stage the list of new stage IDs, so we can label it properly
        ProtocolEngine.newStageIds.push(newStage.id);

        // Switch to the next stage in the display set sequence
        ProtocolEngine.setCurrentProtocolStage(1);
    },
    /**
     * Deletes a stage from the currently loaded Protocol by removing it from
     * the stages array. If it is the currently active stage, the current stage is
     * set to one stage earlier in the display set sequence.
     */
    'click .deleteStage': function() {
        // If this is the only stage in the Protocol, stop here
        if (ProtocolEngine.protocol.stages.length === 1) {
            return;
        }

        var stageId = this.id;

        var options = {
            title: 'Remove Protocol Stage',
            text: 'Are you sure you would like to remove this Protocol Stage? This cannot be reversed.'
        };

        OHIF.viewerbase.dialogUtils.showConfirmDialog(function() {
            // Retrieve the index of this stage in the display set sequences
            var stageIndex = getStageIndex(ProtocolEngine.protocol, stageId);

            // Remove it from the display set sequence
            ProtocolEngine.protocol.stages.splice(stageIndex, 1);

            // If we have removed the currently active stage, switch to the one before it
            if (ProtocolEngine.stage === stageIndex) {
                // Display the previous stage
                ProtocolEngine.setCurrentProtocolStage(-1);
            }

            // Update the Session variable to the UI re-renders
            Session.set('LayoutManagerUpdated', Math.random());
        }, options);
    },

    'click .moveStageUp': function() {
        // Get the old and new indices following a 'sort' event
        var oldIndex = ProtocolEngine.stage;
        var newIndex = Math.max(ProtocolEngine.stage - 1, 0);

        if (oldIndex === newIndex) {
            return;
        }

        // Swap the stages in the current Protocol's display set sequence
        // using our addition to the Array prototype
        ProtocolEngine.protocol.stages = move(ProtocolEngine.protocol.stages, oldIndex, newIndex);

        // If the currently displayed stage was reordered into a new position,
        // update the value for the stage index in the displayed Protocol
        ProtocolEngine.stage = newIndex;

        // Update the Session variable to the UI re-renders
        Session.set('LayoutManagerUpdated', Math.random());
    },
    'click .moveStageDown': function() {
        // Get the old and new indices following a 'sort' event
        var oldIndex = ProtocolEngine.stage;
        var newIndex = Math.min(ProtocolEngine.stage + 1, ProtocolEngine.protocol.stages.length - 1);

        if (oldIndex === newIndex) {
            return;
        }

        // Swap the stages in the current Protocol's display set sequence
        // using our addition to the Array prototype
        ProtocolEngine.protocol.stages = move(ProtocolEngine.protocol.stages.move, oldIndex, newIndex);

        // If the currently displayed stage was reordered into a new position,
        // update the value for the stage index in the displayed Protocol
        ProtocolEngine.stage = newIndex;

        // Update the Session variable to the UI re-renders
        Session.set('LayoutManagerUpdated', Math.random());
    }
});
