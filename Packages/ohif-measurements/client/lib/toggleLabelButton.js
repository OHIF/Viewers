import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { OHIF } from 'meteor/ohif:core';

OHIF.measurements.toggleLabelButton = options => {
    const removeButtonView = () => {
        Blaze.remove(options.instance.buttonView);
        options.instance.buttonView = null;
    };

    if (options.instance.buttonView) {
        removeButtonView();
    } else {
        const data = {
            position: options.position,
            threeColumns: true,
            hideCommon: true,
            doneCallback(data) {
                console.warn('>>>>DONE CALLBACK', data);
                removeButtonView();
            }
        };
        const view = Blaze.renderWithData(Template.measureFlow, data, options.instance.element);
        options.instance.buttonView = view;
    }
};
