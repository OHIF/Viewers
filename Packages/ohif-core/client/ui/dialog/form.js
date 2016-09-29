import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

OHIF.ui.showFormDialog = (templateName, dialogData) => {
    // Check if the given template exists
    const template = Template[templateName];
    if (!template) {
        throw {
            name: 'TEMPLATE_NOT_FOUND',
            message: `Template ${templateName} not found.`
        };
    }

    // Create a new promise to control the modal and store its resolve and reject callbacks
    let promiseResolve;
    let promiseReject;
    const promise = new Promise((resolve, reject) => {
        promiseResolve = resolve;
        promiseReject = reject;
    });

    // Render the dialog with the given template passing the promise object and callbacks
    const templateData = _.extend({}, dialogData, {
        promise,
        promiseResolve,
        promiseReject
    });
    const view = Blaze.renderWithData(template, templateData, document.body);

    // Destroy the created dialog view when the promise is either resolved or rejected
    const dismissModal = () => Blaze.remove(view);
    promise.then(dismissModal, dismissModal);

    // Return the promise to allow callbacks stacking from outside
    return promise;
};
