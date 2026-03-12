import { HYDRATE_SEG_SYNC_GROUP, VOI_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP } from './mpr';

const mrMpr = {
    id: 'mrMpr',
    locked: true,
    name: 'MR MPR',
    icon: 'layout-advanced-mpr',
    isPreset: true,
    createdDate: '2024-11-19T10:00:00.000Z',
    modifiedDate: '2024-11-19T10:00:00.000Z',
    availableTo: {},
    editableBy: {},
    protocolMatchingRules: [
        {
            weight: 1,
            attribute: 'ModalitiesInStudy',
            constraint: {
                contains: ['MR'],
            },
        },
    ],
    imageLoadStrategy: 'nth',
    displaySetSelectors: {
        mrDisplaySet: {
            seriesMatchingRules: [
                {
                    weight: 2,
                    attribute: 'Modality',
                    constraint: {
                        equals: 'MR',
                    },
                    required: false,
                },
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
            name: 'MR MPR 1x3',
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
                        viewportId: 'mr-mpr-axial',
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
                            id: 'mrDisplaySet',
                        },
                    ],
                },
                {
                    viewportOptions: {
                        viewportId: 'mr-mpr-sagittal',
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
                            id: 'mrDisplaySet',
                        },
                    ],
                },
                {
                    viewportOptions: {
                        viewportId: 'mr-mpr-coronal',
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
                            id: 'mrDisplaySet',
                        },
                    ],
                },
            ],
        },
    ],
};

export default mrMpr;
