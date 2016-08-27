import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

/*
 * input: controls a select2 component
 */
OHIF.mixins.select2 = new OHIF.Mixin({
    dependencies: 'select',
    composition: {
        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Apply the select2 to the component
            component.$element.select2(instance.data.options);

            // Store the select2 instance to allow its further destruction
            component.select2Instance = component.$element.data('select2');
        },

        onDestroyed() {
            const instance = Template.instance();
            const component = instance.component;

            // Destroy the select2 instance to remove unwanted DOM elements
            component.select2Instance.destroy();
        },

        events: {
            'focus .select2-hidden-accessible'(event, instance) {
                // Redirect the focus to select2 focus control in case of hidden
                // accessible being focused (e.g. clicking on outer label)
                $(event.currentTarget).nextAll('.select2:first').find('.select2-selection').focus();
            }
        }
    }
});
