import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const serverNameDefinitions = {
    type: String,
    label: 'Server Name',
    max: 100
};

const serverTypeDefinitions = {
    type: String,
    label: 'Server Type',
    allowedValues: ['dicomWeb', 'dimse'],
    valuesLabels: ['DICOM Web', 'DIMSE'],
    optional: true
};

const wadoUriRootDefinitions = {
    type: String,
    label: 'WADO URI root',
    max: 1000
};

const availableMouseButtonTools = ['wwwc', 'zoom', 'pan', 'stackScroll'];

export const DICOMWebRequestOptions = new SimpleSchema({
    auth: {
        type: String,
        label: 'Authentication',
        defaultValue: 'orthanc:orthanc',
        optional: true
    },
    requestFromBrowser: {
        type: Boolean,
        label: 'Make DICOMWeb requests from the Browser',
        defaultValue: false,
        optional: true
    },
    logRequests: {
        type: Boolean,
        defaultValue: true,
        label: 'Requests'
    },
    logResponses: {
        type: Boolean,
        defaultValue: false,
        label: 'Responses'
    },
    logTiming: {
        type: Boolean,
        defaultValue: true,
        label: 'Timing'
    }
});

export const DICOMWebServer = new SimpleSchema({
    name: serverNameDefinitions,
    type: serverTypeDefinitions,
    wadoUriRoot: wadoUriRootDefinitions,
    wadoRoot: {
        type: String,
        label: 'WADO root',
        max: 1000
    },
    imageRendering: {
        type: String,
        label: 'Image rendering',
        allowedValues: ['wadouri', 'wadors'],
        valuesLabels: ['WADO URI', 'WADO RS'],
        defaultValue: 'wadouri'
    },
    thumbnailRendering: {
        type: String,
        label: 'Thumbnail rendering',
        allowedValues: ['wadouri', 'wadors'],
        valuesLabels: ['WADO URI', 'WADO RS'],
        defaultValue: 'wadouri'
    },
    qidoRoot: {
        type: String,
        label: 'QIDO root',
        max: 1000
    },
    qidoSupportsIncludeField: {
        type: Boolean,
        label: 'QIDO supports "includefield" query key',
        defaultValue: false
    },
    requestOptions: {
        type: DICOMWebRequestOptions,
        label: 'Request Options'
    }
});

export const DIMSEPeer = new SimpleSchema({
    aeTitle: {
        type: String,
        label: 'AE Title'
    },
    hostAE: {
        type: String,
        label: 'AE Host',
        optional: true
    },
    host: {
        type: String,
        label: 'Host Domain/IP',
        regEx: SimpleSchema.RegEx.WeakDomain
    },
    port: {
        type: Number,
        label: 'Port',
        min: 1,
        defaultValue: 11112,
        max: 65535
    },
    default: {
        type: Boolean,
        label: 'Default',
        defaultValue: false
    },
    server: {
        type: Boolean,
        label: 'Server',
        defaultValue: false
    },
    supportsInstanceRetrievalByStudyUid: {
        type: Boolean,
        label: 'Supports instance retrieval by StudyUid',
        defaultValue: true
    }
});

export const DIMSEServer = new SimpleSchema({
    name: serverNameDefinitions,
    type: serverTypeDefinitions,
    wadoUriRoot: wadoUriRootDefinitions,
    requestOptions: {
        type: DICOMWebRequestOptions,
        label: 'Request Options'
    },
    peers: {
        type: [DIMSEPeer],
        label: 'Peer List',
        minCount: 1
    }
});

