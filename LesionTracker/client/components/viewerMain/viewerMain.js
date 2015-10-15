Template.viewerMain.helpers({
    'toolbarOptions': function() {
        var toolbarOptions = {};

        var buttonData = [];

        buttonData.push({
            id: 'wwwc',
            title: 'WW/WC',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-sun-o'
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
            id: 'lesion',
            title: 'Lesion Tool',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-arrows-v'
        });

        toolbarOptions.buttonData = buttonData;
        toolbarOptions.includePlayClipButton = true;
        toolbarOptions.includeLayoutButton = false;
        return toolbarOptions;
    }
});