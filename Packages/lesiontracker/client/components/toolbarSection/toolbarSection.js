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
                svgLink: '/packages/viewerbase/assets/icons.svg#icon-studies',
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
                value: 'lesions',
                svgLink: '/packages/viewerbase/assets/icons.svg#icon-measurements-lesions',
                svgWidth: 18,
                svgHeight: 10,
                bottomLabel: 'Lesions'
            }, {
                value: 'additional',
                svgLink: '/packages/viewerbase/assets/icons.svg#icon-measurements-additional',
                svgWidth: 14,
                svgHeight: 13,
                bottomLabel: 'Additional'
            }]
        };
    },

    toolbarButtons() {
        // Check if the measure tools shall be disabled
        const isMesureDisabled = !Template.instance().data.timepointApi.currentTimepointId;
        const buttonData = [];

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
            id: 'link',
            title: 'Link',
            classes: 'imageViewerCommand toolbarSectionButton',
            svgLink: '/packages/viewerbase/assets/icons.svg#icon-tools-link'
        });

        buttonData.push({
            id: 'bidirectional',
            title: 'Target',
            classes: 'imageViewerTool rm-l-3',
            svgLink: '/packages/viewerbase/assets/icons.svg#icon-tools-measure-target',
            disabled: isMesureDisabled
        });

        buttonData.push({
            id: 'nonTarget',
            title: 'Non-Target',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/viewerbase/assets/icons.svg#icon-tools-measure-non-target',
            disabled: isMesureDisabled
        });

        buttonData.push({
            id: 'length',
            title: 'Temp',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/viewerbase/assets/icons.svg#icon-tools-measure-temp'
        });

        return buttonData;
    },

    extraToolbarButtons() {
        // Check if the measure tools shall be disabled
        const isMesureDisabled = !Template.instance().data.timepointApi.currentTimepointId;
        const buttonData = [];

        // TODO: Get real icons for CR / UN / EX
        buttonData.push({
            id: 'crTool',
            title: 'CR Tool',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/viewerbase/assets/icons.svg#icon-tools-measure-temp',
            disabled: isMesureDisabled
        });

        buttonData.push({
            id: 'unTool',
            title: 'UN Tool',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/viewerbase/assets/icons.svg#icon-tools-measure-temp',
            disabled: isMesureDisabled
        });

        buttonData.push({
            id: 'exTool',
            title: 'EX Tool',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/viewerbase/assets/icons.svg#icon-tools-measure-temp',
            disabled: isMesureDisabled
        });

        return buttonData;
    }
});

Template.toolbarSection.events({
    'click #toggleHUD'() {
        const state = Session.get('lesionTableHudOpen');
        Session.set('lesionTableHudOpen', !state);
    }
});

Template.toolbarSection.onRendered(function() {
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
