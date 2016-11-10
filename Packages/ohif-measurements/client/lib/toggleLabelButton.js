import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

const toolMap = {
    bidirectional: 'targets'
};

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

    const tool = toolMap[options.toolData.toolType];
    const toolCollection = options.measurementApi[tool];
    const measurement = toolCollection.findOne(options.toolData._id);

    const data = {
        measurement,
        position: options.position,
        threeColumns: true,
        hideCommon: true,
        doneCallback(location, description) {
            if (_.isFunction(options.callback)) {
                options.callback(options, location, description);
            }

            toolCollection.update({
                measurementNumber: measurement.measurementNumber,
                toolType: measurement.toolType,
                patientId: measurement.patientId
            }, {
                $set: {
                    location,
                    description
                }
            });

            removeButtonView();
        }
    };
    const view = Blaze.renderWithData(Template.measureFlow, data, options.element);
    options.instance.buttonView = view;
};
