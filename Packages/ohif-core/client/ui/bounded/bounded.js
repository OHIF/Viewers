import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

// Allow attaching to jQuery selectors
$.fn.bounded = function(options) {
    _.each(this, element => {
        const boundedInstance = $(element).data('boundedInstance');
        if (options === 'destroy' && boundedInstance) {
            $(element).removeData('boundedInstance');
            boundedInstance.destroy();
        } else {
            if (boundedInstance) {
                boundedInstance.options(options);
            } else {
                $(element).data('boundedInstance', new Bounded(element, options));
            }
        }
    });

    return this;
};

/**
 * This class makes an element bounded to other element's borders.
 */
class Bounded {

    // Initialize the instance with the given element and options
    constructor(element, options={}) {
        this.element = element;
        this.$element = $(element);
        this.options(options);
        this.setBoundedFlag(false);
    }

    // Set or change the instance options
    options(options={}) {
        // Process the given options and store it in the instance
        const { boundingElement, allowResizing } = options;
        this.boundingElement = boundingElement;
        this.$boundingElement = $(this.boundingElement);
        this.allowResizing = allowResizing;

        // Check for fixed positioning
        if (this.$element.css('position') === 'fixed') {
            this.boundingElement = window;
        }

        // Destroy and initialize again the instance
        this.destroy();
        this.init();
    }

    // Initialize the bounding behaviour
    init() {
        // Create the event handlers
        this.defineEventHandlers();

        // Attach the created event handlers to the component
        this.attachEventHandlers();

        // Add the bounded class to the element
        this.$element.addClass('bounded');

        // Handle the positioning on window resize
        const $window = $(window);
        const windowResizeHandler = () => {
            // Check if the element is still in DOM and remove the handler if it is not
            if (!this.$element.closest(document.documentElement).length) {
                $window.off('resize', windowResizeHandler);
            }

            this.$element.trigger('spatialChanged');
        };

        $window.on('resize', windowResizeHandler);

        // Trigger the bounding check for the first timepoint
        setTimeout(() => this.$element.trigger('spatialChanged'));
    }

    // Destroy this instance, returning the element to its previous state
    destroy() {
        // Detach the event handlers
        this.detachEventHandlers();

        // Remove the bounded class from the element
        this.$element.removeClass('bounded');
    }

    static spatialInfo(element) {
        // Create the result object
        const result = {};

        // Check if the element is the window
        if (!element || element === window) {
            const $window = $(window);
            const width = $window.outerWidth();
            const height = $window.outerHeight();
            return {
                width,
                height,
                x0: 0,
                y0: 0,
                x1: width,
                y1: height
            };
        }

        // Get the jQuery object for the element
        const $element = $(element);

        // Get the element style
        const style = element.style;

        // Get the integer numbers for element's width
        if (style.width && style.width.indexOf('px') > -1) {
            result.width = parseInt(style.width);
        } else {
            result.width = $element.outerWidth();
        }

        // Get the integer numbers for element's height
        if (style.height && style.height.indexOf('px') > -1) {
            result.height = parseInt(style.height);
        } else {
            result.height = $element.outerHeight();
        }

        // Get the position property based on the element position CSS attribute
        const positionProperty = $element.css('position') === 'fixed' ? 'position' : 'offset';

        // Get the element's start position
        const position = $element[positionProperty]();
        result.x0 = position.left;
        result.y0 = position.top;

        // Get the element's end position
        result.x1 = result.x0 + result.width;
        result.y1 = result.y0 + result.height;

        // Return the result object
        return result;
    }

    // Define the event handlers for this class
    defineEventHandlers() {
        this.spatialChangedHandler = event => {
            // Get the spatial information for element and its bounding element
            const elementInfo = Bounded.spatialInfo(this.element);
            const boundingInfo = Bounded.spatialInfo(this.boundingElement);

            // Fix element's x positioning and width
            if (this.allowResizing && elementInfo.width > boundingInfo.width) {
                this.$element.width(boundingInfo.width);
                this.$element.css('left', boundingInfo.x0);
                this.setBoundedFlag(true);
            } else if (elementInfo.x0 < boundingInfo.x0) {
                this.$element.css('left', boundingInfo.x0);
                this.setBoundedFlag(true);
            } else if (elementInfo.x1 > boundingInfo.x1) {
                this.$element.css('left', boundingInfo.x1 - elementInfo.width);
                this.setBoundedFlag(true);
            }

            // Fix element's y positioning and height
            if (this.allowResizing && elementInfo.height > boundingInfo.height) {
                this.$element.height(boundingInfo.height);
                this.$element.css('top', boundingInfo.y0);
                this.setBoundedFlag(true);
            } else if (elementInfo.y0 < boundingInfo.y0) {
                this.$element.css('top', boundingInfo.y0);
                this.setBoundedFlag(true);
            } else if (elementInfo.y1 > boundingInfo.y1) {
                this.$element.css('top', boundingInfo.y1 - elementInfo.height);
                this.setBoundedFlag(true);
            }
        };
    }

    // Attach the event handlers to the element in order to bound it
    attachEventHandlers() {
        this.$element.on('spatialChanged', this.spatialChangedHandler);
        this.$boundingElement.on('resize', this.spatialChangedHandler);
    }

    // Detach the event handlers from the element
    detachEventHandlers() {
        this.$element.off('spatialChanged', this.spatialChangedHandler);
        this.$boundingElement.off('resize', this.spatialChangedHandler);
    }

    // This is a means to let outside world know that the element in question has been moved
    setBoundedFlag(value) {
        this.$element.data('wasBounded', value);
    }

}

OHIF.ui.Bounded = Bounded;
