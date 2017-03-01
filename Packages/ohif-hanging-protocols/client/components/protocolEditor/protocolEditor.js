import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import { $ } from 'meteor/jquery';

import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

/**
 * Updates the Hanging Protocol Select2 Input
 */
function updateProtocolSelect() {
    if (!ProtocolEngine) {
        return;
    }
    
    // Loop through the available hanging protocols
    // to create an array with the protocols that includes
    // a property labelled 'text', so that Select2 has something
    // to display
    var protocolsSelect2Data = HP.ProtocolStore.getProtocol().map(function(protocol) {
        return {
            id: protocol.id,
            text: protocol.name
        };
    });

    // Select the Protocol select DOM element
    var protocolSelect = $('#protocolSelect');

    // Empty the element using Select2 for rerendering
    protocolSelect.select2().empty();

    // Initialize the select element with Select2 using the
    // array of protocols
    protocolSelect.select2({
        data: protocolsSelect2Data
    });

    // Update the ProtocolSelector to display the current active Protocol
    protocolSelect.select2().val(ProtocolEngine.protocol.id).trigger('change');
}

Template.protocolEditor.onRendered(() => {
    const instance = Template.instance();

    instance.timeAgoInterval = Meteor.setInterval(() => {
        // Run this every minute
        Session.set('timeAgoVariable', new Date());
    }, 60000);

    // Update the Protocol select box when the hanging protocol store is ready
    HP.ProtocolStore.onReady(() => {
        updateProtocolSelect();
    });
});

Template.protocolEditor.onDestroyed(() => {
    const instance = Template.instance();

    Meteor.clearInterval(instance.timeAgoInterval);
});

Template.protocolEditor.helpers({
    /**
     * Reactively updates the active Protocol
     *
     * @returns {*} The currently active Protocol Model
     */
    activeProtocol() {
        // Whenever the Layout Manager is updated, trigger this helper
        Session.get('LayoutManagerUpdated');

        // If no ProtocolEngine, protocol, or stage is defined, stop here
        if (!ProtocolEngine ||
            !ProtocolEngine.protocol ||
            !ProtocolEngine.LayoutManager ||
            ProtocolEngine.stage === undefined) {
            return;
        }

        // Update the Protocol Select box
        updateProtocolSelect();

        // Make sure that the number of referenced priors is correct
        ProtocolEngine.protocol.updateNumberOfPriorsReferenced();
        
        // Otherwise, return the active Hanging Protocol
        return ProtocolEngine.protocol;
    },
    /**
     * Reactively updates the active Protocol Stage
     *
     * @returns {*} The current Protocol's active Stage model
     */
    activeStage() {
        // Whenever the Layout Manager is updated, trigger this helper
        Session.get('LayoutManagerUpdated');

        // If no ProtocolEngine, protocol, or stage is defined, stop here
        if (!ProtocolEngine ||
            !ProtocolEngine.protocol ||
            !ProtocolEngine.LayoutManager ||
            ProtocolEngine.stage === undefined) {
            return;
        }

        // Retrieve the Stage Model for the current Protocol's active Stage
        var stage = ProtocolEngine.getCurrentStageModel();
        if (!stage) {
            return;
        }

        // Update active Stage's layout template and properties based on the displayed
        // layout properties. This is used to update the Stage Model when the user modifies
        // the layout in the viewer
        stage.viewportStructure.layoutTemplateName = ProtocolEngine.LayoutManager.layoutTemplateName;
        stage.viewportStructure.properties = ProtocolEngine.LayoutManager.layoutProps;

        // If there is a discrepancy between the Stage's number of viewports and the
        // the number of required viewports given the properties above, rectify it
        // by removing or adding Viewports to the stage
        //
        // First, calculate the difference, if any exists
        var difference = stage.viewportStructure.getNumViewports() - stage.viewports.length;

        if (difference < 0) {
            // Make the viewport difference into a positive value
            var absDifference = Math.abs(difference);

            // If there are more Viewports defined than necessary, remove the extraneous Viewports
            var position = stage.viewports.length - absDifference;

            // Splice extra viewports from the Stage's viewports array
            stage.viewports.splice(position, absDifference);
        } else if (difference > 0) {
            // If there are less Viewports defined than necessary, add viewports until we reach the
            // required amount

            // Count up until the difference in number of Viewports
            for (var i = 0; i < difference; i++) {
                // Instantiate a new Viewport Model
                var viewport = new HP.Viewport();

                // Add new Viewports to the Stage's viewports array
                stage.viewports.push(viewport);
            }
        }
        
        // Return the current Stage model for the active Protocol
        return ProtocolEngine.getCurrentStageModel();
    },
    activeViewportUndefined() {
        const viewportIndex = Session.get('activeViewport');
        return (viewportIndex === undefined);
    }
});

