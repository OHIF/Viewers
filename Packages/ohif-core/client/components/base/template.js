import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

// Create a new custom template for the base component
Template.baseComponent = new Template('baseComponent', () => {});

// Inject some custom behaviors in the  view's construction function
Template.baseComponent.constructView = function(contentFunc, elseFunc) {
    // Get the data passed to the template
    const data = Template.currentData();

    if (!data) {
        return;
    }

    // Check the base template. If it's not informed set as the custom base
    data.base || (data.base = 'baseCustom');

    // Get the base template object
    const baseTemplate = Template[data.base];

    // Throw an error if the base template does not exists
    if (!baseTemplate) {
        throw new Error(`Template ${data.base} not found.`);
    }

    // Declare the template object and name it as base name + 'Component'
    const template = OHIF.blaze.cloneTemplate(baseTemplate, data.base + 'Component');

    // Extract the render function from the base template
    template.renderFunction = baseTemplate.renderFunction;

    // Init the data manipulation mixins
    OHIF.Mixin.initData(data);

    // Create and fill a list of wrappers that will enclose the component
    const wrappers = [];
    if (data.wrappers) {
        const wrappersList = data.wrappers.split(' ');
        _.each(wrappersList, wrapper => wrapper && wrappers.push(wrapper));
    }

    // Declare a variable to store the wrapper instances that will be rendered
    const wrapperInstances = [];

    // Declare the content function to render the component
    let contentFunction = () => {
        // Create the most inner content function
        const innerContentFunction = () => {
            // Return the view instance
            return template.constructView(contentFunc, elseFunc);
        };

        // Assign properties to all wrappers after template's creation
        template.onCreated(() => {
            const instance = Template.instance();

            // create the base structure to aplly specific component mixins
            instance.component = new OHIF.Component(instance);

            // Assign the template most outer wrapper
            instance.wrapper = wrapperInstances[0] || instance;

            // Iterate over all wrappers and assign the component to them
            wrapperInstances.forEach(wrapperInstance => {
                wrapperInstance.component = instance.component;
            });
        });

        // Apply the mixins to the component
        OHIF.Mixin.initAll(template, data);

        // Return the recursive function for wrappers
        return Blaze.With(data, innerContentFunction);
    };

    let wrapper;
    while (wrapper = wrappers.shift()) {
        // Get the wrapper template
        const wrapperTemplate = Template[wrapper];

        // Throw an error if the wrapper template does not exists
        if (!wrapperTemplate) {
            throw new Error(`Template ${wrapper} not found.`);
        }

        // Clone the wrapper template to avoid assigning duplicated handlers
        const currentTemplate = OHIF.blaze.cloneTemplate(wrapperTemplate);

        // Store the child content function to render it inside the wrapper
        const childContentFunction = contentFunction;

        // Create a function that will enable the recursion for wrappers
        const enclosingContentFunction = () => {
            // Add the current wrapper's instance to the wrapper instances list
            currentTemplate.onCreated(() => wrapperInstances.push(Template.instance()));

            // Return the wrapper view instance with its child as content
            return currentTemplate.constructView(childContentFunction, elseFunc);
        };

        // Replace the content function enclosing it recursively
        contentFunction = () => {
            return Blaze.With(data, enclosingContentFunction);
        };

    }

    return contentFunction(contentFunc, elseFunc);
};
