import { HYDRATE_SEG_SYNC_GROUP, VOI_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP } from './mpr';

const mrSagittal = {
    id: 'mrSagittal',
    locked: true,
    name: 'MR Sagittal',
    icon: 'layout-advanced-sagittal',
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
            id: 'mrSagittalStage',
            name: 'MR Sagittal',
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
                        viewportId: 'mr-sagittal',
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
            ],
            createdDate: '2024-11-19T10:00:00.000Z',
        },
    ],
};

export default mrSagittal;
