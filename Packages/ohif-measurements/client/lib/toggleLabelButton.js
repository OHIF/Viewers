import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

OHIF.measurements.toggleLabelButton = options => {
    const removeButtonView = () => {
        if (!options.instance.buttonView) {
            return;
        }

        Blaze.remove(options.instance.buttonView);
        options.instance.buttonView = null;
    };

    if (options.instance.buttonView) {
        removeButtonView();
    }

    const measurementApi = options.measurementApi;
    const toolCollection = measurementApi.tools[options.toolType];
    const measurement = toolCollection.findOne(options.measurementId);

    const data = {
        measurement,
        position: options.position,
        direction: options.direction,
        threeColumns: true,
        hideCommon: true,
        autoClick: options.autoClick,
        doneCallback: removeButtonView,
        updateCallback(location, description) {
            const groupId = measurementApi.toolsGroupsMap[measurement.toolType];
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
        }
    };
    const view = Blaze.renderWithData(Template.measureFlow, data, options.element);
    options.instance.buttonView = view;
};
