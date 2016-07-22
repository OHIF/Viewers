import { OHIF } from 'meteor/ohif:core';

Template.toolbarSection.helpers({
    // Returns true if the view shall be split in two viewports
    splitView() {
        // Stops here if layout manager is not defined yet
        if (!window.layoutManager) {
            return;
        }

        // Run this computation every time the viewports are updated
        Session.get('LayoutManagerUpdated');

        return layoutManager.viewportData.length > 1;
    },

    leftSidebarToggleButtonData() {
        const instance = Template.instance();
        return {
            toggleable: true,
            key: 'leftSidebar',
            value: instance.data.state,
            options: [{
                value: 'studies',
                svgLink: '/packages/lesiontracker/assets/icons.svg#icon-studies',
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
                svgLink: '/packages/lesiontracker/assets/icons.svg#icon-measurements-lesions',
                svgWidth: 18,
                svgHeight: 10,
                bottomLabel: 'Lesions'
            }, {
                value: 'additional',
                svgLink: '/packages/lesiontracker/assets/icons.svg#icon-measurements-additional',
                svgWidth: 14,
                svgHeight: 13,
                bottomLabel: 'Additional'
            }]
        };
    },

    toolbarButtons() {
        var buttonData = [];
        buttonData.push({
            id: 'zoom',
            title: 'Zoom',
            classes: 'imageViewerTool',
            svgLink: '/packages/lesiontracker/assets/icons.svg#icon-tools-zoom'
        });

        buttonData.push({
            id: 'wwwc',
            title: 'Levels',
            classes: 'imageViewerTool',
            svgLink: '/packages/lesiontracker/assets/icons.svg#icon-tools-levels'
        });

        buttonData.push({
            id: 'pan',
            title: 'Pan',
            classes: 'imageViewerTool',
            svgLink: '/packages/lesiontracker/assets/icons.svg#icon-tools-pan'
        });

        buttonData.push({
            id: 'link',
            title: 'Link',
            classes: 'imageViewerCommand toolbarSectionButton',
            svgLink: '/packages/lesiontracker/assets/icons.svg#icon-tools-link'
        });

        buttonData.push({
            id: 'bidirectional',
            title: 'Target',
            classes: 'imageViewerTool rm-l-3',
            svgLink: '/packages/lesiontracker/assets/icons.svg#icon-tools-measure-target'
        });

        buttonData.push({
            id: 'nonTarget',
            title: 'Non-Target',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/lesiontracker/assets/icons.svg#icon-tools-measure-non-target'
        });

        buttonData.push({
            id: 'length',
            title: 'Temp',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/lesiontracker/assets/icons.svg#icon-tools-measure-temp'
        });

        return buttonData;
    },

    extraToolbarButtons() {
        let buttonData = [];

        // TODO: Get real icons for CR / UN / EX
        buttonData.push({
            id: 'crTool',
            title: 'CR Tool',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/lesiontracker/assets/icons.svg#icon-tools-measure-temp'
        });

        buttonData.push({
            id: 'unTool',
            title: 'UN Tool',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/lesiontracker/assets/icons.svg#icon-tools-measure-temp'
        });
        
        buttonData.push({
            id: 'exTool',
            title: 'EX Tool',
            classes: 'imageViewerTool toolbarSectionButton',
            svgLink: '/packages/lesiontracker/assets/icons.svg#icon-tools-measure-temp'
        });

        return buttonData;   
    }

});

Template.toolbarSection.events({
    'click #toggleHUD'(event, instance) {
        const state = Session.get('lesionTableHudOpen');
        Session.set('lesionTableHudOpen', !state);
    },
    'click #moreTools'(event, instance) {
        const $target = $(event.currentTarget);
        const isActive = $target.hasClass('active');
        $target.toggleClass('active', !isActive);
        $target.closest('.toolbarSection').toggleClass('expanded', !isActive);
    }
});

Template.toolbarSection.onRendered(function() {
    const instance = Template.instance();
    const tooltipButtons = instance.$('[data-toggle="tooltip"]');
    tooltipButtons.tooltip(OHIF.viewer.tooltipConfig);

    // Enable tooltips for the layout button
    const extraTooltipButtons = instance.$('[rel="tooltip"]');
    extraTooltipButtons.tooltip(OHIF.viewer.tooltipConfig);

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
