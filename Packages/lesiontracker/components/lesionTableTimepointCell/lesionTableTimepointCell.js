Template.lesionTableTimepointCell.helpers({
    'longestDiameter': function() {
        // Search Measurements by lesion and timepoint
        var lesionData = Template.parentData(1);
        return lesionData.timepoints[this.timepointID].longestDiameter;
    }
});