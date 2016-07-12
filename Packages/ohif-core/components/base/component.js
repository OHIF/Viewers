import { OHIF } from 'meteor/ohif:core';

/*
 * Base component to template instances of all dynamic components
 */
class Component {

    // Set up the component
    constructor(templateInstance) {
        // Store the component in the current view
        templateInstance.view._component = this;

        // Create an object to register section's content
        templateInstance.sections = {};

        // Store the template instance in the component
        this.templateInstance = templateInstance;

        // Store the component's registered sub-components
        this.registeredItems = new Set();
    }

    // Self register the component in its first parent component
    registerSelf() {
        const parent = OHIF.blaze.getParentComponent(this.templateInstance.view);
        if (parent) {
            // Store this component's parent in a property
            this.parent = parent;

            // Add this component in its parent's registered items list
            parent.registeredItems.add(this);
        }
    }

    // Self unregister the component in its first parent component
    unregisterSelf() {
        const parent = OHIF.blaze.getParentComponent(this.templateInstance.view);
        if (parent) {
            // Remove the parent property from this component
            delete this.parent;

            // Remove this component from its parent's registered items list
            parent.registeredItems.delete(this);
        }
    }

}

OHIF.Component = Component;
