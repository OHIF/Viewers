import { Blaze } from 'meteor/blaze';

/**
 * Helper function to determine if the current client devices
 * is touch-capable. This can be used to modify certain aspects of the UI.
 *
 * The check may not work on all devices!
 *
 * @returns {boolean} true if the client device is touch-capable, false otherwise
 */
const isTouchDevice = () => {
    return (('ontouchstart' in window) ||
    (navigator.MaxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0));
};

/**
 * Blaze helper for checking if the current device is touch capable
 *
 * @returns {boolean} true if the client device is touch-capable, false otherwise
 */
Blaze.registerHelper('isTouchDevice', isTouchDevice);

export { isTouchDevice };
