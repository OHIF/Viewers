import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:viewerbase';

Template.toolbarSection.onCreated(() => {
    const instance = Template.instance();

    if (OHIF.uiSettings.leftSidebarOpen) {
        instance.data.state.set('leftSidebar', 'studies');
    }
});

Template.toolbarSection.helpers({
    leftSidebarToggleButtonData() {
        const instance = Template.instance();
        return {
            toggleable: true,
            key: 'leftSidebar',
            value: instance.data.state,
            options: [{
                value: 'studies',
                svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-studies',
                svgWidth: 15,
                svgHeight: 13,
                bottomLabel: TAPi18n.__('Series')
            }]
        };
    },

    rightSidebarToggleButtonData() {
        const instance = Template.instance();
        return {
            toggleable: true,
            key: 'rightSidebar',
            value: instance.data.state,
            options: [{
                value: 'measurements',
                svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-measurements-lesions',
                svgWidth: 18,
                svgHeight: 10,
                bottomLabel: TAPi18n.__('Measurements')
            }]
        };
    },

    toolbarButtons() {
        const extraTools = [];

        extraTools.push({
            id: 'crosshairs',
            title: TAPi18n.__('Crosshairs'),
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-crosshairs'
        });

        extraTools.push({
            id: 'magnify',
            title: TAPi18n.__('Magnify'),
            classes: 'imageViewerTool toolbarSectionButton',
            iconClasses: 'fa fa-circle'
        });

        extraTools.push({
            id: 'wwwcRegion',
            title: TAPi18n.__('ROI Window'),
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-square'
        });

        extraTools.push({
            id: 'dragProbe',
            title: TAPi18n.__('Probe'),
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-dot-circle-o'
        });

        extraTools.push({
            id: 'ellipticalRoi',
            title: TAPi18n.__('Ellipse'),
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-circle-o'
        });

        extraTools.push({
            id: 'rectangleRoi',
            title: TAPi18n.__('Rectangle'),
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-square-o'
        });

        extraTools.push({
            id: 'invert',
            title: TAPi18n.__('Invert'),
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-adjust'
        });

        extraTools.push({
            id: 'rotateR',
            title: TAPi18n.__('Rotate Right'),
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-rotate-right'
        });

        extraTools.push({
            id: 'flipH',
            title: TAPi18n.__('Flip H'),
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-flip-horizontal'
        });

        extraTools.push({
            id: 'flipV',
            title: TAPi18n.__('Flip V'),
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-flip-vertical'
        });

        extraTools.push({
            id: 'clearTools',
            title: TAPi18n.__('Clear'),
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-trash'
        });

        const buttonData = [];

        buttonData.push({
            id: 'stackScroll',
            title: TAPi18n.__('Stack Scroll'),
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-bars'
        });

        buttonData.push({
            id: 'zoom',
            title: TAPi18n.__('Zoom'),
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-zoom'
        });

        buttonData.push({
            id: 'wwwc',
            title: TAPi18n.__('Levels'),
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-levels'
        });

        buttonData.push({
            id: 'pan',
            title: TAPi18n.__('Pan'),
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-pan'
        });

        buttonData.push({
            id: 'length',
            title: TAPi18n.__('Length'),
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-temp'
        });

        buttonData.push({
            id: 'annotate',
            title: TAPi18n.__('Annotate'),
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-non-target'
        });

        buttonData.push({
            id: 'angle',
            title: TAPi18n.__('Angle'),
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-angle-left'
        });

        buttonData.push({
            id: 'resetViewport',
            title: TAPi18n.__('Reset'),
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-undo'
        });

        if (!OHIF.uiSettings.displayEchoUltrasoundWorkflow) {

            buttonData.push({
                id: 'previousDisplaySet',
                title: TAPi18n.__('Previous'),
                classes: 'imageViewerCommand',
                iconClasses: 'fa fa-toggle-up fa-fw'
            });

            buttonData.push({
                id: 'nextDisplaySet',
                title: TAPi18n.__('Next'),
                classes: 'imageViewerCommand',
                iconClasses: 'fa fa-toggle-down fa-fw'
            });

            const { isPlaying } = OHIF.viewerbase.viewportUtils;
            buttonData.push({
                id: 'toggleCinePlay',
                title: () => isPlaying() ? TAPi18n.__('Stop') : TAPi18n.__('Play'),
                classes: 'imageViewerCommand',
                iconClasses: () => ('fa fa-fw ' + (isPlaying() ? 'fa-stop' : 'fa-play')),
                active: isPlaying
            });

            buttonData.push({
                id: 'toggleCineDialog',
                title: TAPi18n.__('CINE'),
                classes: 'imageViewerCommand',
                iconClasses: 'fa fa-youtube-play',
                active: () => $('#cineDialog').is(':visible')
            });
        }

        buttonData.push({
            id: 'layout',
            title: TAPi18n.__('Layout'),
            iconClasses: 'fa fa-th-large',
            buttonTemplateName: 'layoutButton'
        });

        buttonData.push({
            id: 'toggleMore',
            title: TAPi18n.__('More'),
            classes: 'rp-x-1 rm-l-3',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-more',
            subTools: extraTools
        });

        return buttonData;
    },

    hangingProtocolButtons() {
        let buttonData = [];

        buttonData.push({
            id: 'previousPresentationGroup',
            title: TAPi18n.__('Prev. Stage'),
            iconClasses: 'fa fa-step-backward',
            buttonTemplateName: 'previousPresentationGroupButton'
        });

        buttonData.push({
            id: 'nextPresentationGroup',
            title: TAPi18n.__('Next Stage'),
            iconClasses: 'fa fa-step-forward',
            buttonTemplateName: 'nextPresentationGroupButton'
        });

        return buttonData;
    }

});

Template.toolbarSection.onRendered(function() {
    const instance = Template.instance();

    instance.$('#layout').dropdown();

    // Set disabled/enabled tool buttons that are set in toolManager
    const states = OHIF.viewerbase.toolManager.getToolDefaultStates();
    const disabledToolButtons = states.disabledToolButtons;
    const allToolbarButtons = $('#toolbar').find('button');
    if (disabledToolButtons && disabledToolButtons.length > 0) {
        for (let i = 0; i < allToolbarButtons.length; i++) {
            const toolbarButton = allToolbarButtons[i];
            $(toolbarButton).prop('disabled', false);

            const index = disabledToolButtons.indexOf($(toolbarButton).attr('id'));
            if (index !== -1) {
                $(toolbarButton).prop('disabled', true);
            }
        }
    }
});
