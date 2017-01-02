import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const ToolGroupBaseSchema = new SimpleSchema({
    toolId: {
        type: String,
        label: 'Tool ID'
    },
    toolItemId: {
        type: String,
        label: 'Tool Item ID'
    },
    createdAt: {
        type: Date
    },
    studyInstanceUid: {
        type: String,
        label: 'Study Instance UID'
    },
    timepointId: {
        type: String,
        label: 'Timepoint ID'
    },
    measurementNumber: {
        type: Number,
        label: 'Measurement Number'
    }
});
