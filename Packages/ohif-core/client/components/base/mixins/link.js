import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';

/*
 * link: controls a link
 */
OHIF.mixins.link = new OHIF.Mixin({
    dependencies: 'formItem',
    composition: {
        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the element to be controlled
            component.$element = instance.$('a').first();
        },

        events: {
            'click a'(event, instance) {
                if (instance.data.action) {
                    event.preventDefault();
                }
            }
        }
    }
});
