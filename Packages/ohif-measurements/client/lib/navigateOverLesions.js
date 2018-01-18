import { OHIF } from 'meteor/ohif:core';

/**
 * Method to go select the next or previous lesion on measurements table
 *
 * @param {Boolean} isNextLesion Determine if it will navigate to the next or previous lesion
 */
OHIF.measurements.navigateOverLesions = isNextLesion => {
    const $table = $('#measurementTableContainer');
    if (!$table.length) return;

    const $lesions = $table.find('.measurementTableRow');
    if (!$lesions.length) return;

    const $activeLesion = $lesions.filter('.active');
    const activeIndex = $lesions.index($activeLesion);

    const step = isNextLesion ? 1 : -1;
    let newIndex = 0;
    if (activeIndex !== -1) {
        newIndex = activeIndex + step;
        if (newIndex >= $lesions.length) {
            newIndex = 0;
        } else if (newIndex < 0) {
            newIndex = $lesions.length - 1;
        }
    }

    $lesions.eq(newIndex).find('.measurementRowSidebar').trigger('click');
};
