Template.settingsTable.events({
    /**
     * Opens the Setting Entry dialog to allow the user to create a new setting
     * Specifies attributes and setting level for the Setting Entry dialog
     * based on the data given to this template.
     */
    'click .addSetting': function() {
        // Open the Setting Entry Dialog
        openSettingEntryDialog();
    },
    /**
     * Opens the Setting Entry dialog to allow the user to edit an existing
     * setting. Passes setting details to the dialog so its current properties
     * can be displayed.
     *
     * Specifies attributes for the Setting Entry dialog
     * based on the data given to this template.
     */
    'click .editSetting': function() {
        // Get the properties of the current setting
        var setting = this;

        // Open the Setting Entry Dialog with the setting
        openSettingEntryDialog(setting);
    },
    /**
     * Removes a setting from the current Viewport
     */
    'click .deleteSetting': function() {
        // Get the properties of the current setting
        var setting = this;

        // Retrieve the current viewport model
        var viewport = getActiveViewportModel();

        // Remove the specified setting
        delete viewport.viewportSettings[setting.key];

        // Instruct the Protocol Engine to update the Layout Manager with new data
        var viewportIndex = Session.get('activeViewport');
        ProtocolEngine.updateViewports(viewportIndex);
    }
});

Template.settingsTable.helpers({
    getSettingText: function() {
        var setting = this;
        if (HP.CustomViewportSettings[setting.key]) {
            return HP.CustomViewportSettings[setting.key].text;
        } else if (HP.displaySettings[setting.key]) {
            return HP.displaySettings[setting.key].text;
        } else {
            return Blaze._globalHelpers['prettyPrintStringify'](setting.key);
        }

    }
});