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
        for (var x = -1; x <= 1; x++) {
            for (var y = -1; y <= 1; y++) {
                this.createBound(x, y);
            }
        }

        this.$element.addClass('resizable');
    }

    destroy() {
        this.$element.removeClass('resizable').find('resize-bound').remove();
    }

    attachEventHandlers($bound, xDirection, yDirection) {
        const $window = $(window);

        const initResizeHandler = event => {
            event.stopPropagation();

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

            $window.on('mousemove', resizeHandler);
            $window.on('mouseup', endResizeHandler);
        };

        const resizeHandler = event => {
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

        const endResizeHandler = event => {
            $window.off('mousemove', resizeHandler);
            $window.off('mouseup', endResizeHandler);

            this.$element.removeClass('resizing');
        };

        $bound.on('mousedown', initResizeHandler);
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
