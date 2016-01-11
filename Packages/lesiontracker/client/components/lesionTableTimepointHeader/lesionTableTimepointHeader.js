Template.lesionTableTimepointHeader.events({
    'click th.lesionTableTimepointCell': function(e, template) {
        var parentPosition = getPosition(e.currentTarget);
        var cellText = e.currentTarget.innerText;

        // Remove spaces in string
        cellText = cellText.replace(/\s/g, ''); // Remove spaces
        cellText = cellText.replace('<', ''); // Remove <
        var splitCellText = cellText.split('/');
        var dateStr = splitCellText[2].replace(/\D/g,'') + '' + splitCellText[0].replace(/\D/g,'') + '' + splitCellText[1].replace(/\D/g,''); // Remove non-digit chars

        // Check patient has a timepointText as Baseline
        var patientId = template.data.patientId;

        // Open popup
        var timepointTextDialog = $('#timepointTextDialog');
        var dialogDisplay = timepointTextDialog.css('display');
        if (dialogDisplay === 'none') {
            var isBaselineInCollection = Timepoints.findOne({
                patientId: patientId,
                timepointName: dateStr,
                timepointText: 'Baseline'
            });

            // If isBaselineInCollection is true, "Baseline" is found in collection for patient and set checkbox as checked
            if (isBaselineInCollection) {
                // Set checkbox as checked
                $('#checkBoxBaseline').prop('checked', true);
            } else {
                // Set checkbox as unchecked
                $('#checkBoxBaseline').prop('checked', false);
            }

            // Open dialog
            var dialogProperty = {
                top: parentPosition.y - 30,
                left: parentPosition.x,
                display: 'block'
            };

            timepointTextDialog.css(dialogProperty);
        } else {
            // Get timepoints of patient
            // Set timepointText as Baseline for selected timepoint
            var timepoints = Timepoints.find({
                patientId: patientId
            }).fetch();

            // Check checkbox is selected
            var checkboxBaselineChecked = $('#checkBoxBaseline').is(':checked');

            timepoints.forEach(function(timepoint) {
                // timepointText defines a custom text for timepoint such as Baseline, Nadir, Current
                if (timepoint.timepointName === dateStr) {
                    // If checkbox is selected, set timepointText as Baseline
                    // Else set timepointText as ""
                    var timepointText = 'Baseline';
                    if (!checkboxBaselineChecked) {
                        timepointText = '';
                    }

                    Timepoints.update(timepoint._id,{
                        $set: {
                            timepointText: timepointText
                        }
                    });
                } else {
                    // Set timepointText as empty
                    Timepoints.update(timepoint._id,{
                        $set: {
                            timepointText: ''
                        }
                    });
                }
            });

            // Close dialog
            timepointTextDialog.css('display', 'none');
        }
    }
});

Template.lesionTableTimepointHeader.helpers({
    timepointTextFound: function() {
        var timepointText = this.timepointText;
        return (timepointText && timepointText === 'Baseline');
    }
});

// Gets parent's position of element which mouse pointer is clicked in
function getPosition(element) {
    var xPosition = 0;
    var yPosition = 0;

    while (element) {
        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
    }

    return {
        x: xPosition,
        y: yPosition
    };
}
