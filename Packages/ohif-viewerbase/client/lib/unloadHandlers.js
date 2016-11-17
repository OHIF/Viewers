import { OHIF } from 'meteor/ohif:core';

export const unloadHandlers = {
    beforeUnload: function(event) {
        // Check for any unsaved changes on viewer namespace...
        if (OHIF.ui.unsavedChanges.probe('viewer.*') > 0) {
            let confirmationMessage = 'You have unsaved changes!';
            event.returnValue = confirmationMessage;
            return confirmationMessage;
        }
    }
};
