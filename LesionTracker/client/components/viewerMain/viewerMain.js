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
            id: 'length',
            title: 'Length Measurement',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-arrows-v'
        });

        buttonData.push({
            id: 'lesion',
            title: 'Lesion Tool',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-arrows-alt'
        });

        buttonData.push({
            id: 'nonTarget',
            title: 'Non-Target Tool',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-arrows-v'
        });

        toolbarOptions.buttonData = buttonData;
        toolbarOptions.includePlayClipButton = false;
        toolbarOptions.includeLayoutButton = false;
        return toolbarOptions;
    }
});