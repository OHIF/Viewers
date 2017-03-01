import { Random } from 'meteor/random';

/**
 * A Stage is one step in the Display Set Sequence for a Hanging Protocol
 *
 * Stages are defined as a ViewportStructure and an array of Viewports
 *
 * @type {Stage}
 */
HP.Stage = class Stage {
    constructor(ViewportStructure, name) {
        // Create a new UUID for this Stage
        this.id = Random.id();

        // Assign the name and ViewportStructure provided
        this.name = name;
        this.viewportStructure = ViewportStructure;

        // Create an empty array for the Viewports
        this.viewports = [];

        // Set the created date to Now
        this.createdDate = new Date();
    }

    /**
     * Creates a clone of the current Stage with a new name
     *
     * Note! This method absolutely cannot be renamed 'clone', because
     * Minimongo's insert method uses 'clone' internally and this
     * somehow causes very bizarre behaviour
     *
     * @param name
     * @returns {Stage|*}
     */
    createClone(name) {
        // Create a new JavaScript independent of the current Protocol
        var currentStage = Object.assign({}, this);

        // Create a new Stage to return
        var clonedStage = new HP.Stage();

        // Assign the desired properties
        currentStage.id = clonedStage.id;
        clonedStage.fromObject(currentStage);

        // If we have specified a name, assign it
        if (name) {
            clonedStage.name = name;
        }

        // Return the cloned Stage
        return clonedStage;
    }

    /**
     * Occasionally the Stage class needs to be instantiated from a JavaScript Object.
     * This function fills in a Protocol with the Object data.
     *
     * @param input A Stage as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     */
    fromObject(input) {
        // Check if the input already has an ID
        // If so, keep it. It not, create a new UUID
        this.id = input.id || Random.id();

        // Assign the input name to the Stage
        this.name = input.name;

        // If a ViewportStructure is present in the input, add it from the
        // input data
        this.viewportStructure = new HP.ViewportStructure();
        this.viewportStructure.fromObject(input.viewportStructure);

        // If any viewports are present in the input object
        if (input.viewports) {
            input.viewports.forEach(viewportObject => {
                // Create a new Viewport with their data
                var viewport = new HP.Viewport();
                viewport.fromObject(viewportObject);

                // Add it to the viewports array
                this.viewports.push(viewport);
            });
        }
    }
};