Template.radialProgressBar.helpers({
    progressComplete() {
        const instance = Template.instance();
        return instance.data.progressPercent === 100;
    },

    progressRadius() {
        var radius = 13 * 2 * Math.PI;
        const instance = Template.instance();
        var percentLeft = (100 - instance.data.progressPercent) / 100;
        return percentLeft * radius;
    }
});
