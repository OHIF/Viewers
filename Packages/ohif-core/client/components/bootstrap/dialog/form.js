import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.dialogForm.onCreated(() => {
    const instance = Template.instance();

    const dismissModal = (promiseFunction, param) => {
        // Hide the modal, removing the backdrop
        instance.$('.modal').one('hidden.bs.modal', event => {
            // Resolve or reject the promise with the given parameter
            promiseFunction(param);
        }).modal('hide');
    };

    instance.api = {

        confirm() {
            // Check if the form has valid data
            const form = instance.$('form').data('component');
            if (!form.validate()) {
                return;
            }

            const formData = form.value();
            const dismiss = param => dismissModal(instance.data.promiseResolve, param);

            if (_.isFunction(instance.data.confirmCallback)) {
                const result = instance.data.confirmCallback(formData);
                if (result instanceof Promise) {
                    return result.then(dismiss);
                } else {
                    return dismiss(result);
                }
            }

            dismiss(formData);
        },

        cancel() {
            const dismiss = param => dismissModal(instance.data.promiseReject, param);

            if (_.isFunction(instance.data.cancelCallback)) {
                const result = instance.data.cancelCallback();
                if (result instanceof Promise) {
                    return result.then(dismiss);
                } else {
                    return dismiss(result);
                }
            }

            dismiss();
        }

    };
});

Template.dialogForm.onRendered(() => {
    const instance = Template.instance();

    // Allow options ovewrite
    const modalOptions = _.extend({
        backdrop: 'static',
        keyboard: false
    }, instance.data.modalOptions);

    const $modal = instance.$('.modal');

    // Create the bootstrap modal
    $modal.modal(modalOptions);

    // Check if dialog will be repositioned
    let position = instance.data.position;
    const event = instance.data.event;
    if (!position && event && event.clientX) {
        position = {
            x: event.clientX,
            y: event.clientY
        };
    }

    // Reposition dialog if position object was filled
    if (position) {
        OHIF.ui.repositionDialog($modal, position.x, position.y);
    }
});

Template.dialogForm.events({
    keydown(event) {
        const instance = Template.instance(),
              keyCode = event.keyCode || event.which;

        let handled = false;

        if (keyCode === 27) {
            instance.$('.btn.btn-cancel').click();
            handled = true;
        } else if (keyCode === 13) {
            instance.$('.btn.btn-confirm').click();
            handled = true;
        }

        if (handled) {
            event.stopPropagation();
        }
    }
});

Template.dialogForm.helpers({
    isError() {
        const data = Template.instance().data;
        return data instanceof Error || (data && data.error instanceof Error);
    }
});
