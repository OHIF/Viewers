import { Template } from 'meteor/templating';

import { dialogUtils } from '../../../lib/dialogUtils';

// Global object of key names (TODO: put this somewhere else)
const keys = {
    ESC: 27,
    ENTER: 13
};

Template.confirmDeleteDialog.events({
    'click #cancel, click #close'() {
        // Action canceled, just close dialog without calling callback
        dialogUtils.closeHandler(false);
    },
    'click #confirm'() {
        // Action confirmed, close dialog and calls callback, if exists
        dialogUtils.closeHandler();
    },
    'keydown #confirmDeleteDialog'(e) {
        // Action canceled, just close dialog without calling callback
        if (e.which === keys.ESC) {
            dialogUtils.closeHandler(false);
            return false;
        }

        if (this.keyPressAllowed === false) {
            return;
        }

        // If Enter is pressed
        if (e.which === keys.ENTER) {
            // Action confirmed, close dialog and calls callback,  if exists
            dialogUtils.closeHandler();
        }
    }
});
