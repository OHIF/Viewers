import { OHIF } from 'meteor/ohif:core';

OHIF.blaze = {};

// Clone a template and return the clone
OHIF.blaze.cloneTemplate = (template, newName) => {
    if (!template){
        return;
    }

    const name = newName || template.viewName;
    const clone = new Template(name, template.renderFunction);
    clone.inheritsEventsFrom(template);
    clone.inheritsHelpersFrom(template);
    clone.inheritsHooksFrom(template);
    return clone;
};

// Navigate upwards the component and get the parent with the given view name
OHIF.blaze.getParentView = (view, parentViewName) => {
    let currentView = view;
    while (currentView) {
        if (currentView.name === parentViewName) {
            break;
        }

        currentView = currentView.originalParentView || currentView.parentView;
    }

    return currentView;
};

// Search for the parent component of the given view
OHIF.blaze.getParentComponent = (view) => {
    let currentView = view;
    while (currentView) {
        currentView = currentView.originalParentView || currentView.parentView;
        if (currentView && currentView._component) {
            return currentView._component;
        }
    }
};