Template.protocolEditor.events({
    /**
     * Creates a new Hanging Protocol and displays it in the Viewer
     */
    'click #newProtocol'() {
        // Clone the default Protocol
        var protocol = HP.defaultProtocol.createClone();

        // Change the Protocol name to state that it is New, and give it a timestamp
        protocol.name = 'New (created ' + moment().format('h:mm:ss a') + ')';

        // Change the Protocol ID from the default value
        protocol.id = Random.id();

        // Insert the protocol
        HP.ProtocolStore.addProtocol(protocol);

        // Activate the new Protocol using the ProtocolEngine
        ProtocolEngine.setHangingProtocol(protocol);

        // Update the protocol selector to display the new Protocols
        updateProtocolSelect();
    },
    /**
     * Rename the current Protocol
     */
    'click #renameProtocol'() {
        var selectedProtocol = this;
        if (selectedProtocol.locked) {
            return;
        }

        // Define some details for the text entry dialog
        var title = 'Rename Protocol';
        var instructions = 'Enter a new name';
        var currentValue = selectedProtocol.name;

        // Open the text entry dialog with the details above
        // and fire the callback function when finished.
        openTextEntryDialog(title, instructions, currentValue, function(value) {
            // Update the name with the entered text
            selectedProtocol.name = value;

            // Update the protocol
            HP.ProtocolStore.updateProtocol(selectedProtocol.id, selectedProtocol);

            // Update the protocol selector
            updateProtocolSelect();
        });
    },
    /**
     * Import a Protocol
     */
    'click #importProtocol'() {
        // Hide the protocol dropdown manually, because it is not hidden automatically
        // when it has input as a child
        $("#protocolDropdown").dropdown('toggle');
    },
    /**
     * Triggers a custom event when for the HTML5 File input when files are selected
     *
     * @param event The Change event for the input
     */
    'change .btn-file :file': function(event) {
        // http://www.abeautifulsite.net/whipping-file-inputs-into-shape-with-bootstrap-3/

        // Find the Input in the DOM
        var input = $(event.currentTarget);

        // Get the number of selected files
        var numFiles = input.get(0).files ? input.get(0).files.length : 1;

        // Get the label of the file
        var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');

        // Trigger our custom event with the number of files and label
        input.trigger('fileselect', [numFiles, label]);
    },
    /**
     * Imports files selected by the user into the Hanging Protocols Collection
     *
     * @param event The custom fileselect event
     */
    'fileselect .btn-file :file': function(event) {
        // Retreieve the FileList
        var files = event.target.files;

        // Create an HTML5 File Reader
        var reader = new FileReader();

        reader.onload = () => {
            var protocolToImport = JSON.parse(reader.result);

            // Insert the protocol
            HP.ProtocolStore.addProtocol(protocolToImport);

            // Update the protocol selector to display the imported Protocol
            updateProtocolSelect();
        };

        // Instruct the FileReader to read the (first) selected file
        // TODO: Update to allow batch uploads?
        reader.readAsText(files[0], 'utf-8');
    },
    /**
     * Set the Hanging Protocol when the select box is changed
     *
     * @param event The select2:select event
     */
    'select2:select #protocolSelect': function(event) {
        // Retrieve the protocolId
        var protocolId = event.params.data.id;

        // Retrieve the protocol from the protocol store
        var selectedProtocol = HP.ProtocolStore.getProtocol(protocolId);

        // If it doesn't exist, stop here
        if (!selectedProtocol) {
            return;
        }

        // Set the current Hanging Protocol to the user-specified Protocol
        ProtocolEngine.setHangingProtocol(selectedProtocol);
    },
    /**
     * Allow the Protocols / Stage navigation tabs to toggle the
     * 'active' class when clicked
     */
    'click .navigationButtons a'() {
        $(this).addClass('active').siblings().removeClass('active');
    },
    /**
     * Update the protocol with the latest changes to the current Protocol
     */
    'click #saveProtocol'() {
        var selectedProtocol = this;
        if (selectedProtocol.locked) {
            return;
        }

        // Update the Protocol's modifiedDate and modifiedBy User details
        selectedProtocol.protocolWasModified();

        // Update the current Protocol in the database with the latest changes
        HP.ProtocolStore.updateProtocol(selectedProtocol.id, selectedProtocol);
    },
    /**
     * Save the current Protocol as a new document
     */
    'click #saveAsProtocol'() {
        var selectedProtocol = this;

        // Clone the selected Protocol
        var protocol = selectedProtocol.createClone();

        // Define some details for the text entry dialog
        var title = 'Save Protocol As';
        var instructions = 'Enter a new name';
        var currentValue = protocol.name;

        // Open the text entry dialog with the details above
        // and fire the callback function when finished.
        openTextEntryDialog(title, instructions, currentValue, function(value) {
            // Create a new ID for the protocol
            protocol.id = Random.id();

            // Update the name with the entered text
            protocol.name = value;

            // Unlock the protocol
            protocol.locked = false;

            // Update the Protocol's modifiedDate and modifiedBy User details
            protocol.protocolWasModified();

            // Insert the new Protocol
            HP.ProtocolStore.addProtocol(protocol);

            // Activate the new Protocol using the ProtocolEngine
            ProtocolEngine.setHangingProtocol(protocol);

            // Update the protocol selector to display the new Protocols
            updateProtocolSelect();
        });
    },
    /**
     * Export the currently selected Protocol as a JSON file
     */
    'click #exportJSON'() {
        var selectedProtocol = this;

        var protocolJSON = JSON.stringify(selectedProtocol, null, 2),
            currentDate = new Date(),
            filename = selectedProtocol.name + '-' + (currentDate.getTime().toString()) + '.json',
            protocolBlob = new Blob([protocolJSON], { type: 'application/json' });

        var downloadElement = document.getElementById('downloadElement');
        downloadElement.href = URL.createObjectURL(protocolBlob);
        downloadElement.download = filename;
        downloadElement.click();
    },
    /**
     * Delete the currently selected Protocol
     */
    'click #deleteProtocol'() {
        var selectedProtocol = this;
        if (selectedProtocol.locked) {
            return;
        }

        var options = {
            title: 'Delete Protocol',
            text: 'Are you sure you would like to remove this Protocol? This cannot be reversed.'
        };

        OHIF.viewerbase.dialogUtils.showConfirmDialog(() => {
            // Remove the Protocol
            HP.ProtocolStore.removeProtocol(selectedProtocol.id);

            // Reset the ProtocolEngine to the next best match
            ProtocolEngine.reset();

            // Update the protocol selector
            updateProtocolSelect();
        }, options);
    }
});
