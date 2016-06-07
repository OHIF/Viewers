var yesNoOptions = [{
    key: 'yes',
    text: 'Yes'
}, {
    key: 'no',
    text: 'No'
}];

Template.additionalMeasurements.onCreated(function additionalMeasurementsOnCreated() {
    const instance = this;

    instance.measurableDisease = new ReactiveVar();
    instance.numberOfBoneLesions = new ReactiveVar();
    instance.regionsOfMetastaticDisease = new ReactiveVar();
    instance.tracerRelatedToMetastaticDisease = new ReactiveVar();
    instance.acceptableImageQuality = new ReactiveVar();
    instance.adequateAnatomicalCoverage = new ReactiveVar();
    instance.presenceOfContrast = new ReactiveVar();
    instance.phaseOfContrast = new ReactiveVar();

    instance.measurableDisease.set('absent');
    instance.tracerRelatedToMetastaticDisease.set('no');
    instance.acceptableImageQuality.set('yes');
    instance.adequateAnatomicalCoverage.set('yes');
    instance.presenceOfContrast.set('yes');
});

Template.additionalMeasurements.onRendered(function additionalMeasurementsOnRendered() {
    const instance = this;

    instance.$("#regionsOfMetastaticDisease").select2({
        multiple: true
    });
});

Template.additionalMeasurements.helpers({
    measurableDiseaseButtonData() {
        const instance = Template.instance();
        return {
            text: 'Measurable disease',
            value: instance.measurableDisease,
            options: [{
                key: 'present',
                text: 'Present'
            }, {
                key: 'absent',
                text: 'Absent'
            }]
        };
    },

    metastaticDiseaseButtonData() {
        const instance = Template.instance();
        return {
            text: 'Tracer related to metastatic disease',
            value: instance.tracerRelatedToMetastaticDisease,
            options: yesNoOptions
        };
    },

    imageQualityButtonData() {
        const instance = Template.instance();
        return {
            text: 'Acceptable image quality',
            value: instance.acceptableImageQuality,
            options: yesNoOptions
        };
    },

    anatomicalCoverageButtonData() {
        const instance = Template.instance();
        return {
            text: 'Adequate anatomical coverage',
            value: instance.adequateAnatomicalCoverage,
            options: yesNoOptions
        };
    },

    presenceOfContrastButtonData() {
        const instance = Template.instance();
        return {
            text: 'Presence of contrast',
            value: instance.presenceOfContrast,
            options: yesNoOptions
        };
    }
});
