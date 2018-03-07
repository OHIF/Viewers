import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

OHIF.measurements.toggleLabelButton = options => {
    let { toolType } = options.measurement;
    const { tool } = OHIF.measurements.getToolConfiguration(toolType);

    if (!tool) return;

    toolType = (tool && tool.parentTool) || toolType;

    const measurementId = options.measurement._id;
    let buttonView = null;

    const removeButtonView = () => {
        if (!buttonView) {
            return;
        }

        Blaze.remove(buttonView);
        buttonView = null;
    };

    if (buttonView) {
        removeButtonView();
    }

    const measurementApi = options.measurementApi;
    const toolCollection = measurementApi.tools[toolType];
    const measurement = toolCollection.findOne(measurementId);

    const data = {
        measurement,
        position: options.position,
        direction: options.direction,
        threeColumns: true,
        hideCommon: true,
        autoClick: options.autoClick,
        doneCallback: removeButtonView,
        updateCallback(location, description) {
            const groupId = measurementApi.toolsGroupsMap[toolType];
            const config = OHIF.measurements.MeasurementApi.getConfiguration();
            const group = _.findWhere(config.measurementTools, { id: groupId });
            group.childTools.forEach(tool => {
                measurementApi.tools[tool.id].update({
                    measurementNumber: measurement.measurementNumber,
                    patientId: measurement.patientId
                }, {
                    $set: {
                        location,
                        description
                    }
                }, {
                    multi: true
                });
            });
            options.measurement.location = location;
            options.measurement.description = description;

            // Notify that viewer suffered changes
            OHIF.measurements.triggerTimepointUnsavedChanges('relabel');
        }
    };
    buttonView = Blaze.renderWithData(Template.measureFlow, data, document.body);
};
