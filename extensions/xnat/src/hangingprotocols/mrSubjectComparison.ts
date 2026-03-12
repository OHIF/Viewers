import { CAMERA_POSITION_SYNC_GROUP } from './mpr';

// Sync groups for coordinated viewing
const VOI_SYNC_GROUP = {
    type: 'voi',
    id: 'mpr-comparison',
    source: true,
    target: true,
    options: {
        syncColormap: true,
    },
};

const HYDRATE_SEG_SYNC_GROUP = {
    type: 'hydrateseg',
    id: 'sameFORId',
    source: true,
    target: true,
    options: {
        matchingRules: ['sameFOR'],
    },
};

// Display set selector for current study (index 0)
const currentDisplaySetSelector = {
    studyMatchingRules: [
        {
            // Match the first study (current/primary)
            attribute: 'studyInstanceUIDsIndex',
            from: 'options',
            required: true,
            constraint: {
                equals: { value: 0 },
            },
        },
    ],
    seriesMatchingRules: [
        {
            weight: 2,
            attribute: 'isReconstructable',
            constraint: {
                equals: { value: true },
            },
            required: false,
        },
        {
            weight: 1,
            attribute: 'numImageFrames',
            constraint: {
                greaterThan: { value: 0 },
            },
        },
    ],
};

// Display set selector for prior study (index 1)
const priorDisplaySetSelector = {
    studyMatchingRules: [
        {
            // Match the second study (prior/comparison)
            attribute: 'studyInstanceUIDsIndex',
            from: 'options',
            required: true,
            constraint: {
                equals: { value: 1 },
            },
        },
    ],
    seriesMatchingRules: [
        {
            weight: 2,
            attribute: 'isReconstructable',
            constraint: {
                equals: { value: true },
            },
            required: false,
        },
        {
            weight: 1,
            attribute: 'numImageFrames',
            constraint: {
                greaterThan: { value: 0 },
            },
        },
    ],
};

// Current study viewports (top row)
const currentAxialViewport = {
    viewportOptions: {
        viewportId: 'current-mpr-axial',
        viewportType: 'volume',
        toolGroupId: 'mpr',
        orientation: 'axial',
        allowUnmatchedView: true,
        initialImageOptions: {
            preset: 'middle',
        },
        syncGroups: [VOI_SYNC_GROUP, HYDRATE_SEG_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP],
    },
    displaySets: [
        {
            id: 'currentDisplaySetId',
        },
    ],
};

const currentSagittalViewport = {
    viewportOptions: {
        viewportId: 'current-mpr-sagittal',
        viewportType: 'volume',
        toolGroupId: 'mpr',
        orientation: 'sagittal',
        allowUnmatchedView: true,
        initialImageOptions: {
            preset: 'middle',
        },
        syncGroups: [VOI_SYNC_GROUP, HYDRATE_SEG_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP],
    },
    displaySets: [
        {
            id: 'currentDisplaySetId',
        },
    ],
};

const currentCoronalViewport = {
    viewportOptions: {
        viewportId: 'current-mpr-coronal',
        viewportType: 'volume',
        toolGroupId: 'mpr',
        orientation: 'coronal',
        allowUnmatchedView: true,
        initialImageOptions: {
            preset: 'middle',
        },
        syncGroups: [VOI_SYNC_GROUP, HYDRATE_SEG_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP],
    },
    displaySets: [
        {
            id: 'currentDisplaySetId',
        },
    ],
};

// Prior study viewports (bottom row)
const priorAxialViewport = {
    viewportOptions: {
        viewportId: 'prior-mpr-axial',
        viewportType: 'volume',
        toolGroupId: 'mpr',
        orientation: 'axial',
        allowUnmatchedView: true,
        initialImageOptions: {
            preset: 'middle',
        },
        syncGroups: [VOI_SYNC_GROUP, HYDRATE_SEG_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP],
    },
    displaySets: [
        {
            id: 'priorDisplaySetId',
        },
    ],
};

