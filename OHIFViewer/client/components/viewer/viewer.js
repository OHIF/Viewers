import { OHIF } from 'meteor/ohif:core';
OHIF.viewer = OHIF.viewer || {};

Session.setDefault('activeViewport', false);
Session.setDefault('leftSidebar', false);
Session.setDefault('rightSidebar', false);

Template.viewer.onCreated(() => {
    const instance = Template.instance();

    // Attach the Window resize listener
    $(window).on('resize', handleResize);

    instance.data.state = new ReactiveDict();
    instance.data.state.set('leftSidebar', Session.get('leftSidebar'));
    instance.data.state.set('rightSidebar', Session.get('rightSidebar'));

    Meteor.subscribe('hangingprotocols');

    log.info('viewer onCreated');

    OHIF.viewer.loadIndicatorDelay = 500;
    OHIF.viewer.defaultTool = 'wwwc';
    OHIF.viewer.refLinesEnabled = true;
    OHIF.viewer.isPlaying = {};
    OHIF.viewer.cine = {
        framesPerSecond: 24,
        loop: true
    };

    OHIF.viewer.functionList = {
        invert: element => {
            const viewport = cornerstone.getViewport(element);
            viewport.invert = !viewport.invert;
            cornerstone.setViewport(element, viewport);
        },
        resetViewport: element => {
            const enabledElement = cornerstone.getEnabledElement(element);
            if (enabledElement.fitToWindow === false) {
                const imageId = enabledElement.image.imageId;
                const instance = cornerstoneTools.metaData.get('instance', imageId);

                enabledElement.viewport = cornerstone.getDefaultViewport(enabledElement.canvas, enabledElement.image);
                
                const instanceClassDefaultViewport = getInstanceClassDefaultViewport(instance, enabledElement, imageId);
                cornerstone.setViewport(element, instanceClassDefaultViewport);
            } else {
                cornerstone.reset(element);
            }
        },
        clearTools: element => {
            const toolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
            toolStateManager.clear(element);
            cornerstone.updateImage(element);
        }
    };

    if (isTouchDevice()) {
        OHIF.viewer.tooltipConfig = {
            trigger: 'manual'
        };
    } else {
        OHIF.viewer.tooltipConfig = {
            trigger: 'hover'
        };
    }

    const contentId = instance.data.contentId;

    if (ViewerData[contentId].loadedSeriesData) {
        log.info('Reloading previous loadedSeriesData');

        OHIF.viewer.loadedSeriesData = ViewerData[contentId].loadedSeriesData;

    } else {
        log.info('Setting default ViewerData');
        OHIF.viewer.loadedSeriesData = {};

        ViewerData[contentId].loadedSeriesData = OHIF.viewer.loadedSeriesData;

        // Update the viewer data object
        ViewerData[contentId].viewportColumns = 1;
        ViewerData[contentId].viewportRows = 1;
        ViewerData[contentId].activeViewport = 0;
        Session.set('ViewerData', ViewerData);
    }

    Session.set('activeViewport', ViewerData[contentId].activeViewport || 0);

    // Update the ViewerStudies collection with the loaded studies
    ViewerStudies.remove({});

    instance.data.studies.forEach(study => {
        study.selected = true;
        ViewerStudies.insert(study);
    });
});

Template.viewer.onRendered(() => {
    const instance = Template.instance();

    // Enable hotkeys
    enableHotkeys();

    const parentNode = document.getElementById('layoutManagerTarget');
    const studies = instance.data.studies;
    layoutManager = new LayoutManager(parentNode, studies);

    ProtocolEngine = new HP.ProtocolEngine(layoutManager, studies);
    HP.setEngine(ProtocolEngine);
});

Template.viewer.onDestroyed(() => {
    log.info('onDestroyed');

    // Remove the Window resize listener
    $(window).off('resize', handleResize);
});

Template.viewer.events({
    'click .js-toggle-studies'() {
        const instance = Template.instance();
        const current = instance.data.state.get('leftSidebar');
        instance.data.state.set('leftSidebar', !current);
    },
    'click .js-toggle-protocol-editor'() {
        const instance = Template.instance();
        const current = instance.data.state.get('rightSidebar');
        instance.data.state.set('rightSidebar', !current);
    },
})