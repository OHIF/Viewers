import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'meteor/ohif:core';

// Get the view that contains the desired section's content and return it
const getSection = (view, sectionName) => {
    let currentView = view;
    while (!currentView._sectionMap || !currentView._sectionMap.get(sectionName)) {
        currentView = OHIF.blaze.getParentTemplateView(currentView);
        if (!currentView) return;
    }

    return currentView._sectionMap.get(sectionName);
};

Template.section.onCreated(() => {
    const instance = Template.instance();

    if (instance.data === 'dialogFooter') {
        console.warn('>>>>instance', instance);
    }

    // Create the render function and section data as reactive objects
    instance.renderFunction = new ReactiveVar(null);
    instance.sectionData = new ReactiveVar(null);

    // Get the section name
    const sectionName = instance.data;

    // Stop here if no section name was defined
    if (!sectionName) {
        return;
    }

    // Get the content block
    const templateContentBlock = instance.view.templateContentBlock;

    // Get the parent template view of this section block
    let currentView = OHIF.blaze.getParentTemplateView(instance.view);

    // Check if it is defining or printing the section content
    if (templateContentBlock) {
        // Define a section map for template's view if none was yet set
        if (!currentView._sectionMap) {
            currentView._sectionMap = new Map();
        }

        // Define the content
        currentView._sectionMap.set(sectionName, {
            data: currentView._templateInstance.data,
            renderFunction: templateContentBlock.renderFunction
        });
    } else {
        // Wait for re-rendering and print the section content
        Tracker.afterFlush(() => {
            // Get the defined section's content
            const section = getSection(currentView, sectionName);

            // Stop here if the section content is not defined
            if (!section) {
                return;
            }

            // Set the section data on its respective reactive object
            instance.sectionData.set(section.data);

            // Set the render function on its respective reactive object
            instance.renderFunction.set(new Template(section.renderFunction));
        });
    }
});
