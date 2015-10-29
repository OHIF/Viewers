Template.lesionTableRow.helpers({
    'timepoints': function() {
        var array = [];
        var timepoints = this.lesionData.timepoints;
        Object.keys(timepoints).forEach(function(key) {
            array.push(timepoints[key]);
        });
        return array;
    }
});