const priorSagittalViewport = {
    viewportOptions: {
        viewportId: 'prior-mpr-sagittal',
        viewportType: 'volume',
        toolGroupId: 'mpr',
        orientation: 'sagittal',
        allowUnmatchedView: true,
        initialImageOptions: {
            preset: 'middle',
        },
        syncGroups: [VOI_SYNC_GROUP, HYDRATE_SEG_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP],
    },
    displaySets: [
        {
            id: 'priorDisplaySetId',
        },
    ],
};

const priorCoronalViewport = {
    viewportOptions: {
        viewportId: 'prior-mpr-coronal',
        viewportType: 'volume',
        toolGroupId: 'mpr',
        orientation: 'coronal',
        allowUnmatchedView: true,
        initialImageOptions: {
            preset: 'middle',
        },
        syncGroups: [VOI_SYNC_GROUP, HYDRATE_SEG_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP],
    },
    displaySets: [
        {
            id: 'priorDisplaySetId',
        },
    ],
};

/**
 * Hanging protocol for comparing two MR studies from the same subject
 * Layout: 3x2 grid with MPR views
 * - Top row: Current study (Axial, Sagittal, Coronal)
 * - Bottom row: Prior study (Axial, Sagittal, Coronal)
 */
const mrSubjectComparison = {
    id: '@ohif/mrSubjectComparison',
    description: 'Compare two MR studies with MPR views (3x2 grid)',
    name: 'MR Subject Comparison MPR',
    numberOfPriorsReferenced: 1, // Expect exactly 1 prior study
    protocolMatchingRules: [
        {
            id: 'Two Studies Required',
            weight: 1000,
            // Check that a prior study exists
            attribute: 'StudyInstanceUID',
            from: 'prior',
            required: true,
            constraint: {
                notNull: true,
            },
        },
    ],
    toolGroupIds: ['mpr'],
    imageLoadStrategy: 'nth',
    displaySetSelectors: {
        currentDisplaySetId: currentDisplaySetSelector,
        priorDisplaySetId: priorDisplaySetSelector,
    },
    defaultViewport: {
        viewportOptions: {
            viewportType: 'volume',
            toolGroupId: 'mpr',
            orientation: 'axial',
            allowUnmatchedView: true,
            initialImageOptions: {
                preset: 'middle',
            },
            syncGroups: [VOI_SYNC_GROUP, HYDRATE_SEG_SYNC_GROUP, CAMERA_POSITION_SYNC_GROUP],
        },
        displaySets: [
            {
                id: 'currentDisplaySetId',
                matchedDisplaySetsIndex: -1,
            },
        ],
    },
    stages: [
        {
            name: 'MPR Side-by-Side Comparison (3x2)',
            stageActivation: {
                enabled: {
                    minViewportsMatched: 2, // At least 2 viewports to activate
                },
            },
            viewportStructure: {
                layoutType: 'grid',
                properties: {
                    rows: 2,
                    columns: 3,
                    layoutOptions: [
                        // Top row - Current study
                        { x: 0, y: 0, width: 1 / 3, height: 1 / 2 },
                        { x: 1 / 3, y: 0, width: 1 / 3, height: 1 / 2 },
                        { x: 2 / 3, y: 0, width: 1 / 3, height: 1 / 2 },
                        // Bottom row - Prior study
                        { x: 0, y: 1 / 2, width: 1 / 3, height: 1 / 2 },
                        { x: 1 / 3, y: 1 / 2, width: 1 / 3, height: 1 / 2 },
                        { x: 2 / 3, y: 1 / 2, width: 1 / 3, height: 1 / 2 },
                    ],
                },
            },
            viewports: [
                // Top row: Current study MPR views
                currentAxialViewport,
                currentSagittalViewport,
                currentCoronalViewport,
                // Bottom row: Prior study MPR views
                priorAxialViewport,
                priorSagittalViewport,
                priorCoronalViewport,
            ],
        },
    ],
};

export default mrSubjectComparison;
