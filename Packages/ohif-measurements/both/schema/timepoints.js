import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const StudiesData = new SimpleSchema({
    studyInstanceUid: {
        type: String,
        label: 'Study Instance Uid'
    },
    description: {
        type: String,
        label: 'Study Description',
        optional: true
    },
    date: {
        type: Date,
        label: 'Study Date'
    },
    modality: {
        type: String,
        label: 'Study Modality'
    },
    loaded: {
        type: Boolean,
        label: 'Defines if the Study is already loaded',
        optional: true,
        defaultValue: false
    }
});

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
        type: [StudiesData],
        label: 'Studies minimal data to allow lazy loading',
        optional: true
    }
});
