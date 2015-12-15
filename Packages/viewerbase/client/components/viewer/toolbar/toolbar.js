function getDefaultButtonData() {
    var buttonData = [];

    buttonData.push({
        id: 'wwwc',
        title: 'WW/WC',
        classes: 'imageViewerTool',
        iconClasses: 'fa fa-sun-o'
    });

    buttonData.push({
        id: 'wwwcRegion',
        title: 'Window by Region',
        classes: 'imageViewerTool',
        iconClasses: 'fa fa-square'
    });

    buttonData.push({
        id: 'magnify',
        title: 'Magnify',
        classes: 'imageViewerTool',
        iconClasses: 'fa fa-circle'
    });

    buttonData.push({
        id: 'annotate',
        title: 'Annotation',
        classes: 'imageViewerTool',
        iconClasses: 'fa fa-arrows-h'
    });

    buttonData.push({
        id: 'invert',
        title: 'Invert',
        classes: 'imageViewerCommand',
        iconClasses: 'fa fa-adjust'
    });

    buttonData.push({
        id: 'zoom',
        title: 'Zoom',
        classes: 'imageViewerTool',
        iconClasses: 'fa fa-search'
    });

    buttonData.push({
        id: 'pan',
        title: 'Pan',
        classes: 'imageViewerTool',
        iconClasses: 'fa fa-arrows'
    });

    buttonData.push({
        id: 'stackScroll',
        title: 'Stack Scroll',
        classes: 'imageViewerTool',
        iconClasses: 'fa fa-bars'
    });

    buttonData.push({
        id: 'length',
        title: 'Length Measurement',
        classes: 'imageViewerTool',
        iconClasses: 'fa fa-arrows-v'
    });

    buttonData.push({
        id: 'angle',
        title: 'Angle Measurement',
        classes: 'imageViewerTool',
        iconClasses: 'fa fa-angle-left'
    });

    buttonData.push({
        id: 'dragProbe',
        title: 'Pixel Probe',
        classes: 'imageViewerTool',
        iconClasses: 'fa fa-dot-circle-o'
    });

    buttonData.push({
        id: 'ellipticalRoi',
        title: 'Elliptical ROI',
        classes: 'imageViewerTool',
        iconClasses: 'fa fa-circle-o'
    });

    buttonData.push({
        id: 'rectangleRoi',
        title: 'Rectangle ROI',
        classes: 'imageViewerTool',
        iconClasses: 'fa fa-square-o'
    });

    buttonData.push({
        id: 'resetViewport',
        title: 'Reset Viewport',
        classes: 'imageViewerCommand',
        iconClasses: 'fa fa-undo'
    });

    buttonData.push({
        id: 'clearTools',
        title: 'Clear tools',
        classes: 'imageViewerCommand',
        iconClasses: 'fa fa-trash'
    });
    return buttonData;
}

Template.toolbar.events({
    'click .imageViewerTool': function(e) {
        $(e.currentTarget).tooltip('hide');

        var tool = e.currentTarget.id;

        var elements = $('.imageViewerViewport');

        var activeTool = toolManager.getActiveTool();
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

Template.toolbar.onRendered(function() {
    var tooltipButtons = $('[data-toggle="tooltip"]');
    tooltipButtons.tooltip(OHIF.viewer.tooltipConfig);

    // Enable tooltips for the layout button
    var extraTooltipButtons = $('[rel="tooltip"]');
    extraTooltipButtons.tooltip(OHIF.viewer.tooltipConfig);
});

Template.toolbar.helpers({
    'button': function() {
        if (this.toolbarOptions && this.toolbarOptions.buttonData) {
            return this.toolbarOptions.buttonData;
        }
        return getDefaultButtonData();
    },
    'includePlayClipButton': function() {
        if (this.toolbarOptions && this.toolbarOptions.includePlayClipButton !== undefined) {
            return this.toolbarOptions.includePlayClipButton;
        }
        return true;
    },
    'includeLayoutButton': function() {
        if (this.toolbarOptions && this.toolbarOptions.includeLayoutButton !== undefined) {
            return this.toolbarOptions.includeLayoutButton;
        }
        return true;
    },
    'includeHangingProtocolButtons': function() {
        if (this.toolbarOptions && this.toolbarOptions.includeHangingProtocolButtons !== undefined) {
            return this.toolbarOptions.includeHangingProtocolButtons;
        }
        return true;
    }
});