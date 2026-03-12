import { HYDRATE_SEG_SYNC_GROUP, VOI_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP } from './mpr';

const mrCoronal = {
    id: 'mrCoronal',
    locked: true,
    name: 'MR Coronal',
    icon: 'layout-advanced-coronal',
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
    imageLoadStrategy: 'interleaveCenter',
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
            id: 'mrCoronalStage',
            name: 'MR Coronal',
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
                        viewportId: 'mr-coronal',
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
            createdDate: '2024-11-19T10:00:00.000Z',
        },
    ],
};

export default mrCoronal;
