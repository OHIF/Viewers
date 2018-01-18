import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

// Allow attaching to jQuery selectors
$.fn.resizable = function(options) {
    _.each(this, element => {
        const resizableInstance = $(element).data('resizableInstance');
        if (options === 'destroy' && resizableInstance) {
            $(element).removeData('resizableInstance');
            resizableInstance.destroy();
        } else {
            if (resizableInstance) {
                resizableInstance.options(options);
            } else {
                $(element).data('resizableInstance', new Resizable(element, options));
            }
        }
    });

    return this;
};

/**
 * This class makes an element resizable.
 */
class Resizable {

    constructor(element, options={}) {
        this.element = element;
        this.$element = $(element);
        this.options(options);
    }

    options(options={}) {
        const { boundSize, minWidth, minHeight } = options;
        this.minWidth = minWidth || this.$element.width() || 16;
        this.minHeight = minHeight || this.$element.height() || 16;
        this.boundSize = boundSize || 8;

        this.destroy();
        this.init();
    }

    init() {
        this.defineEventHandlers();

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                this.createBound(x, y);
            }
        }

        this.$element.addClass('resizable');
    }

    destroy() {
        // Remove the instance added classes
        this.$element.removeClass('resizable resizing');

        // Get the bound borders
        const $bound = this.$element.find('resize-bound');

        // Remove the bound borders
        $bound.remove();

        // Detach the event handlers
        this.detachEventHandlers($bound);
    }

    defineEventHandlers() {
        this.initResizeHandler = event => {
            const $window = $(window);

            this.width = this.initialWidth = this.$element.width();
            this.height = this.initialHeight = this.$element.height();
            this.startWidth = this.width;
            this.startHeight = this.height;

            this.posX = parseInt(this.$element.css('left'));
            this.posY = parseInt(this.$element.css('top'));
            this.startPosX = this.posX;
            this.startPosY = this.posY;

            this.startX = event.clientX;
            this.startY = event.clientY;

            this.$element.addClass('resizing');

            $window.on('mousemove', event.data, this.resizeHandler);
            $window.on('mouseup', event.data, this.endResizeHandler);
        };

        this.resizeHandler = event => {
            const { xDirection, yDirection } = event.data;
            let x, y;
            x = event.clientX < 0 ? 0 : event.clientX;
            x = x > window.innerWidth ? window.innerWidth : x;
            y = event.clientY < 0 ? 0 : event.clientY;
            y = y > window.innerHeight ? window.innerHeight : y;

            const xDistance = (x - this.startX) * xDirection;
            const yDistance = (y - this.startY) * yDirection;

            const width = xDistance + this.startWidth;
            const height = yDistance + this.startHeight;
            this.width = width < this.minWidth ? this.minWidth : width;
            this.height = height < this.minHeight ? this.minHeight : height;
            this.$element.width(this.width);
            this.$element.height(this.height);

            if (xDirection < 0) {
                this.posX = this.startPosX - xDistance;
                if (width < this.minWidth) {
                    this.posX = this.startPosX + (this.startWidth - this.minWidth);
                }

                this.$element.css('left', `${this.posX}px`);
            }

            if (yDirection < 0) {
                this.posY = this.startPosY - yDistance;
                if (height < this.minHeight) {
                    this.posY = this.startPosY + (this.startHeight - this.minHeight);
                }

                this.$element.css('top', `${this.posY}px`);
            }
        };

        this.endResizeHandler = event => {
            const $window = $(window);

            $window.off('mousemove', this.resizeHandler);
            $window.off('mouseup', this.endResizeHandler);

            this.$element.removeClass('resizing');

            // Let the listeners know that this element was resized
            this.$element.trigger('resize');
        };
    }

    attachEventHandlers($bound, xDirection, yDirection) {
        const eventData = {
            xDirection,
            yDirection
        };
        $bound.on('mousedown', eventData, this.initResizeHandler);
    }

    detachEventHandlers($bound) {
        const $window = $(window);

        $bound.off('mousedown', this.initResizeHandler);
        $window.off('mousemove', this.resizeHandler);
        $window.off('mouseup', this.endResizeHandler);
    }

    createBound(xDirection, yDirection) {
        if (xDirection === 0 && xDirection === yDirection) {
            return;
        }

        const $bound = $('<div class="resize-bound"></div>');

        $bound[0].onselectstart = () => false;

        $bound.css('font-size', `${this.boundSize}px`);

        const mapX = ['left', 'center', 'right'];
        const mapY = ['top', 'middle', 'bottom'];
        $bound.addClass('bound-' + mapX[xDirection + 1]);
        $bound.addClass('bound-' + mapY[yDirection + 1]);

        $bound.appendTo(this.$element);

        this.attachEventHandlers($bound, xDirection, yDirection);
    }

}

OHIF.ui.Resizable = Resizable;
