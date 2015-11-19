Template.lesionTableTimepointCell.helpers({
    'longestDiameter': function() {
        // Search Measurements by lesion and timepoint
        var lesionData = Template.parentData(1);
        if (!lesionData ||
            !lesionData.timepoints ||
            !lesionData.timepoints[this.timepointID]) {
            return;
        }

        return lesionData.timepoints[this.timepointID].longestDiameter;
    }
});