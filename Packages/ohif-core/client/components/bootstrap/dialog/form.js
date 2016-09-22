import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';

Template.dialogForm.onCreated(() => {
    const instance = Template.instance();

    instance.api = {
        confirm() {
            // Check if the form has valid data
            const form = instance.$('form').data('component');
            if (!form.validate()) {
                return;
            }

            // Get the form value and call the confirm callback or resolve the promise
            const formData = form.value();
            if (_.isFunction(instance.data.confirmCallback)) {
                instance.data.confirmCallback(formData, instance.data.promiseResolve);
            } else {
                instance.data.promiseResolve(formData);
            }
        },
        cancel() {
            // Call the cancel callback or resolve the promise
            if (_.isFunction(instance.data.cancelCallback)) {
                instance.data.cancelCallback(instance.data.promiseReject);
            } else {
                instance.data.promiseReject();
            }
        }
    };
});

Template.dialogForm.onRendered(() => {
    const instance = Template.instance();

    // Create the bootstrap modal
    const $modal = instance.$('.modal');
    $modal.modal();

    // Remove the created modal backdrop from DOM after promise is done
    const $backdrop = $modal.next('.modal-backdrop');
    const dismissDialogBackdrop = () => $backdrop.remove();
    instance.data.promise.then(dismissDialogBackdrop).catch(dismissDialogBackdrop);
});
