import { OHIF } from 'meteor/ohif:core';
import { Meteor } from 'meteor/meteor';

// Get the UI settings
const ui = Meteor.settings && Meteor.settings.public && Meteor.settings.public.ui;
OHIF.uiSettings = ui || {};

/**
 * Get the offset for the given element
 *
 * @param {Object} element DOM element which will have the offser calculated
 * @returns {Object} Object containing the top and left offset
 */
OHIF.ui.getOffset = element => {
    let top = 0;
    let left = 0;
    if (element.offsetParent) {
        do {
            left += element.offsetLeft;
            top += element.offsetTop;
        } while (element = element.offsetParent);
    }

    return {
        left,
        top
    };
};

/**
 * Get the vertical and horizontal scrollbar sizes
 * Got from https://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes
 *
 * @returns {Array} Array containing the scrollbar horizontal and vertical sizes
 */
OHIF.ui.getScrollbarSize = () => {
    const inner = document.createElement('p');
    inner.style.width = '100%';
    inner.style.height = '100%';

    const outer = document.createElement('div');
    outer.style.position = 'absolute';
    outer.style.top = '0px';
    outer.style.left = '0px';
    outer.style.visibility = 'hidden';
    outer.style.width = '100px';
    outer.style.height = '100px';
    outer.style.overflow = 'hidden';
    outer.appendChild(inner);

    document.body.appendChild(outer);

    const w1 = inner.offsetWidth;
    const h1 = inner.offsetHeight;
    outer.style.overflow = 'scroll';
    let w2 = inner.offsetWidth;
    let h2 = inner.offsetHeight;

    if (w1 === w2) {
        w2 = outer.clientWidth;
    }

    if (h1 === h2) {
        h2 = outer.clientHeight;
    }

    document.body.removeChild(outer);

    return [(w1 - w2), (h1 - h2)];
};

/**
 * Check if the pressed key combination will result in a character input
 * Got from https://stackoverflow.com/questions/4179708/how-to-detect-if-the-pressed-key-will-produce-a-character-inside-an-input-text
 *
 * @returns {Boolean} Wheter the pressed key combination will input a character or not
 */
OHIF.ui.isCharacterKeyPress = event => {
    if (typeof event.which === 'undefined') {
        // This is IE, which only fires keypress events for printable keys
        return true;
    } else if (typeof event.which === 'number' && event.which > 0) {
        // In other browsers except old versions of WebKit, event.which is
        // only greater than zero if the keypress is a printable key.
        // We need to filter out backspace and ctrl/alt/meta key combinations
        return !event.ctrlKey && !event.metaKey && !event.altKey && event.which !== 8;
    }

    return false;
};
