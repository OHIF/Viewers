// --- mip viewports for CT only ---
const mipAXIAL: AppTypes.HangingProtocol.Viewport = {
  viewportOptions: {
    viewportId: 'mipAXIAL',
    viewportType: 'volume',
    orientation: 'axial',
    toolGroupId: 'mipToolGroup',
    // optional: hide overlays if you want cleaner MIP
    customViewportProps: { hideOverlays: true },
    syncGroups: [
      // reuse existing voi sync groups if needed
      { type: 'voi', id: 'ctWLSync', source: true, target: true, options: { syncColormap: true } },
    ],
  },
  displaySets: [
    {
      id: 'ctDisplaySet',
      options: {
        blendMode: 'MIP',
        slabThickness: 'fullVolume', // default; can be 'fullVolume' | number | 'thin' etc.
      },
    },
  ],
};

const mipSAGITTAL_CT: AppTypes.HangingProtocol.Viewport = {
  viewportOptions: {
    viewportId: 'mipSAGITTAL_CT',
    viewportType: 'volume',
    orientation: 'sagittal',
    toolGroupId: 'mipToolGroup',
    customViewportProps: { hideOverlays: true },
    syncGroups: [
      { type: 'voi', id: 'ctWLSync', source: true, target: true, options: { syncColormap: true } },
    ],
  },
  displaySets: [
    {
      id: 'ctDisplaySet',
      matchedDisplaySetsIndex: -1,
      options: {
        blendMode: 'MIP',
        slabThickness: 20,
      },
    },
  ],
};

const mipCORONAL_CT: AppTypes.HangingProtocol.Viewport = {
  viewportOptions: {
    viewportId: 'mipCORONAL_CT',
    viewportType: 'volume',
    orientation: 'coronal',
    toolGroupId: 'mipToolGroup',
    customViewportProps: { hideOverlays: true },
    syncGroups: [{ type: 'voi', id: 'ctWLSync', source: true, target: true }],
  },
  displaySets: [
    {
      id: 'ctDisplaySet',
      options: {
        blendMode: 'MIP',
        slabThickness: 'fullVolume',
      },
    },
  ],
};

export { mipAXIAL, mipSAGITTAL_CT, mipCORONAL_CT };
