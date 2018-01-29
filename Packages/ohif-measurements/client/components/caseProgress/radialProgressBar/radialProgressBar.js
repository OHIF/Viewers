import { Template } from 'meteor/templating';

Template.radialProgressBar.helpers({
    progressComplete() {
        const instance = Template.instance();
        return instance.data.progressPercent === 100;
    },

    progressRadius() {
        const instance = Template.instance();
        const radius = 11 * 2 * Math.PI;
        const percentLeft = (100 - instance.data.progressPercent) / 100;
        return percentLeft * radius;
    }
});
