import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';

/*
 * group: controls a group and its registered items
 */
OHIF.mixins.group = new OHIF.Mixin({
    dependencies: 'formItem',
    composition: {
        onCreated() {
            const instance = Template.instance();
            const component = instance.component;

            // Get or set the child components values
            component.value = value => {
                const isGet = _.isUndefined(value);
                if (isGet) {
                    const result = {};
                    component.registeredItems.forEach(child => {
                        const key = child.templateInstance.data.key;
                        if (key) {
                            result[key] = child.value();
                        }
                    });
                    return result;
                }

                const groupValue = typeof value === 'object' ? value : {};
                component.registeredItems.forEach(child => {
                    const key = child.templateInstance.data.key;
                    const childValue = _.isUndefined(groupValue[key]) ? null : groupValue[key];
                    child.value(childValue);
                });
                component.$element.trigger('change');
            };

            // Disable or enable the component
            component.disable = isDisable => {
                component.registeredItems.forEach(child => child.disable(isDisable));
            };

            // Set or unset component's readonly property
            component.readonly = isReadonly => {
                component.registeredItems.forEach(child => child.readonly(isReadonly));
            };

        },

        onRendered() {
            const instance = Template.instance();
            const component = instance.component;

            // Set the element to be controlled
            component.$element = instance.$('.component-group:first');
        }
    }
});
