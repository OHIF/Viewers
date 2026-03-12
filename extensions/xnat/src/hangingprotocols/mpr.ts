import { Types } from '@ohif/core';

export const VOI_SYNC_GROUP = {
  type: 'voi',
  id: 'mpr',
  source: true,
  target: true,
  options: {
    syncColormap: true,
  },
};

export const HYDRATE_SEG_SYNC_GROUP = {
  type: 'hydrateseg',
  id: 'sameFORId',
  source: true,
  target: true,
  options: {
    matchingRules: ['sameFOR'],
  },
};

/** Sync pan and zoom across MPR viewports (same sync pattern as VOI/window-level). */
export const CAMERA_POSITION_SYNC_GROUP = {
  type: 'zoompan',
  id: 'mpr-zoompan',
  source: true,
  target: true,
};

export const mpr: Types.HangingProtocol.Protocol = {
  id: 'mpr',
  name: 'MPR',
  locked: true,
  icon: 'layout-advanced-mpr',
  isPreset: true,
  createdDate: '2021-02-23',
  modifiedDate: '2023-08-15',
  availableTo: {},
  editableBy: {},
  numberOfPriorsReferenced: 0,
  protocolMatchingRules: [
    {
      // Very low weight rule that matches any study
      // This allows MPR to be selected as a fallback when no specific protocols match
      weight: 0.01,
      attribute: 'StudyInstanceUID',
      constraint: {
        contains: '',
      },
      required: false,
    },
  ],
  imageLoadStrategy: 'nth',
  callbacks: {},
  // Default viewport for when MPR is selected as fallback
  defaultViewport: {
    viewportOptions: {
      viewportType: 'volume',
      toolGroupId: 'mpr',
      orientation: 'axial',
      initialImageOptions: {
        preset: 'middle',
      },
    },
    displaySets: [
      {
        id: 'activeDisplaySet',
      },
    ],
  },
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
          required: false,
        },
        {
          weight: 1,
          attribute: 'numImageFrames',
          constraint: {
            greaterThan: { value: 0 },
          },
          required: false,
        },
      ],
    },
  },
  stages: [
    {
      name: 'MPR 1x3',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 3,
          layoutOptions: [
            {
              x: 0,
              y: 0,
              width: 1 / 3,
              height: 1,
            },
            {
              x: 1 / 3,
              y: 0,
              width: 1 / 3,
              height: 1,
            },
            {
              x: 2 / 3,
              y: 0,
              width: 1 / 3,
              height: 1,
            },
          ],
        },
      },
      viewports: [
        {
          viewportOptions: {
            viewportId: 'mpr-axial',
            toolGroupId: 'mpr',
            viewportType: 'volume',
            orientation: 'axial',
            initialImageOptions: {
              preset: 'middle',
            },
            syncGroups: [VOI_SYNC_GROUP, HYDRATE_SEG_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP],
          },
          displaySets: [
            {
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'mpr-sagittal',
            toolGroupId: 'mpr',
            viewportType: 'volume',
            orientation: 'sagittal',
            initialImageOptions: {
              preset: 'middle',
            },
            syncGroups: [VOI_SYNC_GROUP, HYDRATE_SEG_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP],
          },
          displaySets: [
            {
              id: 'activeDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'mpr-coronal',
            toolGroupId: 'mpr',
            viewportType: 'volume',
            orientation: 'coronal',
            initialImageOptions: {
              preset: 'middle',
            },
            syncGroups: [VOI_SYNC_GROUP, HYDRATE_SEG_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP],
          },
          displaySets: [
            {
              id: 'activeDisplaySet',
            },
          ],
        },
      ],
    },
  ],
};

export default mpr;
