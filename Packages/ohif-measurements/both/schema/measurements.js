import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const Measurement = new SimpleSchema({
    userId: {
        type: String,
        label: "User ID"
    },
    patientId: {
        type: String,
        label: "Patient ID"
    },
    measurementNumber: {
        type: Number,
        label: "Measurement Number",
        optional: true
    },
    measurementNumberOverall: {
        type: Number,
        label: "Measurement Number Overall",
        optional: true
    },
    timepointId: {
        type: String,
        label: "Timepoint ID",
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
                return {
                    $setOnInsert: new Date()
                };
            } else {
                this.unset(); // Prevent user from supplying their own value
            }
        }
    },
    // Force value to be current date (on server) upon update
    // and don't allow it to be set upon insert.
    updatedAt: {
        type: Date,
        autoValue: function() {
            if (this.isUpdate) {
                return new Date();
            }
        },
        // denyInsert: true, // Commenting this out for now since we are constantly re-adding entries to client-side collections
        optional: true
    },
})

const StudyLevelMeasurement = new SimpleSchema([Measurement, {
    studyInstanceUid: {
        type: String,
        label: 'Study Instance UID'
    }
}]);

const SeriesLevelMeasurement = new SimpleSchema([StudyLevelMeasurement, {
    seriesInstanceUid: {
        type: String,
        label: 'Series Instance UID'
    }
}]);

const InstanceLevelMeasurement = new SimpleSchema([StudyLevelMeasurement, SeriesLevelMeasurement, {
    sopInstanceUid: {
        type: String,
        label: 'SOP Instance UID'
    }
}]);

const FrameLevelMeasurement = new SimpleSchema([StudyLevelMeasurement, SeriesLevelMeasurement, InstanceLevelMeasurement, {
    frameIndex: {
        type: Number,
        min: 0,
        label: 'Frame index in Instance'
    },
    // TODO: In the future we should remove this in favour of searching ViewerStudies and display sets when
    // re-displaying measurements. Otherwise if a study moves servers the measurements will not be displayed correctly
    imageId: {
        type: String,
        label: 'Cornerstone Image Id'
    }
}]);

const CornerstoneToolMeasurement = new SimpleSchema([StudyLevelMeasurement,
                                                            SeriesLevelMeasurement,
                                                            InstanceLevelMeasurement,
                                                            FrameLevelMeasurement, {
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
}]);

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
        defaultValue: false
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
    index: { // TODO: Remove 'index' from bidirectionalTool since it's useless
        type: Number,
        optional: true
    },
    locked: {
        type: Boolean,
        label: 'Locked',
        optional: true,
        defaultValue: false
    }, 
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