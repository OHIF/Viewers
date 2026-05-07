/**
 * Example URL-loaded customization module: veterinaryOverlay
 *
 * Demonstrates a runtime-loaded customization that overrides the default
 * viewport overlay with a veterinary-style demographics layout. Loaded via
 * `?customization=veterinaryOverlay` (see CustomizationService URL handling).
 *
 * Uses the same default-export shape as cornerstone overlay samples
 * (`global` at top level) and `inheritsFrom: 'ohif.overlayItem'` on each
 * row, matching `extensions/cornerstone/.../viewportOverlayCustomization.tsx`.
 */
export default {
  global: {
    'viewportOverlay.topLeft': {
      $set: [
        {
          id: 'PatientName',
          inheritsFrom: 'ohif.overlayItem',
          attribute: 'PatientName',
          label: 'Patient',
          title: 'Patient name',
        },
        {
          id: 'PatientID',
          inheritsFrom: 'ohif.overlayItem',
          attribute: 'PatientID',
          label: 'ID',
          title: 'Patient ID',
        },
        {
          id: 'StudyDate',
          inheritsFrom: 'ohif.overlayItem',
          attribute: 'StudyDate',
          label: 'Date',
          title: 'Study date',
        },
      ],
    },
    'viewportOverlay.topRight': {
      $set: [
        {
          id: 'PatientSpecies',
          inheritsFrom: 'ohif.overlayItem',
          attribute: 'PatientSpecies',
          label: 'Species',
          title: 'Patient species',
        },
        {
          id: 'PatientBreed',
          inheritsFrom: 'ohif.overlayItem',
          attribute: 'PatientBreed',
          label: 'Breed',
          title: 'Patient breed',
        },
      ],
    },
  },
};
