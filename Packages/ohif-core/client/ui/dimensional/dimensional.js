import { $ } from 'meteor/jquery';

// Temporarily show and hide the element to enable dimension calculations
$.fn.tempShow = function(callback) {
    const elementsToHide = [];
    let current = this;

    // Temporarily show all parent invisible elements until body
    while (this.is(':hidden') && current !== document.body) {
        const $element = this.parentsUntil(':visible').last();
        if (!$element.length) {
            break;
        }

        $element.addClass('visible');
        current = $element[0];
        elementsToHide.push(current);
    }

    if (typeof callback === 'function') {
        callback(this);
    }

    $(elementsToHide).removeClass('visible');

    return this;
};

// Adjust the max width/height to enable CSS3 transitions
$.fn.adjustMax = function(dimension) {
    const $element = $(this);
    $element.tempShow(() => {
        // Add a class to remove the max restriction
        const maxClass = `no-max-${dimension}`;
        $element.addClass(maxClass);

        // Get the dimension function to obtain the outer dimension
        const dimensionFn = 'outer' + dimension.charAt(0).toUpperCase() + dimension.slice(1);
        const value = $element[dimensionFn]();

        // Remove the max restriction class and set the new max
        const maxProperty = `max-${dimension}`;
        $element.removeClass(maxClass).css(maxProperty, value);
    });
};
