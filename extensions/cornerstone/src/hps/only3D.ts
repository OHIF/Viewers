import { HYDRATE_SEG_SYNC_GROUP, VOI_SYNC_GROUP } from './mpr';
import i18n from 'i18next';

export const only3D = {
  id: 'only3D',
  locked: true,
  name: i18n.t('Hps:3D only'),
  icon: 'layout-advanced-3d-only',
  isPreset: true,
  createdDate: '2023-03-15T10:29:44.894Z',
  modifiedDate: '2023-03-15T10:29:44.894Z',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [],
  imageLoadStrategy: 'interleaveCenter',
  displaySetSelectors: {
    activeDisplaySet: {
      seriesMatchingRules: [
        {
          weight: 1,
          attribute: 'isReconstructable',
          constraint: {
            equals: {
              value: true,
            },
          },
          required: true,
        },
      ],
    },
  },
  stages: [
    {
      id: 'only3DStage',
      name: 'only3D',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 1,
        },
      },
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'volume3d',
            viewportType: 'volume3d',
            orientation: 'coronal',
            customViewportProps: {
              hideOverlays: true,
              syncGroups: [HYDRATE_SEG_SYNC_GROUP],
            },
          },
          displaySets: [
            {
              id: 'activeDisplaySet',
              options: {
                displayPreset: {
                  CT: 'CT-Bone',
                  MR: 'MR-Default',
                  default: 'CT-Bone',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
