export const DICOMWebRequestOptions = new SimpleSchema({
    auth: {
        type: String,
        label: 'Username:Password Authentication String',
        optional: true
    },
    logRequests: {
        type: Boolean,
        defaultValue: true,
        label: 'Log Requests?',
    },
    logResponses: {
        type: Boolean,
        defaultValue: false,
        label: 'Log Responses?',
    },
    logTiming: {
        type: Boolean,
        defaultValue: true,
        label: 'Log Timing?',
    },
});

export const DICOMWebServer = new SimpleSchema({
    name: {
        type: String,
        label: 'Name',
        max: 100
    },
    wadoUriRoot: {
        type: String,
        label: 'WADO URI Root',
        max: 1000
    },
    qidoRoot: {
        type: String,
        label: 'QIDO Root',
        max: 1000
    },
    // TODO: Remove this
    wadoUriRootNOTE: {
        type: String,
        label: 'WADO URI Root Note',
        optional: true
    },
    wadoRoot: {
        type: String,
        label: 'WADO Root',
        max: 1000
    },
    qidoSupportsIncludeField: {
        type: Boolean,
        label: 'QIDO Supports Include Field?',
        defaultValue: false
    },
    imageRendering: {
        type: String,
        label: 'Image Rendering',
        defaultValue: 'wadouri'
    },
    requestOptions: {
        type: DICOMWebRequestOptions,
        label: 'Request Options'
    }
});

export const DIMSEPeer = new SimpleSchema({
    host: {
        type: String,
        label: 'Host URL',
    },
    port: {
        type: Number,
        label: 'Port',
        min: 1,
        defaultValue: 11112,
        max: 65535
    },
    aeTitle: {
        type: String,
        label: 'Application Entity (AE) Title',
    },
    default: {
        type: Boolean,
        label: 'Default?',
        defaultValue: false
    },
    server: {
        type: Boolean,
        label: 'Server?',
        defaultValue: false
    },
    supportsInstanceRetrievalByStudyUid: {
        type: Boolean,
        label: 'Supports instance retrieval by StudyUid?',
        defaultValue: true
    }
});

export const DIMSEServer = new SimpleSchema({
    name: {
        type: String,
        label: 'Name',
        max: 100
    },
    peers: {
        type: [ DIMSEPeer ],
        label: 'DIMSE Peers',
    }
});

export const UISettings = new SimpleSchema({
    studyListFunctionsEnabled: {
        type: Boolean,
        label: 'Study List Functions Enabled?',
        defaultValue: true
    }
});

export const PublicServerConfig = new SimpleSchema({
    verifyEmail: {
        type: Boolean,
        label: 'Verify Email',
        defaultValue: false
    },
    ui: {
        type: UISettings,
        label: 'UI Settings'
    }
});

export const Servers = new SimpleSchema({
    dicomWeb: {
        type: [ DICOMWebServer ],
        label: 'DICOMWeb Servers',
        optional: true
    },
    dimse: {
        type: [ DIMSEServer ],
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
    public: {
        type: PublicServerConfig,
        label: 'Public Server Configuration',
    }
});
