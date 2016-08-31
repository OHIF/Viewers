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

export const DICOMWebRequestOptions = new SimpleSchema({
    auth: {
        type: String,
        label: 'Authentication',
        optional: true
    },
    logRequests: {
        type: Boolean,
        defaultValue: true,
        label: 'Requests',
    },
    logResponses: {
        type: Boolean,
        defaultValue: false,
        label: 'Responses',
    },
    logTiming: {
        type: Boolean,
        defaultValue: true,
        label: 'Timing',
    },
});

export const DICOMWebServer = new SimpleSchema({
    name: serverNameDefinitions,
    type: serverTypeDefinitions,
    wadoUriRoot: {
        type: String,
        label: 'WADO URI root',
        max: 1000
    },
    // TODO: Remove this
    wadoUriRootNOTE: {
        type: String,
        label: 'WADO URI root note',
        optional: true
    },
    wadoRoot: {
        type: String,
        label: 'WADO root',
        max: 1000
    },
    imageRendering: {
        type: String,
        label: 'Image rendering',
        allowedValues: ['wadouri', 'orthanc'],
        valuesLabels: ['WADO URI', 'ORTHANC']
    },
    qidoRoot: {
        type: String,
        label: 'QIDO root',
        max: 1000
    },
    qidoSupportsIncludeField: {
        type: Boolean,
        label: 'QIDO supports including fields',
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
        label: 'AE Title',
    },
    hostAE: {
        type: String,
        label: 'AE Host',
        optional: true
    },
    host: {
        type: String,
        label: 'Host Domain/IP',
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
        label: 'Supports instance retrieval by StudyUid?',
        defaultValue: true
    }
});

export const DIMSEServer = new SimpleSchema({
    name: serverNameDefinitions,
    type: serverTypeDefinitions,
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
