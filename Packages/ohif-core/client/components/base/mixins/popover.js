import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

/*
 * popover: controls a popover
 */
OHIF.mixins.popover = new OHIF.Mixin({
    dependencies: 'form',
    composition: {
        onRendered() {
            const instance = Template.instance();
            instance.$form = instance.$('form').first();
            instance.$form.find(':input:first').focus();
        },

        events: {
            'blur form'(event, instance) {
                Meteor.defer(() => {
                    const $focus = $(':focus');
                    if (!$.contains(instance.$form[0], $focus[0])) {
                        instance.data.promiseReject();
                    }
                });
            },

            'click .btn-cancel'(event, instance) {
                event.stopPropagation();
                instance.data.promiseReject();
            },

            'click .btn-confirm'(event, instance) {
                event.stopPropagation();
                const form = instance.$('form').data('component');
                instance.data.promiseResolve(form.value());
            }
        }
    }
});
