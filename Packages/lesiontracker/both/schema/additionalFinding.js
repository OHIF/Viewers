import { SimpleSchema } from 'meteor/aldeed:simple-schema';

SimpleSchema.extendOptions({
    allowedSelect2Values: Match.Optional(Array),
});

export const AdditionalFinding = new SimpleSchema({
    measurableDisease: {
        type: String,
        label: 'Measurable Disease',
        allowedValues: ['Present', 'Absent'],
        defaultValue: 'Absent',
        optional: true
    },
    // TODO: Add check so that the value cannot be None & something other region
    regionsOfMetastaticDisease: {
        type: [String],
        label: 'Regions of Metastatic Disease',
        allowedSelect2Values: ['None', 'Lymph Node'], // allowedValues doesn't seem show up in the Schema since this is an Array. There may be a better way to do this
        defaultValue: ['None'],
        optional: true
    },
    tracerRelatedToMetastaticDisease: {
        type: String,
        label: 'Tracer Related to Metastatic Disease?',
        allowedValues: ['Yes', 'No'],
        defaultValue: 'Yes',
        optional: true
    },
    numberOfBoneLesions: {
        type: String,
        label: 'Number of Bone Lesions',
        allowedValues: ['0', '1-2', '2-4', '>5'],
        defaultValue: '0',
        optional: true
    },
    acceptableImageQuality: {
        type: String,
        label: 'Acceptable Image Quality',
        allowedValues: ['Yes', 'No'],
        defaultValue: 'Yes',
        optional: true
    },
    adequateAnatomicalCoverage: {
        type: String,
        label: 'Adequate Anatomical Coverage',
        allowedValues: ['Yes', 'No'],
        defaultValue: 'Yes',
        optional: true
    },
    presenceOfContrast: {
        type: String,
        label: 'Presence of Contrast',
        allowedValues: ['Yes', 'No'],
        defaultValue: 'Yes',
        optional: true
    }
});
