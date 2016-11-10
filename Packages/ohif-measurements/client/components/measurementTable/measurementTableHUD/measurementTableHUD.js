Template.measurementTableHUD.onCreated(() => {
    const instance = Template.instance();

    instance.isRemoved = true;
    if (instance.data.timepointApi) {
        instance.data.timepoints = new ReactiveVar(instance.data.timepointApi.currentAndPrior());    
    }
});

Template.measurementTableHUD.onDestroyed(() => {
    const instance = Template.instance();

    instance.isRemoved = true;
    Session.set('measurementTableHudOpen', false);
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
        let instance = Template.instance(),
            isOpen = Session.get('measurementTableHudOpen');

        if (isOpen) {
            instance.isRemoved = false;
            return 'dialog-animated dialog-open';
        }

        return instance.isRemoved !== true ? 'dialog-animated dialog-closed' : 'hidden';
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
