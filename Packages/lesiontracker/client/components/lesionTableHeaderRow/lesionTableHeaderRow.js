import { MeasurementApi } from 'meteor/lesiontracker/client/api/measurement';

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

    // Get the current timepoint
    const current = instance.data.timepointApi.current();

    // Stop here if no timepoint was found
    if (!current) {
        return;
    }

    const timepointType = current.timepointType;

    if (!instance.data.currentTimepointId) {
        console.warn('Case has no timepointId');
        return;
    }

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
    type() {
        // Give the header a proper name
        const id = Template.instance().data.id;
        return namesById[id];
    },

    numberOfLesions() {
        return Template.instance().data.measurements.length;
    },

    maxNumLesions() {
        return Template.instance().maxNumLesions.get();
    },

    anyUnmarkedLesionsLeft() {
        const id = Template.instance().data.id;
        if (id === 'target') {
            return MeasurementApi.unmarkedTargets().length;
        } else if (id === 'nonTarget') {
            return MeasurementApi.unmarkedNonTargets().length;
        }

        // Keep the 'Add' button for the New Lesions header row
        return true;
    }
});

Template.lesionTableHeaderRow.events({
    'click .js-setTool'(event, instance) {
        const id = instance.data.id;
        const toolType = toolTypesById[id];
        toolManager.setActiveTool(toolType);
    }
});
