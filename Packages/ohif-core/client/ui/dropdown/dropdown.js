import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { OHIF } from 'meteor/ohif:core';

OHIF.ui.showDropdown = (items=[], options={}) => {
    // Prepare the method to destroy the view
    let view;
    const destroyView = () => Blaze.remove(view);
    const templateData = {
        items,
        options,
        destroyView
    };

    // Render the dialog with the given template and data
    const parentElement = options.parentElement || document.body;
    view = Blaze.renderWithData(Template.dropdownForm, templateData, parentElement);
};

Meteor.startup(() => {
    OHIF.ui.showDropdown([{
        text: 'test 1',
        action: () => console.warn('test1Clicked'),
        separatorAfter: true
    }, {
        text: 'test 2',
        action: () => console.warn('test2Clicked')
    }]);
});
