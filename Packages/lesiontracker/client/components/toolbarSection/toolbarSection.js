Template.toolbarSection.onRendered(function() {
    var instance = this;

    instance.state = instance.data.state;
});

Template.toolbarSection.helpers({
    toolbarButtons: function() {
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
            classes: 'imageViewerTool',
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
    }
});

Template.toolbarSection.events({
    'click #studySidebarToggle': function(event, instance) {
        var isOpen = instance.data.state.get('studySidebarOpen');
        instance.data.state.set('studySidebarOpen', !isOpen);
    },
    'click #lesionSidebarToggle': function(event, instance) {
        var isOpen = instance.data.state.get('lesionSidebarOpen');
        instance.data.state.set('lesionSidebarOpen', !isOpen);
        instance.data.state.set('additionalMeasurementsSidebarOpen', false);
    },
    'click #additionalMeasurementsSidebarToggle': function(event, instance) {
        var isOpen = instance.data.state.get('additionalMeasurementsSidebarOpen');
        instance.data.state.set('additionalMeasurementsSidebarOpen', !isOpen);
        instance.data.state.set('lesionSidebarOpen', false);
    },
    // TODO: Inherit these from toolbar template somehow
    'click .imageViewerTool': function(e) {
        $(e.currentTarget).tooltip('hide');

        var tool = e.currentTarget.id;

        var elements = $('.imageViewerViewport');

        var activeTool = toolManager.getActiveTool();
        $('.toolbarSectionButton').removeClass('active');
        if (tool === activeTool) {
            var defaultTool = toolManager.getDefaultTool();
            console.log('Setting active tool to: ' + defaultTool);
            toolManager.setActiveTool(defaultTool, elements);
        } else {
            console.log('Setting active tool to: ' + tool);
            toolManager.setActiveTool(tool, elements);
        }
    },
    'click .imageViewerCommand': function(e) {
        $(e.currentTarget).tooltip('hide');

        var command = e.currentTarget.id;
        if (!OHIF.viewer.functionList.hasOwnProperty(command)) {
            return;
        }

        var activeViewport = Session.get('activeViewport');
        var element = $('.imageViewerViewport').get(activeViewport);
        OHIF.viewer.functionList[command](element);
    }
});

Template.toolbarSection.onRendered(function() {
    var tooltipButtons = $('[data-toggle="tooltip"]');
    tooltipButtons.tooltip(OHIF.viewer.tooltipConfig);

    // Enable tooltips for the layout button
    var extraTooltipButtons = $('[rel="tooltip"]');
    extraTooltipButtons.tooltip(OHIF.viewer.tooltipConfig);

    // Set disabled/enabled tool buttons that are set in toolManager
    var states = toolManager.getToolDefaultStates();
    var disabledToolButtons = states.disabledToolButtons;
    var allToolbarButtons = $('#toolbar').find('button');
    if (disabledToolButtons && disabledToolButtons.length > 0) {
        for (var i = 0; i < allToolbarButtons.length; i++) {
            var toolbarButton = allToolbarButtons[i];
            $(toolbarButton).prop('disabled', false);
            var index = disabledToolButtons.indexOf($(toolbarButton).attr('id'));
            if (index !== -1) {
                $(toolbarButton).prop('disabled', true);
            }
        }
    }
});
