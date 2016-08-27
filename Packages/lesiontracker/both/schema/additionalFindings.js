import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const schema = new SimpleSchema({
    measurableDisease: {
        type: String,
        label: 'Measurable disease',
        allowedValues: ['Present', 'Absent'],
        defaultValue: 'Absent',
        optional: true
    },
    // TODO: Add check so that the value cannot be None & something other region
    regionsOfMetastaticDisease: {
        type: [String],
        label: 'Regions of metastatic disease',
        allowedValues: ['None', 'Lymph Node'],
        defaultValue: ['None'],
        optional: true
    },
    tracerRelatedToMetastaticDisease: {
        type: String,
        label: 'Tracer related to metastatic disease?',
        allowedValues: ['Yes', 'No'],
        defaultValue: 'Yes',
        optional: true
    },
    numberOfBoneLesions: {
        type: String,
        label: 'Number of bone lesions',
        allowedValues: ['0', '1-2', '2-4', '>5'],
        defaultValue: '0',
        optional: true
    },
    acceptableImageQuality: {
        type: String,
        label: 'Acceptable image quality',
        allowedValues: ['Yes', 'No'],
        defaultValue: 'Yes',
        optional: true
    },
    adequateAnatomicalCoverage: {
        type: String,
        label: 'Adequate anatomical coverage',
        allowedValues: ['Yes', 'No'],
        defaultValue: 'Yes',
        optional: true
    },
    presenceOfContrast: {
        type: String,
        label: 'Presence of contrast',
        allowedValues: ['Yes', 'No'],
        defaultValue: 'Yes',
        optional: true
    }
});
