import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const schema = new SimpleSchema({
    patientId: {
        type: String,
        label: 'Patient ID',
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
    }
});
