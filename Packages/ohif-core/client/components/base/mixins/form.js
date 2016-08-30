import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

/*
 * form: controls a form and its registered inputs
 */
OHIF.mixins.form = new OHIF.Mixin({
    dependencies: 'group',
    composition: {
        onCreated() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the form identifier flag
            component.isForm = true;

            // Reset the pathKey
            instance.data.pathKey = '';
        },

        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the component main and style elements
            component.$style = component.$element = instance.$('form:first');
        }
    }
});
