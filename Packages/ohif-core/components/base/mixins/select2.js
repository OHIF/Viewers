import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';

/*
 * input: controls a select2 component
 */
OHIF.mixins.select2 = new OHIF.Mixin({
    dependencies: 'select',
    composition: {
        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the element to be controlled
            component.$element = instance.$('select:first');
        }
    }
});
