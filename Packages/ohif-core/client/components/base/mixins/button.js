import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';

/*
 * button: controls a button
 */
OHIF.mixins.button = new OHIF.Mixin({
    dependencies: 'formItem',
    composition: {
        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the element to be controlled
            component.$element = instance.$('button').first();
        }
    }
});
