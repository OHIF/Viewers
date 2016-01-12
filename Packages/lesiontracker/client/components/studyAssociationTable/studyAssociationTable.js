function autoSelectStudies() {
    return [];
}

Template.studyAssociationTable.helpers({
    /**
     * This helpers includes the user-selected and autoselected studies
     * to be associated.
     *
     * @returns {Array.<T>}
     */
    relevantStudies: function() {
        var userSelectedStudies = WorklistSelectedStudies.find().fetch() || [];
        var autoselected = autoSelectStudies(userSelectedStudies);
        return userSelectedStudies.concat(autoselected);
    },
    /**
     * This helper returns the list of Timepoint types the user can set for this study
     *
     * @returns {Array.<T>}
     */
    timepointOptions: function() {
        return [
            {
                value: 'baseline',
                name: 'Baseline'
            },
            {
                value: 'followup',
                name: 'Follow-up'
            }
        ];
    }
});

//trial criteria!