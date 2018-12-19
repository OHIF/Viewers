import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

OHIF.lesiontracker.removeMeasurementIfInvalid = (measurementData, eventData) => {
    const handles = measurementData.handles;
    const start = _.pick(handles.start, ['x', 'y']);
    const end = _.pick(handles.end, ['x', 'y']);
    const element = eventData.element;
    const toolName = measurementData.toolName;
    if (_.isEqual(start, end)) {
        cornerstoneTools.removeToolState(element, toolName, measurementData);
        return true;
    }

    return false;
};
