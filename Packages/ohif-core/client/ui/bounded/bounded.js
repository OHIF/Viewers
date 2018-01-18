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

        // Force to hardware acceleration to move element if browser supports translate property
        this.useTransform = OHIF.ui.styleProperty.check('transform', 'translate(1px, 1px)');
    }

    // Set or change the instance options
    options(options={}) {
        // Process the given options and store it in the instance
        const { boundingElement, positionElement, dimensionElement, allowResizing } = options;
        this.positionElement = positionElement || this.element;
        this.$positionElement = $(this.positionElement);
        this.dimensionElement = dimensionElement || this.element;
        this.$dimensionElement = $(this.dimensionElement);
        this.boundingElement = boundingElement;
        this.$boundingElement = $(this.boundingElement);
        this.allowResizing = allowResizing;

        // Check for fixed positioning
        if (this.$positionElement.css('position') === 'fixed') {
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

    static spatialInfo(positionElement, dimensionElement) {
        // Create the result object
        const result = {};

        // Check if the element is the window
        if (!dimensionElement || dimensionElement === window) {
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

        // Get the jQuery object for the elements
        const $dimensionElement = $(dimensionElement);
        const $positionElement = $(positionElement);

        // Get the integer numbers for element's width
        result.width = $dimensionElement.outerWidth();

        // Get the integer numbers for element's height
        result.height = $dimensionElement.outerHeight();

        // Get the position property based on the element position CSS attribute
        const elementPosition = $positionElement.css('position');
        const positionProperty = elementPosition === 'fixed' ? 'position' : 'offset';

        // Get the element's start position
        const position = $positionElement[positionProperty]();
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
        this.cssPositionHandler = (elementInfo, boundingInfo) => {
            // Fix element's x positioning and width
            if (this.allowResizing && elementInfo.width > boundingInfo.width) {
                this.$dimensionElement.width(boundingInfo.width);
                this.$positionElement.css('left', boundingInfo.x0);
                this.setBoundedFlag(true);
            } else if (elementInfo.x0 < boundingInfo.x0) {
                this.$positionElement.css('left', boundingInfo.x0);
                this.setBoundedFlag(true);
            } else if (elementInfo.x1 > boundingInfo.x1) {
                this.$positionElement.css('left', boundingInfo.x1 - elementInfo.width);
                this.setBoundedFlag(true);
            }

            // Fix element's y positioning and height
            if (this.allowResizing && elementInfo.height > boundingInfo.height) {
                this.$dimensionElement.height(boundingInfo.height);
                this.$positionElement.css('top', boundingInfo.y0);
                this.setBoundedFlag(true);
            } else if (elementInfo.y0 < boundingInfo.y0) {
                this.$positionElement.css('top', boundingInfo.y0);
                this.setBoundedFlag(true);
            } else if (elementInfo.y1 > boundingInfo.y1) {
                this.$positionElement.css('top', boundingInfo.y1 - elementInfo.height);
                this.setBoundedFlag(true);
            }
        };

        this.getCSSTranslate = () => {
            const matrixToArray = str => str.match(/(-?[0-9\.]+)/g);
            const transformMatrix = matrixToArray(this.$positionElement.css('transform')) || [];
            return {
                x: parseFloat(transformMatrix[4]) || 0,
                y: parseFloat(transformMatrix[5]) || 0
            };
        };

        this.cssTransformHandler = (elementInfo, boundingInfo, translate) => {
            if (elementInfo.x1 > boundingInfo.x1) {
                translate.x -= elementInfo.x1 - boundingInfo.x1;
            }

            if (elementInfo.y1 > boundingInfo.y1) {
                translate.y -= elementInfo.y1 - boundingInfo.y1;
            }

            if (elementInfo.x0 < boundingInfo.x0) {
                translate.x += boundingInfo.x0 - elementInfo.x0;
            }

            if (elementInfo.y0 < boundingInfo.y0) {
                translate.y += boundingInfo.y0 - elementInfo.y0;
            }

            const translation = `translate(${translate.x}px, ${translate.y}px)`;
            OHIF.ui.styleProperty.set(this.positionElement, 'transform', translation);
        };

        this.spatialChangedHandler = event => {
            // Get the spatial information for element and its bounding element
            const { positionElement, dimensionElement, boundingElement, useTransform } = this;
            const elementInfo = Bounded.spatialInfo(positionElement, dimensionElement);
            const boundingInfo = Bounded.spatialInfo(boundingElement, boundingElement);

            // Check if CSS positioning or transform will be used
            const translate = this.getCSSTranslate();
            if (useTransform && (translate.x || translate.y)) {
                this.cssTransformHandler(elementInfo, boundingInfo, translate);
            } else {
                this.cssPositionHandler(elementInfo, boundingInfo);
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
