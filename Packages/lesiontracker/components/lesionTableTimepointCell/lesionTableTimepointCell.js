Template.lesionTableTimepointCell.helpers({
    'longestDiameter': function() {
        var longestDiameter = this[Object.keys(this)[0]].longestDiameter;
        return longestDiameter;
    }
});