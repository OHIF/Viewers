/**
 * Example chaining module: ensures `veterinaryOverlay` is loaded and applied
 * first when using `?customization=veterinary` alone.
 */
export default {
  requires: ['veterinaryOverlay'],
};
