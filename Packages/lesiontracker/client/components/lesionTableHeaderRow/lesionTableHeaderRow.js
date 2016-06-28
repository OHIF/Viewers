const toolTypesById = {
    target: 'bidirectional',
    nonTarget: 'nonTarget',
    newLesion: 'bidirectional'
};

const namesById = {
    target: 'Targets',
    nonTarget: 'Non-Targets',
    newLesion: 'New Lesions'
};

Template.lesionTableHeaderRow.onCreated(() => {
    const instance = Template.instance();
    instance.maxNumLesions = new ReactiveVar();

    if (!instance.data.currentTimepointId) {
        console.warn('Case has no timepointId');
        return;
    }

    // Give the header a proper name
    instance.data.type = namesById[instance.data.id];

    const currentTimepointId = instance.data.currentTimepointId;
    const timepoint = Timepoints.findOne({
        timepointId: currentTimepointId
    });

    const timepointType = timepoint.timepointType;

    // TODO: Check if we have criteria where maximum limits are applied to
    // Non-Targets and/or New Lesions
    if (timepointType === 'baseline' && instance.data.id === 'target') {
        instance.autorun(() => {
            // Identify which Trial Conformance Criteria are currently being used
            // Note that there may be more than one.
            const criteriaTypes = TrialCriteriaTypes.find({
                selected: true
            }).map(function(criteria) {
                return criteria.id;
            });

            const currentConstraints = getTrialCriteriaConstraints(criteriaTypes);
            if (!currentConstraints) {
                return;
            }

            // TODO: Fix Trial Conformance Criteria, it appears that totalNumberOfLesions
            // is applied to both Targets and Non-Targets, when it should typically only be
            // for Targets
            const criteria = currentConstraints[timepointType];
            const maxNumLesions = criteria.group.totalNumberOfLesions.numericality.lessThanOrEqualTo;
            instance.maxNumLesions.set(maxNumLesions);
        });
    }
});

Template.lesionTableHeaderRow.helpers({
    numberOfLesions: function() {
        const instance = Template.instance();
        return instance.data.measurements.count();
    },
    maxNumLesions: function() {
        return Template.instance().maxNumLesions.get();
    }
});

Template.lesionTableHeaderRow.events({
    'click .js-setTool': function(event, instance) {
        const id = instance.data.id;
        const toolType = toolTypesById[id];
        toolManager.setActiveTool(toolType);
    }
});
