import { OHIF } from 'meteor/ohif:core';

Template.toolbarSection.helpers({
    // Returns true if the view shall be split in two viewports
    splitView() {
        // Run this computation every time the viewports are updated
        Session.get('LayoutManagerUpdated');

        // Stops here if layout manager is not defined yet
        if (!window.layoutManager) {
            return;
        }

        return window.layoutManager.viewportData.length > 1;
    },

    leftSidebarToggleButtonData() {
        const instance = Template.instance();
        return {
            toggleable: true,
            key: 'leftSidebar',
            value: instance.data.state,
            options: [{
                value: 'studies',
                svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-studies',
                svgWidth: 15,
                svgHeight: 13,
                bottomLabel: 'Studies'
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
        // Check if the measure tools shall be disabled
        const isToolDisabled = false; //!Template.instance().data.timepointApi;

        const buttonData = [];

        buttonData.push({
            id: 'zoom',
            title: 'Zoom',
            classes: 'imageViewerTool',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-zoom'
        });

        buttonData.push({
            id: 'wwwc',
            title: 'Levels',
            classes: 'imageViewerTool',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-levels'
        });

        buttonData.push({
            id: 'pan',
            title: 'Pan',
            classes: 'imageViewerTool',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-pan'
        });

        /*
        TODO: design the link functionality
        Commenting this out until we build this tool
        buttonData.push({
            id: 'link',
            title: 'Link',
            classes: 'imageViewerCommand toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-link'
        });*/

        buttonData.push({
            id: 'bidirectional',
            title: 'Target',
            classes: 'imageViewerTool rm-l-3',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-target',
            disabled: isToolDisabled
        });

        buttonData.push({
            id: 'nonTarget',
            title: 'Non-Target',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-non-target',
            disabled: isToolDisabled
        });

        buttonData.push({
            id: 'length',
            title: 'Temp',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-temp'
        });

        return buttonData;
    },

    extraToolbarButtons() {
        // Check if the measure tools shall be disabled
        const isToolDisabled = !Template.instance().data.timepointApi.currentTimepointId;
        const buttonData = [];

        buttonData.push({
            id: 'stackScroll',
            title: 'Stack Scroll',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-stack-scroll'
        });

        buttonData.push({
            id: 'resetViewport',
            title: 'Reset',
            classes: 'imageViewerCommand toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-reset'
        });

        buttonData.push({
            id: 'rotateR',
            title: 'Rotate Right',
            classes: 'imageViewerCommand toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-rotate-right'
        });

        buttonData.push({
            id: 'flipH',
            title: 'Flip H',
            classes: 'imageViewerCommand toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-flip-horizontal'
        });

        buttonData.push({
            id: 'flipV',
            title: 'Flip V',
            classes: 'imageViewerCommand toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-flip-vertical'
        });

        buttonData.push({
            id: 'invert',
            title: 'Invert',
            classes: 'imageViewerCommand toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-invert'
        });

        buttonData.push({
            id: 'magnify',
            title: 'Magnify',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-magnify'
        });

        buttonData.push({
            id: 'ellipticalRoi',
            title: 'Ellipse',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-elliptical-roi'
        });

        buttonData.push({
            id: 'toggleCineDialog',
            title: 'CINE',
            classes: 'imageViewerCommand toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-cineplay-toggle',
            disableFunction: hasMultipleFrames
        });

        // TODO: Get real icons for CR / UN / EX
        buttonData.push({
            id: 'targetCR',
            title: 'CR Target',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-temp',
            disabled: isToolDisabled
        });

        buttonData.push({
            id: 'targetUN',
            title: 'UN Target',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-temp',
            disabled: isToolDisabled
        });

        buttonData.push({
            id: 'targetEX',
            title: 'EX Target',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-temp',
            disabled: isToolDisabled
        });

        return buttonData;
    }
});

Template.toolbarSection.events({
    'click #toggleHUD'(event) {
        const $this = $(event.currentTarget);

        // Stop here if the tool is disabled
        if ($this.hasClass('disabled')) {
            return;
        }

        const state = Session.get('measurementTableHudOpen');
        Session.set('measurementTableHudOpen', !state);
    },
    'click #toggleTrial'(event) {
        const $this = $(event.currentTarget);

        // Stop here if the tool is disabled
        if ($this.hasClass('disabled')) {
            return;
        }

        $('#optionsModal').modal();
    }
});

Template.toolbarSection.onRendered(function() {
    // Set disabled/enabled tool buttons that are set in toolManager
    const states = toolManager.getToolDefaultStates();
    const disabledToolButtons = states.disabledToolButtons;
    const allToolbarButtons = $('.toolbarSection').find('.toolbarSectionButton');

    // Additional toolbar buttons whose classes are not toolbarSectionButton
    allToolbarButtons.push($('#toolbarSectionEntry')[0]);
    allToolbarButtons.push($('#toggleMeasurements')[0]);

    if (disabledToolButtons && disabledToolButtons.length > 0) {
        for (var i = 0; i < allToolbarButtons.length; i++) {
            const toolbarButton = allToolbarButtons[i];
            const index = disabledToolButtons.indexOf($(toolbarButton).attr('id'));
            if (index !== -1) {
                $(toolbarButton).addClass('disabled');
                $(toolbarButton).find('*').addClass('disabled');
            } else {
                $(toolbarButton).removeClass('disabled');
                $(toolbarButton).find('*').removeClass('disabled');
            }
        }
    }
});
