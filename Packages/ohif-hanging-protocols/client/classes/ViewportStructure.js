/**
 * The ViewportStructure class represents the layout and layout properties that
 * Viewports are displayed in. ViewportStructure has a type, which corresponds to
 * a layout template, and a set of properties, which depend on the type.
 *
 * @type {ViewportStructure}
 */
HP.ViewportStructure = class ViewportStructure {
    constructor(type, properties) {
        this.type = type;
        this.properties = properties;
    }

    /**
     * Occasionally the ViewportStructure class needs to be instantiated from a JavaScript Object.
     * This function fills in a ViewportStructure with the Object data.
     *
     * @param input The ViewportStructure as a JavaScript Object, e.g. retrieved from MongoDB or JSON
     */
    fromObject(input) {
        this.type = input.type;
        this.properties = input.properties;
    }

    /**
     * Retrieve the layout template name based on the layout type
     *
     * @returns {string}
     */
    getLayoutTemplateName() {
        // Viewport structure can be updated later when we build more complex display layouts
        switch (this.type) {
            case 'grid':
                return 'gridLayout';
        }
    }

    /**
     * Retrieve the number of Viewports required for this layout
     * given the layout type and properties
     *
     * @returns {string}
     */
    getNumViewports() {
        // Viewport structure can be updated later when we build more complex display layouts
        switch (this.type) {
            case 'grid':
                // For the typical grid layout, we only need to multiply rows by columns to
                // obtain the number of viewports
                return this.properties.rows * this.properties.columns;
        }   
    }
};