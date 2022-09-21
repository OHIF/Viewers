const ptCT = {
  id: 'ptCT',
  locked: true,
  hasUpdatedPriorsInformation: false,
  name: 'Default',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2021-02-23T19:22:08.894Z',
  availableTo: {},
  editableBy: {},
  toolGroupIds: [
    'ctToolGroup',
    'ptToolGroup',
    'fusionToolGroup',
    'mipToolGroup',
  ],
  imageLoadStrategy: 'interleaveTopToBottom', // "default" , "interleaveTopToBottom",  "interleaveCenter"
  protocolMatchingRules: [
    {
      id: 'wauZK2QNEfDPwcAQo',
      weight: 1,
      attribute: 'ModalitiesInStudy',
      constraint: {
        contains: ['CT', 'PT'],
      },
      required: false,
    },
    {
      id: 'wauZK2QNEfDPwcAQo',
      weight: 1,
      attribute: 'StudyDescription',
      constraint: {
        contains: {
          value: 'PETCT',
        },
      },
      required: false,
    },
    {
      id: 'wauZK2QNEfDPwcAQo',
      weight: 1,
      attribute: 'StudyDescription',
      constraint: {
        contains: {
          value: 'PET/CT',
        },
      },
      required: false,
    },
  ],
  stages: [
    {
      id: 'hYbmMy3b7pz7GLiaT',
      name: 'default',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 3,
          columns: 4,
          layoutOptions: [
            {
              x: 0,
              y: 0,
              width: 1 / 4,
              height: 1 / 3,
            },
            {
              x: 1 / 4,
              y: 0,
              width: 1 / 4,
              height: 1 / 3,
            },
            {
              x: 2 / 4,
              y: 0,
              width: 1 / 4,
              height: 1 / 3,
            },
            {
              x: 0,
              y: 1 / 3,
              width: 1 / 4,
              height: 1 / 3,
            },
            {
              x: 1 / 4,
              y: 1 / 3,
              width: 1 / 4,
              height: 1 / 3,
            },
            {
              x: 2 / 4,
              y: 1 / 3,
              width: 1 / 4,
              height: 1 / 3,
            },
            {
              x: 0,
              y: 2 / 3,
              width: 1 / 4,
              height: 1 / 3,
            },
            {
              x: 1 / 4,
              y: 2 / 3,
              width: 1 / 4,
              height: 1 / 3,
            },
            {
              x: 2 / 4,
              y: 2 / 3,
              width: 1 / 4,
              height: 1 / 3,
            },
            {
              x: 3 / 4,
              y: 0,
              width: 1 / 4,
              height: 1,
            },
          ],
        },
      },
      displaySets: [
        {
          id: 'ctDisplaySet',
          imageMatchingRules: [],
          seriesMatchingRules: [
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'Modality',
              constraint: {
                equals: {
                  value: 'CT',
                },
              },
              required: true,
            },
            {
              id: 'vSjk7NCYjtdS3XZAw',
              weight: 1,
              attribute: 'SeriesNumber',
              constraint: {
                equals: {
                  value: '4',
                },
              },
              required: false,
            },
            {
              id: 'vSjk7NCYjtdS3XZAw',
              weight: 1,
              attribute: 'SeriesDescription',
              constraint: {
                contains: {
                  value: 'CT',
                },
              },
              required: false,
            },
            {
              id: 'vSjk7NCYjtdS3XZAw',
              weight: 1,
              attribute: 'SeriesDescription',
              constraint: {
                contains: {
                  value: 'CT WB',
                },
              },
              required: false,
            },
          ],
          studyMatchingRules: [],
        },
        {
          id: 'ptDisplaySet',
          imageMatchingRules: [],
          seriesMatchingRules: [
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'Modality',
              constraint: {
                equals: {
                  value: 'PT',
                },
              },
              required: true,
            },
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'SeriesDescription',
              constraint: {
                contains: {
                  value: 'Corrected',
                },
              },
              required: false,
            },
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 2,
              attribute: 'SeriesDescription',
              constraint: {
                doesNotContain: {
                  value: 'Uncorrected',
                },
              },
              required: false,
            },
          ],
          studyMatchingRules: [],
        },
      ],
      viewports: [
        {
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
        },
        {
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
        },
        {
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
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'ptAXIAL',
            viewportType: 'volume',
            background: [1, 1, 1],
            orientation: 'axial',
            toolGroupId: 'ptToolGroup',
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
                id: 'ptWLSync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'ptFusionWLSync',
                source: true,
                target: false,
              },
            ],
          },
          displaySets: [
            {
              options: {
                voi: {
                  windowWidth: 5,
                  windowCenter: 2.5,
                },
                voiInverted: true,
              },
              id: 'ptDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'ptSAGITTAL',
            viewportType: 'volume',
            orientation: 'sagittal',
            background: [1, 1, 1],
            toolGroupId: 'ptToolGroup',
            syncGroups: [
              {
                type: 'cameraPosition',
                id: 'sagittalSync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'ptWLSync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'ptFusionWLSync',
                source: true,
                target: false,
              },
            ],
          },
          displaySets: [
            {
              options: {
                voi: {
                  windowWidth: 5,
                  windowCenter: 2.5,
                },
                voiInverted: true,
              },
              id: 'ptDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'ptCORONAL',
            viewportType: 'volume',
            orientation: 'coronal',
            background: [1, 1, 1],
            toolGroupId: 'ptToolGroup',
            syncGroups: [
              {
                type: 'cameraPosition',
                id: 'coronalSync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'ptWLSync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'ptFusionWLSync',
                source: true,
                target: false,
              },
            ],
          },
          displaySets: [
            {
              options: {
                voi: {
                  windowWidth: 5,
                  windowCenter: 2.5,
                },
                voiInverted: true,
              },
              id: 'ptDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'fusionAXIAL',
            viewportType: 'volume',
            orientation: 'axial',
            toolGroupId: 'fusionToolGroup',
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
                source: false,
                target: true,
              },
              {
                type: 'voi',
                id: 'fusionWLSync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'ptFusionWLSync',
                source: false,
                target: true,
              },
            ],
          },
          displaySets: [
            {
              id: 'ctDisplaySet',
            },
            {
              options: {
                colormap: 'hsv',
                voi: {
                  windowWidth: 5,
                  windowCenter: 2.5,
                },
              },
              id: 'ptDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'fusionSAGITTAL',
            viewportType: 'volume',
            orientation: 'sagittal',
            toolGroupId: 'fusionToolGroup',
            // initialImageOptions: {
            //   index: 180,
            //   preset: 'middle', // 'first', 'last', 'middle'
            // },
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
                source: false,
                target: true,
              },
              {
                type: 'voi',
                id: 'fusionWLSync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'ptFusionWLSync',
                source: false,
                target: true,
              },
            ],
          },
          displaySets: [
            {
              id: 'ctDisplaySet',
            },
            {
              options: {
                colormap: 'hsv',
                voi: {
                  windowWidth: 5,
                  windowCenter: 2.5,
                },
              },
              id: 'ptDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'fusionCoronal',
            viewportType: 'volume',
            orientation: 'coronal',
            toolGroupId: 'fusionToolGroup',
            // initialImageOptions: {
            //   index: 180,
            //   preset: 'middle', // 'first', 'last', 'middle'
            // },
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
                source: false,
                target: true,
              },
              {
                type: 'voi',
                id: 'fusionWLSync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'ptFusionWLSync',
                source: false,
                target: true,
              },
            ],
          },
          displaySets: [
            {
              id: 'ctDisplaySet',
            },
            {
              options: {
                colormap: 'hsv',
                voi: {
                  windowWidth: 5,
                  windowCenter: 2.5,
                },
              },
              id: 'ptDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'mipSagittal',
            viewportType: 'volume',
            orientation: 'sagittal',
            background: [1, 1, 1],
            toolGroupId: 'mipToolGroup',
            syncGroups: [
              {
                type: 'voi',
                id: 'ptWLSync',
                source: true,
                target: true,
              },
              {
                type: 'voi',
                id: 'ptFusionWLSync',
                source: true,
                target: false,
              },
            ],

            // Custom props can be used to set custom properties which extensions
            // can react on.
            customViewportProps: {
              // We use viewportDisplay to filter the viewports which are displayed
              // in mip and we set the scrollbar according to their rotation index
              // in the cornerstone extension.
              hideOverlays: true,
            },
          },
          displaySets: [
            {
              options: {
                blendMode: 'MIP',
                slabThickness: 'fullVolume',
                voi: {
                  windowWidth: 5,
                  windowCenter: 2.5,
                },
                voiInverted: true,
              },
              id: 'ptDisplaySet',
            },
          ],
        },
      ],
      createdDate: '2021-02-23T18:32:42.850Z',
    },
  ],
  numberOfPriorsReferenced: -1,
};

function getHangingProtocolModule() {
  return [
    {
      id: ptCT.id,
      protocol: ptCT,
    },
  ];
}

export default getHangingProtocolModule;
