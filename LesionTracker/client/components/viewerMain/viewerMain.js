Template.viewerMain.helpers({
    'toolbarOptions': function() {
        var toolbarOptions = {};

        var buttonData = [];

        buttonData.push({
            id: 'resetViewport',
            title: 'Reset Viewport',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-undo'
        });

        buttonData.push({
            id: 'wwwc',
            title: 'WW/WC',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-sun-o'
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
            id: 'scaleOverlayTool',
            title: 'Scale Overlay',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-arrows-h'
        });

        buttonData.push({
            id: 'length',
            title: 'Length Measurement',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-arrows-v'
        });

        buttonData.push({
            id: 'lesion',
            title: 'Target Tool',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-arrows-alt'
        });

        buttonData.push({
            id: 'nonTarget',
            title: 'Non-Target Tool',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-long-arrow-up'
        });

        buttonData.push({
            id: 'clearTools',
            title: 'Clear tools',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-trash'
        });

        buttonData.push({
            id: 'toggleLesionTrackerTools',
            title: 'Show / hide tools',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-eye'
        });

        toolbarOptions.buttonData = buttonData;
        toolbarOptions.includePlayClipButton = false;
        toolbarOptions.includeLayoutButton = false;
        toolbarOptions.includeHangingProtocolButtons = false;
        return toolbarOptions;
    }
});