Template.measurementsReport.onRendered(() => {
    const instance = Template.instance();
    const data = Template.currentData();
    const onRendered = data.onRendered;

    if (onRendered) {
        onRendered(instance);
    }
});

Template.measurementsReport.helpers({
    getCanvasData(canvas) {

    }
});
