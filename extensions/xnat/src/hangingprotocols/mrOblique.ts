import { HYDRATE_SEG_SYNC_GROUP, VOI_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP } from './mpr';

const mrOblique = {
    id: 'mrOblique',
    locked: true,
    name: 'MR Oblique',
    icon: 'layout-advanced-mr-oblique',
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
        obliqueDisplaySet: {
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
                        contains: ['OBLIQUE', 'OBL', 'SLANT', 'ANGLED'],
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
            id: 'mrObliqueStage',
            name: 'MR Oblique',
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
                        viewportId: 'mr-oblique',
                        toolGroupId: 'mpr',
                        viewportType: 'volume',
                        orientation: 'acquisition', // Use acquisition plane for oblique
                        initialImageOptions: {
                            preset: 'middle',
                        },
                        syncGroups: [VOI_SYNC_GROUP, HYDRATE_SEG_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP],
                    },
                    displaySets: [
                        {
                            id: 'obliqueDisplaySet',
                        },
                    ],
                },
            ],
            createdDate: '2024-11-19T10:00:00.000Z',
        },
    ],
};

export default mrOblique;
