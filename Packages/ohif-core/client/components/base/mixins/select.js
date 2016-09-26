import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';

/*
 * input: controls a basic select
 */
OHIF.mixins.select = new OHIF.Mixin({
    dependencies: 'formItem',
    composition: {
        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the element to be controlled
            component.$element = instance.$('select').first();
        }
    }
});
