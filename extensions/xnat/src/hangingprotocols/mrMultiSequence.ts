import { HYDRATE_SEG_SYNC_GROUP, VOI_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP } from './mpr';

const mrMultiSequence = {
    id: 'mrMultiSequence',
    locked: true,
    name: 'MR Multi-Sequence',
    icon: 'layout-advanced-mr-multi',
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
        t1DisplaySet: {
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
                    attribute: 'SeriesDescription',
                    constraint: {
                        contains: 'T1',
                    },
                    required: true,
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
        t2DisplaySet: {
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
                    attribute: 'SeriesDescription',
                    constraint: {
                        contains: 'T2',
                    },
                    required: true,
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
        flairDisplaySet: {
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
                    attribute: 'SeriesDescription',
                    constraint: {
                        contains: 'FLAIR',
                    },
                    required: true,
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
            id: 'mrMultiSequenceStage',
            name: 'MR Multi-Sequence',
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
                        viewportId: 'mr-multi-t1',
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
                            id: 't1DisplaySet',
                        },
                    ],
                },
                {
                    viewportOptions: {
                        viewportId: 'mr-multi-t2',
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
                            id: 't2DisplaySet',
                        },
                    ],
                },
                {
                    viewportOptions: {
                        viewportId: 'mr-multi-flair',
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
                            id: 'flairDisplaySet',
                        },
                    ],
                },
            ],
            createdDate: '2024-11-19T10:00:00.000Z',
        },
    ],
};

export default mrMultiSequence;
