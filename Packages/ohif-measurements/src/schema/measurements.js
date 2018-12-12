import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const Measurement = new SimpleSchema({
    additionalData: {
        type: Object,
        label: 'Additional Data',
        defaultValue: {},
        optional: true,
        blackbox: true
    },
    userId: {
        type: String,
        label: 'User ID',
        optional: true
    },
    patientId: {
        type: String,
        label: 'Patient ID',
        optional: true
    },
    measurementNumber: {
        type: Number,
        label: 'Measurement Number',
        optional: true
    },
    timepointId: {
        type: String,
        label: 'Timepoint ID',
        optional: true
    },
    // Force value to be current date (on server) upon insert
    // and prevent updates thereafter.
    createdAt: {
        type: Date,
        autoValue: function() {
            if (this.isInsert) {
                return new Date();
            } else if (this.isUpsert) {
                return { $setOnInsert: new Date() };
            } else {
                // [PWV-184] Preventing unset due to child tools updating
                // this.unset(); // Prevent user from supplying their own value
            }
        }
    },
    // Force value to be current date (on server) upon update
    updatedAt: {
        type: Date,
        autoValue: function() {
            if (this.isUpdate) {
                // return new Date();
            }
        },
        optional: true
    }
});

const StudyLevelMeasurement = new SimpleSchema([
    Measurement,
    {
        studyInstanceUid: {
            type: String,
            label: 'Study Instance UID'
        }
    }
]);

const SeriesLevelMeasurement = new SimpleSchema([
    StudyLevelMeasurement,
    {
        seriesInstanceUid: {
            type: String,
            label: 'Series Instance UID'
        }
    }
]);

const CornerstoneVOI = new SimpleSchema({
    windowWidth: {
        type: Number,
        label: 'Window Width',
        decimal: true,
        optional: true
    },
    windowCenter: {
        type: Number,
        label: 'Window Center',
        decimal: true,
        optional: true
    },
});

const CornerstoneViewportTranslation = new SimpleSchema({
    x: {
        type: Number,
        label: 'X',
        decimal: true,
        optional: true
    },
    y: {
        type: Number,
        label: 'Y',
        decimal: true,
        optional: true
    },
});

const CornerstoneViewport = new SimpleSchema({
    scale: {
        type: Number,
        label: 'Scale',
        decimal: true,
        optional: true
    },
    translation: {
        type: CornerstoneViewportTranslation,
        label: 'Translation',
        optional: true
    },
    voi: {
        type: CornerstoneVOI,
        label: 'VOI',
        optional: true
    },
    invert: {
        type: Boolean,
        label: 'Invert',
        optional: true
    },
    pixelReplication: {
        type: Boolean,
        label: 'Pixel Replication',
        optional: true
    },
    hFlip: {
        type: Boolean,
        label: 'Horizontal Flip',
        optional: true
    },
    vFlip: {
        type: Boolean,
        label: 'Vertical Flip',
        optional: true
    },
    rotation: {
        type: Number,
        label: 'Rotation (degrees)',
        decimal: true,
        optional: true
    }
});

const InstanceLevelMeasurement = new SimpleSchema([
    StudyLevelMeasurement,
    SeriesLevelMeasurement,
    {
        sopInstanceUid: {
            type: String,
            label: 'SOP Instance UID'
        },
        viewport: {
            type: CornerstoneViewport,
            label: 'Viewport Parameters',
            optional: true
        }
    }
]);

const FrameLevelMeasurement = new SimpleSchema([
    StudyLevelMeasurement,
    SeriesLevelMeasurement,
    InstanceLevelMeasurement,
    {
        frameIndex: {
            type: Number,
            min: 0,
            label: 'Frame index in Instance'
        },
        imagePath: {
            type: String,
            label: 'Identifier for the measurement\'s image' // studyInstanceUid_seriesInstanceUid_sopInstanceUid_frameIndex
        }
    }
]);

const CornerstoneToolMeasurement = new SimpleSchema([
    StudyLevelMeasurement,
    SeriesLevelMeasurement,
    InstanceLevelMeasurement,
    FrameLevelMeasurement,
    {
        toolType: {
            type: String,
            label: 'Cornerstone Tool Type',
            optional: true
        },
        visible: {
            type: Boolean,
            label: 'Visible',
            defaultValue: true
        },
        active: {
            type: Boolean,
            label: 'Active',
            defaultValue: false
        },
        invalidated: {
            type: Boolean,
            label: 'Invalidated',
            defaultValue: false,
            optional: true
        }
    }
]);

const CornerstoneHandleBoundingBoxSchema = new SimpleSchema({
    width: {
        type: Number,
        label: 'Width',
        decimal: true
    },
    height: {
        type: Number,
        label: 'Height',
        decimal: true
    },
    left: {
        type: Number,
        label: 'Left',
        decimal: true
    },
    top: {
        type: Number,
        label: 'Top',
        decimal: true
    }
});

const CornerstoneHandleSchema = new SimpleSchema({
    x: {
        type: Number,
        label: 'X',
        decimal: true,
        optional: true // Not actually optional, but sometimes values like x/y position are missing
    },
    y: {
        type: Number,
        label: 'Y',
        decimal: true,
        optional: true // Not actually optional, but sometimes values like x/y position are missing
    },
    highlight: {
        type: Boolean,
        label: 'Highlight',
        defaultValue: false
    },
    active: {
        type: Boolean,
        label: 'Active',
        defaultValue: false,
        optional: true
    },
    drawnIndependently: {
        type: Boolean,
        label: 'Drawn Independently',
        defaultValue: false,
        optional: true
    },
    movesIndependently: {
        type: Boolean,
        label: 'Moves Independently',
        defaultValue: false,
        optional: true
    },
    allowedOutsideImage: {
        type: Boolean,
        label: 'Allowed Outside Image',
        defaultValue: false,
        optional: true
    },
    hasMoved: {
        type: Boolean,
        label: 'Has Already Moved',
        defaultValue: false,
        optional: true
    },
    hasBoundingBox: {
        type: Boolean,
        label: 'Has Bounding Box',
        defaultValue: false,
        optional: true
    },
    boundingBox: {
        type: CornerstoneHandleBoundingBoxSchema,
        label: 'Bounding Box',
        optional: true
    },
    index: { // TODO: Remove 'index' from bidirectionalTool since it's useless
        type: Number,
        optional: true
    },
    locked: {
        type: Boolean,
        label: 'Locked',
        optional: true,
        defaultValue: false
    }
});

export const MeasurementSchemaTypes = {
    Measurement: Measurement,
    StudyLevelMeasurement: StudyLevelMeasurement,
    SeriesLevelMeasurement: SeriesLevelMeasurement,
    InstanceLevelMeasurement: InstanceLevelMeasurement,
    FrameLevelMeasurement: FrameLevelMeasurement,
    CornerstoneToolMeasurement: CornerstoneToolMeasurement,
    CornerstoneHandleSchema: CornerstoneHandleSchema
};
