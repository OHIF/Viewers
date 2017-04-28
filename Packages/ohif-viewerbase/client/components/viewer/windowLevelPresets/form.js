import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';

Template.windowLevelPresetsForm.onCreated(() => {
    const instance = Template.instance();

    instance.api = {
        save() {
            const form = instance.$('form').first().data('component');
            const definitions = form.value();
            // TODO: return save method with promise
        },

        resetDefaults() {
            const dialogOptions = {
                title: 'Reset Window Level Presets to Default',
                message: 'Are you sure you want to reset all the window level presets to their defaults?'
            };

            return OHIF.ui.showDialog('dialogConfirm', dialogOptions).then(() => {
                // TODO: return reset method with promise
            });
        }
    };
});
