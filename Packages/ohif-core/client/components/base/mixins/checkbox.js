import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';

/*
 * inputCheckbox: controls a checkbox input
 */
OHIF.mixins.checkbox = new OHIF.Mixin({
    dependencies: 'input',
    composition: {
        onCreated() {
            const instance = Template.instance();
            const component = instance.component;

            // Get or set the checked state using jQuery's prop method
            component.value = value => {
                const isGet = _.isUndefined(value);
                if (isGet) {
                    return component.parseData(component.$element.is(':checked'));
                }

                component.$element.prop('checked', value).trigger('change');
            };
        }
    }
});
