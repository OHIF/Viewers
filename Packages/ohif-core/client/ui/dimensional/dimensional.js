import { $ } from 'meteor/jquery';

// Temporarily show and hide the element to enable dimension calculations
$.fn.tempShow = function(callback) {
    const elementsToHide = [];
    let current = this;

    // Temporarily show all parent invisible elements until body
    while (this.is(':hidden')) {
        const $element = $(current);
        if (!$element.length || $element.is(':visible')) {
            break;
        }

        $element.addClass('visible');
        elementsToHide.push(current);
        current = $element[0].parentElement;
    }

    if (typeof callback === 'function') {
        callback(this);
    }

    $(elementsToHide).removeClass('visible');

    return this;
};

// Adjust the max width/height to enable CSS3 transitions
$.fn.adjustMax = function(dimension, modifierFn) {
    const $element = $(this);

    // Temporarily make the element visible to allow getting its dimensions
    $element.tempShow(() => {
        const maxProperty = `max-${dimension}`;

        // Remove the current max restriction
        $element.each((i, e) => e.style.setProperty(maxProperty, 'none', 'important'));

        // Get the dimension function to obtain the outer dimension
        const dimensionFn = 'outer' + dimension.charAt(0).toUpperCase() + dimension.slice(1);
        const value = $element[dimensionFn]();

        // Remove the property (needed for IE)
        $element.each((i, e) => e.style.removeProperty(maxProperty));

        // Set the new max restriction
        $element.css(maxProperty, value);
    });
};
