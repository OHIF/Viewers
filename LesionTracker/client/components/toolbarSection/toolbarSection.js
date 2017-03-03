import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';
import { Viewerbase } from 'meteor/ohif:viewerbase';

Template.toolbarSection.helpers({
    // Returns true if the view shall be split in two viewports
    splitView() {
        // Run this computation every time the viewports are updated
        Session.get('LayoutManagerUpdated');

        // Stops here if layout manager is not defined yet
        if (!Viewerbase.layoutManager) {
            return;
        }

        return Viewerbase.layoutManager.viewportData.length > 1;
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

        const targetSubTools = [];

        targetSubTools.push({
            id: 'bidirectional',
            title: 'Bidirectional',
            classes: 'imageViewerTool rm-l-3',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-target',
            disabled: isToolDisabled
        });

        targetSubTools.push({
            id: 'targetCR',
            title: 'CR Target',
            classes: 'imageViewerTool',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-target-cr',
            disabled: isToolDisabled
        });

        targetSubTools.push({
            id: 'targetUN',
            title: 'UN Target',
            classes: 'imageViewerTool',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-target-un',
            disabled: isToolDisabled
        });

        const extraTools = [];

        extraTools.push({
            id: 'stackScroll',
            title: 'Stack Scroll',
            classes: 'imageViewerTool',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-stack-scroll'
        });

        extraTools.push({
            id: 'resetViewport',
            title: 'Reset',
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-reset'
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
            id: 'invert',
            title: 'Invert',
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-invert'
        });

        extraTools.push({
            id: 'magnify',
            title: 'Magnify',
            classes: 'imageViewerTool',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-magnify'
        });

        extraTools.push({
            id: 'ellipticalRoi',
            title: 'Ellipse',
            classes: 'imageViewerTool',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-elliptical-roi'
        });

        extraTools.push({
            id: 'toggleCineDialog',
            title: 'CINE',
            classes: 'imageViewerCommand',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-cineplay-toggle',
            disableFunction: Viewerbase.viewportUtils.hasMultipleFrames
        });

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

        buttonData.push({
            id: 'linkStackScroll',
            title: 'Link',
            classes: 'imageViewerCommand toolbarSectionButton nonAutoDisableState',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-link',
            disableFunction: Viewerbase.viewportUtils.isStackScrollLinkingDisabled
        });

        buttonData.push({
            id: 'toggleTarget',
            title: 'Target',
            classes: 'rm-l-3',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-target',
            disabled: isToolDisabled,
            subTools: targetSubTools
        });

        buttonData.push({
            id: 'nonTarget',
            title: 'Non-Target',
            classes: 'imageViewerTool',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-non-target',
            disabled: isToolDisabled
        });

        buttonData.push({
            id: 'length',
            title: 'Temp',
            classes: 'imageViewerTool',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-measure-temp'
        });

        buttonData.push({
            id: 'toggleMore',
            title: 'More',
            classes: 'rp-x-1 rm-l-3',
            svgLink: '/packages/ohif_viewerbase/assets/icons.svg#icon-tools-more',
            disabled: isToolDisabled,
            subTools: extraTools
        });

        return buttonData;
    }
});

Template.toolbarSection.events({
    'click #toggleTarget'(event, instance) {
        const $target = $(event.currentTarget);
        if (!$target.hasClass('active') && $target.hasClass('expanded')) {
            Viewerbase.toolManager.setActiveTool('bidirectional');
        }
    },

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
        if (!$(event.currentTarget).hasClass('disabled')) {
            OHIF.ui.showDialog('trialOptionsModal');
        }
    }
});

Template.toolbarSection.onRendered(function() {
    // Set disabled/enabled tool buttons that are set in toolManager
    const states = Viewerbase.toolManager.getToolDefaultStates();
    const disabledToolButtons = states.disabledToolButtons;
    const allToolbarButtons = $('.toolbarSection').find('.toolbarSectionButton:not(.nonAutoDisableState)');

    // Additional toolbar buttons whose classes are not toolbarSectionButton
    allToolbarButtons.push($('#toolbarSectionEntry')[0]);
    allToolbarButtons.push($('#toggleMeasurements')[0]);

    if (disabledToolButtons && disabledToolButtons.length > 0) {
        for (let i = 0; i < allToolbarButtons.length; i++) {
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
