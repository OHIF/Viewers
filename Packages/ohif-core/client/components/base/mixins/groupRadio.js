import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

/*
 * groupRadio: controls all the radio inputs inside the group
 */
OHIF.mixins.groupRadio = new OHIF.Mixin({
    dependencies: 'group',
    composition: {

        onCreated() {
            const instance = Template.instance();
            const component = instance.component;

            // Get the selected radio's value or select a radio based on value
            component.value = value => {
                const isGet = _.isUndefined(value);
                const elements = [];
                component.registeredItems.forEach(child => elements.push(child.$element[0]));
                const $elements = $(elements);
                if (isGet) {
                    return component.parseData($elements.filter(':checked').val());
                }

                $elements.filter(`[value='${value}']`).prop('checked', true).trigger('change');
            };
        }

    }
});
