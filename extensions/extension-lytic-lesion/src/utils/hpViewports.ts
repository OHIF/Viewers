const ctAXIAL = {
  viewportOptions: {
    viewportId: 'ctAXIAL',
    viewportType: 'volume',
    orientation: 'axial',
    toolGroupId: 'ctToolGroup',
    initialImageOptions: {
      // index: 5,
      preset: 'first', // 'first', 'last', 'middle'
    },
    syncGroups: [
      {
        type: 'cameraPosition',
        id: 'axialSync',
        source: true,
        target: true,
      },
      {
        type: 'voi',
        id: 'ctWLSync',
        source: true,
        target: true,
      },
    ],
  },
  displaySets: [
    {
      id: 'ctDisplaySet',
    },
  ],
};

const ctSAGITTAL = {
  viewportOptions: {
    viewportId: 'ctSAGITTAL',
    viewportType: 'volume',
    orientation: 'sagittal',
    toolGroupId: 'ctToolGroup',
    syncGroups: [
      {
        type: 'cameraPosition',
        id: 'sagittalSync',
        source: true,
        target: true,
      },
      {
        type: 'voi',
        id: 'ctWLSync',
        source: true,
        target: true,
      },
    ],
  },
  displaySets: [
    {
      id: 'ctDisplaySet',
    },
  ],
};
const ctCORONAL = {
  viewportOptions: {
    viewportId: 'ctCORONAL',
    viewportType: 'volume',
    orientation: 'coronal',
    toolGroupId: 'ctToolGroup',
    syncGroups: [
      {
        type: 'cameraPosition',
        id: 'coronalSync',
        source: true,
        target: true,
      },
      {
        type: 'voi',
        id: 'ctWLSync',
        source: true,
        target: true,
      },
    ],
  },
  displaySets: [
    {
      id: 'ctDisplaySet',
      options: {
        // colormap: 'test',
      },
    },
  ],
};
export {
  ctAXIAL,
  ctSAGITTAL,
  ctCORONAL,
};
