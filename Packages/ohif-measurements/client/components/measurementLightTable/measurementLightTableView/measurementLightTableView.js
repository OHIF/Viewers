import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'meteor/ohif:core';

Template.measurementLightTableView.onCreated(() => {
    const instance = Template.instance();
    const { measurementApi, timepointApi } = instance.data;

    instance.data.measurementGroups = new ReactiveVar();

    instance.autorun(() => {
        measurementApi.changeObserver.depend();
        const data = OHIF.measurements.getMeasurementsGroupedByNumber(measurementApi, timepointApi);
        instance.data.measurementGroups.set(data);
    });
});
