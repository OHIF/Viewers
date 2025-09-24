export default {
  'cornerstone.modalityOverlayDefaultColorMaps': {
    defaultSettings: {
      PT: {
        colormap: 'hsv',
        // Note: Right now, there is a nonlinear relationship between the opacity value
        // below and how it will get applied to the image. The limitation is in rendering.
        // We are working on this and will remove this note when it's fixed.
        // But don't expect 0.5 to be 50% opacity, but rather close to that.
        opacity: 0.5,
      },
      RTDOSE: {
        colormap: 'Isodose',
        // Note: Right now, there is a nonlinear relationship between the opacity value
        // below and how it will get applied to the image. The limitation is in rendering.
        // We are working on this and will remove this note when it's fixed.
        // But don't expect 0.5 to be 50% opacity, but rather close to that.

        opacity: 0.5,
      },
    },
  },
};
