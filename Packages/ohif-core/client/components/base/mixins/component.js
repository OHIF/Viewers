import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';

/*
 * component: create the base structure to aplly specific component mixins
 */
OHIF.mixins.component = new OHIF.Mixin({
    composition: {
        onCreated() {
            const instance = Template.instance();

            // Declare a property that will be shared among all dependent mixins
            instance.component = new OHIF.Component(this);
        }
    }
});
