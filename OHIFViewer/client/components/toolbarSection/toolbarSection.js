import { OHIF } from 'meteor/ohif:core';

Template.toolbarSection.helpers({
    leftSidebarToggleButtonData() {
        const instance = Template.instance();
        return {
            toggleable: true,
            key: 'leftSidebar',
            value: instance.data.state,
            options: [{
                value: 'studies',
                svgLink: '/packages/viewerbase/assets/icons.svg#icon-studies',
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
                value: 'hangingprotocols',
                iconClasses: 'fa fa-cog',
                bottomLabel: 'Hanging'
            }]
        };
    },

    toolbarButtons() {
        var buttonData = [];
        buttonData.push({
            id: 'zoom',
            title: 'Zoom',
            classes: 'imageViewerTool',
            svgLink: '/packages/viewerbase/assets/icons.svg#icon-tools-zoom'
        });

        buttonData.push({
            id: 'wwwc',
            title: 'Levels',
            classes: 'imageViewerTool',
            svgLink: '/packages/viewerbase/assets/icons.svg#icon-tools-levels'
        });

        buttonData.push({
            id: 'pan',
            title: 'Pan',
            classes: 'imageViewerTool',
            svgLink: '/packages/viewerbase/assets/icons.svg#icon-tools-pan'
        });

        buttonData.push({
            id: 'length',
            title: 'Length',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/viewerbase/assets/icons.svg#icon-tools-measure-temp'
        });

        buttonData.push({
            id: 'annotate',
            title: 'Annotate',
            classes: 'imageViewerTool',
            svgLink: '/packages/viewerbase/assets/icons.svg#icon-tools-measure-non-target'
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

        buttonData.push({
            id: 'toggleCinePlay',
            title: 'Toggle CINE Play',
            classes: 'imageViewerCommand',
            buttonTemplateName: 'playClipButton'
        });

        buttonData.push({
            id: 'toggleCineDialog',
            title: 'CINE',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-youtube-play'
        });

        buttonData.push({
            id: 'layout',
            title: 'Layout',
            iconClasses: 'fa fa-th-large',
            buttonTemplateName: 'layoutButton'
        });

        return buttonData;
    },

    extraToolbarButtons() {
        let buttonData = [];

        buttonData.push({
            id: 'stackScroll',
            title: 'Stack Scroll',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-bars'
        });

        buttonData.push({
            id: 'magnify',
            title: 'Magnify',
            classes: 'imageViewerTool toolbarSectionButton',
            iconClasses: 'fa fa-circle'
        });
        
        buttonData.push({
            id: 'wwwcRegion',
            title: 'ROI Window',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-square'
        });

        buttonData.push({
            id: 'dragProbe',
            title: 'Probe',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-dot-circle-o'
        });

        buttonData.push({
            id: 'ellipticalRoi',
            title: 'Ellipse',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-circle-o'
        });

        buttonData.push({
            id: 'rectangleRoi',
            title: 'Rectangle',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-square-o'
        });

        buttonData.push({
            id: 'invert',
            title: 'Invert',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-adjust'
        });

        buttonData.push({
            id: 'clearTools',
            title: 'Clear',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-trash'
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
    const states = toolManager.getToolDefaultStates();
    const disabledToolButtons = states.disabledToolButtons;
    const allToolbarButtons = $('#toolbar').find('button');
    if (disabledToolButtons && disabledToolButtons.length > 0) {
        for (var i = 0; i < allToolbarButtons.length; i++) {
            const toolbarButton = allToolbarButtons[i];
            $(toolbarButton).prop('disabled', false);

            const index = disabledToolButtons.indexOf($(toolbarButton).attr('id'));
            if (index !== -1) {
                $(toolbarButton).prop('disabled', true);
            }
        }
    }
});
