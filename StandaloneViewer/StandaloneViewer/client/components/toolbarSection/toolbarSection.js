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
                bottomLabel: 'Series'
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
                bottomLabel: 'Measurements'
            }]
        };
    },

    toolbarButtons() {
        const extraTools = [];

        extraTools.push({
            id: 'crosshairs',
            title: 'Crosshairs',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-crosshairs'
        });

        extraTools.push({
            id: 'magnify',
            title: 'Magnify',
            classes: 'imageViewerTool toolbarSectionButton',
            iconClasses: 'fa fa-circle'
        });

        extraTools.push({
            id: 'wwwcRegion',
            title: 'ROI Window',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-square'
        });

        extraTools.push({
            id: 'dragProbe',
            title: 'Probe',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-dot-circle-o'
        });

        extraTools.push({
            id: 'ellipticalRoi',
            title: 'Ellipse',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-circle-o'
        });

        extraTools.push({
            id: 'rectangleRoi',
            title: 'Rectangle',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-square-o'
        });

        extraTools.push({
            id: 'invert',
            title: 'Invert',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-adjust'
        });

        extraTools.push({
            id: 'rotateR',
            title: 'Rotate Right',
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-rotate-right'
        });

        extraTools.push({
            id: 'flipH',
            title: 'Flip H',
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-flip-horizontal'
        });

        extraTools.push({
            id: 'flipV',
            title: 'Flip V',
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-flip-vertical'
        });

        extraTools.push({
            id: 'clearTools',
            title: 'Clear',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-trash'
        });

        const buttonData = [];

        buttonData.push({
            id: 'stackScroll',
            title: 'Stack Scroll',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-bars'
        });

        buttonData.push({
            id: 'zoom',
            title: 'Zoom',
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-zoom'
        });

        buttonData.push({
            id: 'wwwc',
            title: 'Levels',
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-levels'
        });

        buttonData.push({
            id: 'pan',
            title: 'Pan',
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-pan'
        });

        buttonData.push({
            id: 'length',
            title: 'Length',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-temp'
        });

        buttonData.push({
            id: 'annotate',
            title: 'Annotate',
            classes: 'imageViewerTool',
            svgLink: 'packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-non-target'
        });

        buttonData.push({
            id: 'angle',
            title: 'Angle',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-angle-left'
        });

        buttonData.push({
            id: 'resetViewport',
            title: 'Reset',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-undo'
        });

        if (!OHIF.uiSettings.displayEchoUltrasoundWorkflow) {

            buttonData.push({
                id: 'previousDisplaySet',
                title: 'Previous',
                classes: 'imageViewerCommand',
                iconClasses: 'fa fa-toggle-up fa-fw'
            });

            buttonData.push({
                id: 'nextDisplaySet',
                title: 'Next',
                classes: 'imageViewerCommand',
                iconClasses: 'fa fa-toggle-down fa-fw'
            });

            const { isPlaying } = OHIF.viewerbase.viewportUtils;
            buttonData.push({
                id: 'toggleCinePlay',
                title: () => isPlaying() ? 'Stop' : 'Play',
                classes: 'imageViewerCommand',
                iconClasses: () => ('fa fa-fw ' + (isPlaying() ? 'fa-stop' : 'fa-play')),
                active: isPlaying
            });

            buttonData.push({
                id: 'toggleCineDialog',
                title: 'CINE',
                classes: 'imageViewerCommand',
                iconClasses: 'fa fa-youtube-play',
                active: () => $('#cineDialog').is(':visible')
            });
        }

        buttonData.push({
            id: 'layout',
            title: 'Layout',
            iconClasses: 'fa fa-th-large',
            buttonTemplateName: 'layoutButton'
        });

        buttonData.push({
            id: 'toggleMore',
            title: 'More',
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
            title: 'Prev. Stage',
            iconClasses: 'fa fa-step-backward',
            buttonTemplateName: 'previousPresentationGroupButton'
        });

        buttonData.push({
            id: 'nextPresentationGroup',
            title: 'Next Stage',
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
