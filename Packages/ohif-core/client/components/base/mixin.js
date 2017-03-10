import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

// Create an object to store all the application mixins
OHIF.mixins = {};

// Class to manage new mixins and its dependencies
class Mixin {

    // Create the mixin instance
    constructor({ dependencies, composition }) {
        // Store the mixin dependencies
        this.dependencies = dependencies || '';

        // Store the mixin composition
        this.composition = composition;
    }

    // Initialize the mixin applying all its composition functions
    init(template, data, applied, behaviors) {
        const dependenciesArray = this.dependencies.split(' ');
        _.each(dependenciesArray, dependency => {
            // Go to next dependency if the current dependency string is blank
            if (!dependency) {
                return;
            }

            // Get the dependent mixin to be initizalized
            const mixin = Mixin.getMixin(dependency);

            // Throw an error if a cyclic dependency was found on this mixin
            if (mixin === this) {
                throw new Error(`Mixin ${dependency} has a cyclic dependency.`);
            }

            // Initizalize the mixin dependencies recursively
            mixin.init(template, data, applied, behaviors);
        });

        // Apply the mixin's composition behaviors to the template
        this.apply(template, data, applied, behaviors);
    }

    // Add the mixin's composition behaviors to the template
    apply(template, data, applied, behaviors) {
        // Ignore if the mixin was already applied to the template
        if (_.contains(applied, this)) {
            return;
        }

        // Store the mixin's composition
        const composition = this.composition;

        // Iterate over each behavior
        _.each(behaviors, behavior => {
            // Execute something only after all the mixins are done
            let functionName = behavior;
            if (functionName === 'onMixins') {
                functionName = 'onRendered';
            }

            if (behavior === 'onData' && composition[behavior]) {
                // If it's just data manipulation, call it immediately
                composition[behavior](data);
            } else if (composition[behavior]) {
                // Register the behavior in the template
                template[functionName](composition[behavior]);
            }
        });

        // Set the current mixin's state as applied
        applied.push(this);
    }

    // Initialize all data manipulation mixins
    static initData(data) {
        // Split the mixins by space
        const mixinsArray = data.mixins.split(' ');

        // Control and ignore the mixins that have already been applied
        const appliedOnData = [];
        _.each(mixinsArray, mixinName => {
            // Ignore blank strings
            if (!mixinName) {
                return;
            }

            // Get the current mixin
            const mixin = Mixin.getMixin(mixinName);

            // Initialize the data manipulation composition
            mixin.init(null, data, appliedOnData, ['onData']);
        });
    }

    // Initialize all the template's mixins
    static initAll(template, data) {
        // Split the mixins by space
        const mixinsArray = data.mixins.split(' ');

        // Control and ignore the mixins that have already been applied
        const appliedCommon = [];
        const appliedOnMixins = [];
        _.each(mixinsArray, mixinName => {
            // Ignore blank strings
            if (!mixinName) {
                return;
            }

            // Get the current mixin
            const mixin = Mixin.getMixin(mixinName);

            // Initialize blaze default compositions
            mixin.init(template, data, appliedCommon, ['onCreated', 'onRendered', 'onDestroyed', 'events', 'helpers']);

            // Execute some behaviors after all mixins are applied
            mixin.init(template, data, appliedOnMixins, ['onMixins']);
        });
    }

    // Get a mixin by name
    static getMixin(mixinName) {
        // Get the mixin from mixins object
        const mixin = OHIF.mixins[mixinName];

        // Throw an error if the mixin does not exists
        if (!mixin) {
            throw new Error(`Mixin ${mixinName} not found.`);
        }

        // Return the found mixin
        return mixin;
    }

}

// Store the Mixin class inside the shared OHIF object
OHIF.Mixin = Mixin;
