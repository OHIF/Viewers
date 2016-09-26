import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

OHIF.ui.showFormDropdown = (templateName, dropdownData) => {
    // Check if the given template exists
    const template = Template[templateName];
    if (!template) {
        throw {
            name: 'TEMPLATE_NOT_FOUND',
            message: `Template ${templateName} not found.`
        };
    }

    // Prepare the method to destroy the view
    let view;
    const destroyView = () => Blaze.remove(view);
    const templateData = _.extend({}, dropdownData, {
        destroyView
    });

    // Render the dialog with the given template and data
    view = Blaze.renderWithData(template, templateData, document.body);

    // Return the dropdown element to enable position manipulation
    const dropdown = view.firstNode();
    return dropdown;
};
