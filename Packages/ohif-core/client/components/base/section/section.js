import { OHIF } from 'meteor/ohif:core';

Template.section.onCreated(() => {
    const instance = Template.instance();

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

    // Check if it is defining or printing the section content
    if (templateContentBlock) {
        // Get the parent component of this section
        const component = OHIF.blaze.getParentComponent(instance.view, '_wrapperComponent');

        // Stop here if this section is not inside a component
        if (!component) {
            return;
        }

        // Define the content
        component.templateInstance.sections[sectionName] = {
            data: component.templateInstance.data,
            renderFunction: templateContentBlock.renderFunction
        };
    } else {
        // Wait for re-rendering and print the section content
        Tracker.afterFlush(() => {
            // Get the parent component of this section
            const component = OHIF.blaze.getParentComponent(instance.view, '_wrapperComponent');

            // Stop here if this section is not inside a component
            if (!component) {
                return;
            }

            // Get the defined section content
            const section = component.templateInstance.sections[sectionName];

            // Stop here if the section content is not defined yet
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
