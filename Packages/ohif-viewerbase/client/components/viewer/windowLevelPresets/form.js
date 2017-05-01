import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.windowLevelPresetsForm.onCreated(() => {
    const instance = Template.instance();
    const { wlPresets } = OHIF.viewerbase;

    instance.api = {
        save() {
            const form = instance.$('form').first().data('component');
            const definitions = form.value();
            wlPresets.store(definitions);
        },

        resetDefaults() {
            const dialogOptions = {
                title: 'Reset Window Level Presets to Default',
                message: 'Are you sure you want to reset all the window level presets to their defaults?'
            };

            return OHIF.ui.showDialog('dialogConfirm', dialogOptions).then(() => wlPresets.resetDefaults());
        }
    };
});

Template.windowLevelPresetsForm.helpers({
    getPresetsInputInformationList() {
        OHIF.viewerbase.wlPresets.changeObserver.depend();
        return _.toArray(OHIF.viewer.wlPresets);
    }
});
