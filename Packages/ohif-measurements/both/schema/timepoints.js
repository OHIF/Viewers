import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const schema = new SimpleSchema({
    patientId: {
        type: String,
        label: 'Patient ID',
        optional: true
    },
    timepointId: {
        type: String,
        label: 'Timepoint ID'
    },
    timepointType: {
        type: String,
        label: 'Timepoint Type',
        allowedValues: ['baseline', 'followup'],
        defaultValue: 'baseline',
    },
    isLocked: {
        type: Boolean,
        label: 'Timepoint Locked'
    },
    studyInstanceUids: {
        type: [String],
        label: 'Study Instance Uids',
        defaultValue: []
    },
    earliestDate: {
        type: Date,
        label: 'Earliest Study Date from associated studies',
    },
    latestDate: {
        type: Date,
        label: 'Most recent Study Date from associated studies',
    },
    visitNumber: {
        type: Number,
        label: 'Number of patient\'s visit',
        optional: true
    },
    studiesData: {
        type: [Object],
        label: 'Studies data to allow lazy loading',
        optional: true,
        blackbox: true
    }
});
