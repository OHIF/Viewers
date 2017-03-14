import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { OHIF } from 'meteor/ohif:core';

OHIF.ui.showDropdown = (items=[], options={}) => {
    let promiseResolve;
    let promiseReject;
    const promise = new Promise((resolve, reject) => {
        promiseResolve = resolve;
        promiseReject = reject;
    });

    // Prepare the method to destroy the view
    let view;
    const destroyView = () => Blaze.remove(view);

    // Create the data object that the dropdown will receive
    const templateData = {
        items,
        options,
        destroyView,
        promise,
        promiseResolve,
        promiseReject
    };

    // Render the dialog with the given template and data
    const parentElement = options.parentElement || document.body;
    view = Blaze.renderWithData(Template.dropdownForm, templateData, parentElement);

    // Return the promise to allow callbacks stacking from outside
    return promise;
};
