Template.measurementTableHUD.onCreated(() => {
    const instance = Template.instance();

    if (instance.data.timepointApi) {
        instance.data.timepoints = new ReactiveVar(instance.data.timepointApi.currentAndPrior());    
    }
});

Template.measurementTableHUD.onRendered(() => {
    const instance = Template.instance();
    instance.$('#measurementTableHUD').resizable().draggable();
});

Template.measurementTableHUD.events({
    'click .buttonClose'(event, instance) {
        Session.set('measurementTableHudOpen', false);
    }
});

Template.measurementTableHUD.helpers({
    hudHidden() {
        return Session.get('measurementTableHudOpen') ? 'dialog-open' : 'dialog-closed';
    },
    toolbarButtons() {
        let buttonData = [];

        buttonData.push({
            id: 'bidirectional',
            title: 'Target',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-target'
        });

        buttonData.push({
            id: 'nonTarget',
            title: 'Non-Target',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-non-target'
        });

        buttonData.push({
            id: 'length',
            title: 'Temp',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-temp'
        });

        return buttonData;
    }
});