export const UISettings = new SimpleSchema({
    studyListFunctionsEnabled: {
        type: Boolean,
        label: 'Study List Functions Enabled?',
        defaultValue: true
    },
    leftSidebarOpen: {
        type: Boolean,
        label: 'Left sidebar open by default?',
        defaultValue: false
    },
    leftSidebarDragAndDrop: {
        type: Boolean,
        label: 'Left sidebar allows thumbnail drag and drop. If false, images will be loaded on single click.',
        defaultValue: true
    },
    displaySetNavigationLoopOverSeries: {
        type: Boolean,
        label: 'The UP/DOWN display set navigation buttons will start over when reach the last display set in viewport?',
        defaultValue: true
    },
    displaySetNavigationMultipleViewports: {
        type: Boolean,
        label: 'The UP/DOWN display set navigation buttons will iterate over all the viewports at once?',
        defaultValue: false
    },
    displayEchoUltrasoundWorkflow: {
        type: Boolean,
        label: 'Enable cine dialog enhancements for multiframe images.',
        defaultValue: false
    },
    autoPositionMeasurementsTextCallOuts: {
        type: String,
        label: 'Auto position text call-outs for measurements when creating them.',
        defaultValue: 'TRBL'
    },
    studyListDateFilterNumDays: {
        type: Number,
        label: 'Number of days to be used on Study List date filter',
        min: 1
    },
    showStackLoadingProgressBar: {
        type: Boolean,
        label: 'Show a progress bar closest to the thumbnail showing how much the stack has loaded',
        defaultValue: true
    },
    cornerstoneRenderer: {
        type: String,
        label: 'Cornerstone default image renderer',
        defaultValue: 'webgl'
    },
    sortSeriesByIncomingOrder: {
        type: Boolean,
        label: 'Define if the series\' images shall be sorted by incoming order. Sort by Instance Number by default.',
        defaultValue: false
    },
    useMiddleSeriesInstanceAsThumbnail: {
        type: Boolean,
        label: 'Define if the middle instance of a series will be used as thumbnail. If not, the first instance will be used.',
        defaultValue: true
    }
});

export const PrefetchSchema = new SimpleSchema({
    order: {
        type: String,
        label: 'Prefetch Order',
        allowedValues: ['topdown', 'downward', 'closest'],
        optional: false
    },
    displaySetCount: {
        type: Number,
        label: 'Display Set Count',
        min: 1,
        defaultValue: 1
    }
});

export const MouseButtonToolSchema = new SimpleSchema({
    left: {
        type: String,
        label: 'Left Mouse Button',
        allowedValues: availableMouseButtonTools,
        optional: true
    },
    right: {
        type: String,
        label: 'Right Mouse Button',
        allowedValues: availableMouseButtonTools,
        optional: true
    },
    middle: {
        type: String,
        label: 'Middle Mouse Button',
        allowedValues: availableMouseButtonTools,
        optional: true
    }
});

export const PublicServerConfig = new SimpleSchema({
    verifyEmail: {
        type: Boolean,
        label: 'Verify Email',
        defaultValue: false
    },
    demoUserEnabled: {
        type: Boolean,
        label: 'Creates demo user on startup and show TestDrive button',
        defaultValue: true
    },
    userAuthenticationRoutesEnabled: {
        type: Boolean,
        label: 'Enables routing to /login page.',
        defaultValue: false,
    },
    ui: {
        type: UISettings,
        label: 'UI Settings'
    },
    prefetch: {
        type: PrefetchSchema,
        label: 'Prefetch settings'
    },
    defaultMouseButtonTools: {
        type: MouseButtonToolSchema,
        label: 'Default Mouse Button Tools'
    }
});

export const Servers = new SimpleSchema({
    dicomWeb: {
        type: [DICOMWebServer],
        label: 'DICOMWeb Servers',
        optional: true
    },
    dimse: {
        type: [DIMSEServer],
        label: 'DIMSE Servers',
        optional: true
    }
});

export const ServerConfiguration = new SimpleSchema({
    servers: {
        type: Servers,
        label: 'Servers'
    },
    defaultServiceType: {
        type: String,
        label: 'Default Service Type',
        defaultValue: 'dicomWeb'
    },
    dropCollections: {
        type: Boolean,
        label: 'Drop database collections',
        defaultValue: false
    },
    public: {
        type: PublicServerConfig,
        label: 'Public Server Configuration',
    },
    origin: {
        type: String,
        label: 'Origin',
        optional: true
    }
});
