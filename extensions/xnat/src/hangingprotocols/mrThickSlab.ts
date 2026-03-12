import { HYDRATE_SEG_SYNC_GROUP, VOI_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP } from './mpr';

const mrThickSlab = {
    id: 'mrThickSlab',
    locked: true,
    name: 'MR Thick Slab',
    icon: 'layout-advanced-mr-thick-slab',
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
        thickSlabDisplaySet: {
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
                        contains: ['THICK', 'SLAB', '3D', 'VOLUME'],
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
            id: 'mrThickSlabStage',
            name: 'MR Thick Slab',
            viewportStructure: {
                layoutType: 'grid',
                properties: {
                    rows: 2,
                    columns: 2,
                },
            },
            viewports: [
                {
                    viewportOptions: {
                        viewportId: 'mr-thick-slab-axial',
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
                            id: 'thickSlabDisplaySet',
                        },
                    ],
                },
                {
                    viewportOptions: {
                        viewportId: 'mr-thick-slab-sagittal',
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
                            id: 'thickSlabDisplaySet',
                        },
                    ],
                },
                {
                    viewportOptions: {
                        viewportId: 'mr-thick-slab-coronal',
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
                            id: 'thickSlabDisplaySet',
                        },
                    ],
                },
                {
                    viewportOptions: {
                        viewportId: 'mr-thick-slab-3d',
                        toolGroupId: 'volume3d',
                        viewportType: 'volume3d',
                        orientation: 'axial',
                        customViewportProps: {
                            hideOverlays: true,
                        },
                        syncGroups: [VOI_SYNC_GROUP, HYDRATE_SEG_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP],
                    },
                    displaySets: [
                        {
                            id: 'thickSlabDisplaySet',
                            options: {
                                displayPreset: {
                                    MR: 'MR-Default',
                                    default: 'MR-Default',
                                },
                            },
                        },
                    ],
                },
            ],
            createdDate: '2024-11-19T10:00:00.000Z',
        },
    ],
};

export default mrThickSlab;
